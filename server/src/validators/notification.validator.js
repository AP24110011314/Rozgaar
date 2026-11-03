import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const notificationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid notification ID format'),
}).strict();

