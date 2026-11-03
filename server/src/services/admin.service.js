import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Report } from '../models/Report.js';
import { AppError } from '../utils/appError.js';

export class AdminService {
  async getStats() {
    const [
      totalUsers,
      totalApplicants,
      totalRecruiters,
      totalCompanies,
      openJobs,
      totalJobs,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'applicant' }),
      User.countDocuments({ role: 'recruiter' }),
      Company.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);

    return {
      users: { total: totalUsers, applicants: totalApplicants, recruiters: totalRecruiters },
      companies: { total: totalCompanies },
      jobs: { open: openJobs, total: totalJobs },
      reports: { pending: pendingReports },
    };
  }

  async getUsers({ q, role, page = 1, limit = 20 }) {
    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('company', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async toggleUserActive(adminUserId, targetUserId) {
    if (adminUserId.toString() === targetUserId.toString()) {
      throw AppError.badRequest('You cannot deactivate your own admin account');
    }

    const target = await User.findById(targetUserId);
    if (!target) {
      throw AppError.notFound('User not found');
    }

    target.isActive = !target.isActive;
    await target.save();

    return target;
  }

  async getCompanies({ q, page = 1, limit = 20 }) {
    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Company.countDocuments(filter),
    ]);

    // Attach active job count to each company
    const companyIds = companies.map((c) => c._id);
    const jobCounts = await Job.aggregate([
      { $match: { company: { $in: companyIds } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ]);
    const jobCountMap = new Map(jobCounts.map((j) => [j._id.toString(), j.count]));

    const enriched = companies.map((c) => ({
      ...c.toObject(),
      jobCount: jobCountMap.get(c._id.toString()) || 0,
      memberCount: c.members?.length || 1,
    }));

    return {
      companies: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getJobs({ q, status, page = 1, limit = 20 }) {
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name slug location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    return {
      jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async closeJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw AppError.notFound('Job not found');
    }

    job.status = 'closed';
    await job.save();

    return job;
  }

  async getReports({ status, page = 1, limit = 20 }) {
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate({
          path: 'job',
          select: 'title company status location applicationCount',
          populate: { path: 'company', select: 'name' },
        })
        .populate('reporter', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return {
      reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateReport(reportId, { status, closeJob }) {
    const report = await Report.findById(reportId);
    if (!report) {
      throw AppError.notFound('Report record not found');
    }

    report.status = status;
    await report.save();

    if (closeJob) {
      await Job.findByIdAndUpdate(report.job, { status: 'closed' });
    }

    return report;
  }
}

export const adminService = new AdminService();

