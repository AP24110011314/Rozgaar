import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const applyJobSchema = z.object({
  resumeId: z.string().regex(objectIdRegex, 'Invalid resume ID format'),
  coverNote: z.string().trim().max(2000, 'Cover note cannot exceed 2000 characters').optional().default(''),
}).strict();

export const updateStageSchema = z.object({
  stage: z.enum(['applied', 'reviewing', 'interviewing', 'offered', 'hired', 'rejected']),
  message: z.string().trim().max(2000, 'Message cannot exceed 2000 characters').optional().default(''),
  beforeId: z.string().regex(objectIdRegex, 'Invalid beforeId format').nullable().optional(),
  afterId: z.string().regex(objectIdRegex, 'Invalid afterId format').nullable().optional(),
}).strict();

export const addNoteSchema = z.object({
  text: z.string().trim().min(1, 'Note text cannot be empty').max(2000, 'Note text cannot exceed 2000 characters'),
}).strict();

export const updateRatingSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
}).strict();

export const applicationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid application ID format'),
}).strict();

export const jobApplicationsQuerySchema = z.object({
  stage: z.enum(['applied', 'reviewing', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn']).optional(),
}).strip();

