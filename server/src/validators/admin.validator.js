import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const adminIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid ID format'),
}).strict();

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(['applicant', 'recruiter', 'admin']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strip();

export const adminCompaniesQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strip();

export const adminJobsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['draft', 'open', 'closed']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strip();

export const adminReportsQuerySchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed', 'action_taken']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strip();

export const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed', 'action_taken']),
  closeJob: z.boolean().optional().default(false),
}).strict();

