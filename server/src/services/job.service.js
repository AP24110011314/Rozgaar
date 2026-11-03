import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Company } from '../models/Company.js';
import { Application } from '../models/Application.js';
import { Report } from '../models/Report.js';
import { AppError } from '../utils/appError.js';

export class JobService {
  /**
   * Public Geo-Aware Job Search
   */
  async searchJobs(params) {
    const {
      q,
      city,
      lat,
      lng,
      radiusKm = 25,
      type,
      remote,
      minSalary,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = params;

    const skip = (page - 1) * limit;
    const hasCoordinates = typeof lat === 'number' && typeof lng === 'number';

    if (hasCoordinates) {
      // Geo-spatial Search with $geoNear aggregation
      const radiusMeters = radiusKm * 1000;
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters,
            spherical: true,
            query: { status: 'open' },
          },
        },
      ];

      const matchFilter = {};

      if (q) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        matchFilter.$or = [
          { title: regex },
          { description: regex },
          { skills: regex },
        ];
      }

      if (city) {
        matchFilter['location.city'] = new RegExp(city.trim(), 'i');
      }

      if (type) {
        matchFilter.employmentType = type;
      }

      if (remote !== undefined) {
        matchFilter.remote = remote;
      }

      if (minSalary !== undefined) {
        matchFilter['salary.min'] = { $gte: minSalary };
      }

      if (Object.keys(matchFilter).length > 0) {
        pipeline.push({ $match: matchFilter });
      }

      // Sort
      if (sort === 'newest') {
        pipeline.push({ $sort: { publishedAt: -1 } });
      } else {
        pipeline.push({ $sort: { distanceMeters: 1 } });
      }

      // Count total matches before pagination
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Job.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Pagination & populate company
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
      pipeline.push({
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company',
        },
      });
      pipeline.push({
        $unwind: { path: '$company', preserveNullAndEmptyArrays: true },
      });

      const jobs = await Job.aggregate(pipeline);

      return {
        jobs,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // Standard Non-Geo Search
    const filter = { status: 'open' };

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { skills: regex },
      ];
    }

    if (city) {
      filter['location.city'] = new RegExp(city.trim(), 'i');
    }

    if (type) {
      filter.employmentType = type;
    }

    if (remote !== undefined) {
      filter.remote = remote;
    }

    if (minSalary !== undefined) {
      filter['salary.min'] = { $gte: minSalary };
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('company', 'name slug website logoKey location')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      jobs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single job by ID (public)
   */
  async getJobById(jobId) {
    const job = await Job.findById(jobId).populate(
      'company',
      'name slug description website logoKey location'
    );

    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    return job;
  }

  /**
   * Create a job listing (Recruiter)
   */
  async createJob(user, data) {
    if (!user.company) {
      throw AppError.forbidden('You must belong to a registered company to post jobs');
    }

    const companyId = user.company._id || user.company;
    const isOpening = data.status === 'open';

    const job = new Job({
      ...data,
      company: companyId,
      publishedAt: isOpening ? new Date() : null,
    });

    await job.save();
    return job.populate('company', 'name slug logoKey location');
  }

  /**
   * Update a job listing (Recruiter)
   */
  async updateJob(user, jobId, updateData) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    const userCompanyId = user.company?._id?.toString() || user.company?.toString();
    if (job.company.toString() !== userCompanyId && user.role !== 'admin') {
      throw AppError.forbidden('You do not have permission to modify this job');
    }

    // If publishing for the first time
    if (updateData.status === 'open' && !job.publishedAt) {
      job.publishedAt = new Date();
    }

    Object.assign(job, updateData);
    await job.save();

    return job.populate('company', 'name slug logoKey location');
  }

  /**
   * Change job status: 'draft', 'open', 'closed' (Recruiter)
   */
  async changeJobStatus(user, jobId, status) {
    return this.updateJob(user, jobId, { status });
  }

  /**
   * Delete a job listing (Recruiter)
   */
  async deleteJob(user, jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    const userCompanyId = user.company?._id?.toString() || user.company?.toString();
    if (job.company.toString() !== userCompanyId && user.role !== 'admin') {
      throw AppError.forbidden('You do not have permission to delete this job');
    }

    // Delete associated applications
    await Application.deleteMany({ job: jobId });

    // Delete the job
    await Job.findByIdAndDelete(jobId);

    return { message: 'Job listing and applications removed successfully' };
  }

  /**
   * Report a job (Public / Logged-in User)
   */
  async reportJob(userId, jobId, { reason, text }) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    const existingReport = await Report.findOne({ job: jobId, reporter: userId });
    if (existingReport) {
      throw AppError.conflict('You have already submitted a report for this job listing');
    }

    const report = await Report.create({
      job: jobId,
      reporter: userId,
      reason,
      text,
      status: 'pending',
    });

    return report;
  }

  /**
   * Get all recruiter's jobs for their company
   */
  async getRecruiterJobs(companyId) {
    const jobs = await Job.find({ company: companyId })
      .populate('company', 'name slug')
      .sort({ createdAt: -1 });

    return jobs;
  }
}

export const jobService = new JobService();

