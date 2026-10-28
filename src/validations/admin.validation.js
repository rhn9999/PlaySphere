import { z } from 'zod';
import { REPORT_STATUS } from '../constants/index.js';
export const createReportSchema = z.object({
  targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target user ID format'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000)
});

export const banUserSchema = z.object({
  isBanned: z.boolean(),
  reason: z.string().min(3, 'Reason must be provided').max(500)
});

export const overrideScoreSchema = z.object({
  reliabilityScore: z.number().min(0).max(100),
  reason: z.string().min(3, 'Reason for score override is required')
});

export const resolveReportSchema = z.object({
  status: z.enum([REPORT_STATUS.RESOLVED, REPORT_STATUS.DISMISSED]),
  resolutionNote: z.string().min(3, 'Resolution note is required'),
  actionTaken: z.string().optional()
});
