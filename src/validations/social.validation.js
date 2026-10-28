import { z } from 'zod';

export const createReviewSchema = z.object({
  targetPlayerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid player ID format'),
  sportsmanship: z.number().int().min(1).max(5, 'Sportsmanship must be between 1 and 5'),
  skillRating: z.number().int().min(1).max(5, 'Skill rating must be between 1 and 5'),
  comment: z.string().max(500).optional()
});

export const endorseSkillSchema = z.object({
  playerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid player ID format'),
  skillName: z.string().min(2, 'Skill name must be at least 2 characters').max(50)
});

export const sendMessageSchema = z
  .object({
    recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recipient ID').optional(),
    room: z.string().min(1).optional(),
    text: z.string().min(1, 'Message text cannot be empty').max(2000)
  })
  .refine((data) => data.recipientId || data.room, {
    message: 'Either recipientId or room must be provided',
    path: ['room']
  });

export const createReportSchema = z.object({
  targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target user ID format'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000)
});
