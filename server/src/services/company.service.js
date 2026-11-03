import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { AppError } from '../utils/appError.js';
import { generateRandomToken } from '../utils/crypto.js';

export class CompanyService {
  /**
   * Create a new company profile for recruiter
   */
  async createCompany(user, data) {
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      throw AppError.forbidden('Only recruiters or admins can create a company');
    }

    if (user.company) {
      const existing = await Company.findById(user.company);
      if (existing) {
        throw AppError.conflict('You already belong to a registered company');
      }
    }

    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company';
    const slug = `${baseSlug}-${generateRandomToken(4)}`;

    const company = await Company.create({
      ...data,
      slug,
      owner: user._id,
      members: [{ user: user._id, role: 'owner' }],
    });

    // Link company to user
    await User.findByIdAndUpdate(user._id, { company: company._id });

    return company;
  }

  /**
   * Get public company details
   */
  async getCompany(companyId) {
    const company = await Company.findById(companyId)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');

    if (!company) {
      throw AppError.notFound('Company not found');
    }

    return company;
  }

  /**
   * Update company details
   */
  async updateCompany(user, companyId, updateData) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw AppError.notFound('Company not found');
    }

    // Authorization: User must be owner or member of this company, or admin
    const isOwner = company.owner.toString() === user._id.toString();
    const isMember = company.members.some((m) => m.user.toString() === user._id.toString());

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw AppError.forbidden('You do not have permission to edit this company profile');
    }

    if (updateData.name) company.name = updateData.name;
    if (updateData.description !== undefined) company.description = updateData.description;
    if (updateData.website !== undefined) company.website = updateData.website;
    if (updateData.location) {
      company.location = {
        ...company.location.toObject(),
        ...updateData.location,
      };
    }

    await company.save();
    return company;
  }

  /**
   * Invite a team member to the company
   */
  async inviteMember(user, companyId, { email, role = 'member' }) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw AppError.notFound('Company not found');
    }

    // Authorization check
    const isOwner = company.owner.toString() === user._id.toString();
    const isMember = company.members.some((m) => m.user.toString() === user._id.toString());

    if (!isOwner && !isMember && user.role !== 'admin') {
      throw AppError.forbidden('You do not have permission to invite team members');
    }

    // Find the invited user in Rozgaar
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      throw AppError.notFound('No registered user found with that email. Ask them to register on Rozgaar first.');
    }

    // Check if already member
    const alreadyMember = company.members.some(
      (m) => m.user.toString() === invitedUser._id.toString()
    );

    if (alreadyMember) {
      throw AppError.conflict('User is already a team member of this company');
    }

    company.members.push({ user: invitedUser._id, role });
    await company.save();

    // Link user to company & ensure recruiter role
    invitedUser.company = company._id;
    if (invitedUser.role === 'applicant') {
      invitedUser.role = 'recruiter';
    }
    await invitedUser.save();

    return this.getCompany(companyId);
  }

  /**
   * Get all open jobs for this company
   */
  async getCompanyJobs(companyId) {
    const jobs = await Job.find({ company: companyId, status: 'open' })
      .sort({ publishedAt: -1 });
    return jobs;
  }
}

export const companyService = new CompanyService();

