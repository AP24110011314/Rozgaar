import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createJobSchema = z.object({
  title: z.string().trim().min(2, 'Job title must be at least 2 characters').max(150),
  description: z.string().trim().min(10, 'Job description must be at least 10 characters'),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']).default('full-time'),
  remote: z.boolean().default(false),
  location: z.object({
    city: z.string().trim().optional().default(''),
    state: z.string().trim().optional().default(''),
    geo: z.object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    }).optional(),
  }).optional(),
  salary: z.object({
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    currency: z.string().default('INR'),
    period: z.enum(['hour', 'month', 'year']).default('month'),
  }).optional(),
  skills: z.array(z.string().trim().min(1)).optional().default([]),
  customFields: z.record(z.any()).optional().default({}),
  status: z.enum(['draft', 'open', 'closed']).default('draft'),
  expiresAt: z.string().datetime().nullable().optional(),
}).strict();

export const updateJobSchema = createJobSchema.partial().strict();

export const jobStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'closed']),
}).strict();

export const jobIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid job ID format'),
}).strict();

export const jobSearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(500).default(25),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']).optional(),
  remote: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  minSalary: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['newest', 'distance']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
}).strip(); // Use strip so unknown search query parameters don't crash standard browser requests

export const reportJobSchema = z.object({
  reason: z.enum(['spam', 'misleading', 'harassment', 'fraud', 'other']),
  text: z.string().trim().max(1000).optional().default(''),
}).strict();
