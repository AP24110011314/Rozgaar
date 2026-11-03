import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const updateProfileSchema = z.object({
  headline: z.string().trim().max(120, 'Headline cannot exceed 120 characters').optional(),
  bio: z.string().trim().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  phone: z.string().trim().max(30).optional(),
  location: z.object({
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    geo: z.object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    }).optional(),
  }).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  links: z.array(
    z.object({
      label: z.string().trim().min(1, 'Link label is required').max(50),
      url: z.string().trim().url('Invalid link URL'),
    })
  ).optional(),
}).strict();

export const resumeIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid resume ID format'),
}).strict();

export const jobIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid job ID format'),
}).strict();

