import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(120),
  description: z.string().trim().max(2000).optional().default(''),
  website: z.string().trim().url('Website must be a valid URL').optional().or(z.literal('')),
  location: z.object({
    city: z.string().trim().optional().default(''),
    state: z.string().trim().optional().default(''),
    geo: z.object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    }).optional(),
  }).optional(),
}).strict();

export const updateCompanySchema = createCompanySchema.partial().strict();

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  role: z.enum(['owner', 'member']).default('member'),
}).strict();

export const companyIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid company ID format'),
}).strict();

