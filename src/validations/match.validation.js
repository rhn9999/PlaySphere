import { z } from 'zod';
import { JOIN_REQUEST_STATUS } from '../constants/index.js';

export const createMatchSchema = z.object({
  title: z.string().max(100).optional(),
  sport: z.string().min(2, 'Sport name is required'),
  targetHeadcount: z.number().int().min(2, 'Target headcount must be at least 2'),
  minReliability: z.number().min(0).max(100).default(0),
  startTime: z.string().datetime().optional(),
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid venue ID format').optional(),
  slotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid slot ID format').optional(),
  locationName: z.string().optional()
});

export const joinMatchSchema = z.object({
  message: z.string().max(200).optional()
});

export const respondJoinRequestSchema = z.object({
  action: z.enum([JOIN_REQUEST_STATUS.ACCEPTED, JOIN_REQUEST_STATUS.REJECTED])
});
