import { z } from 'zod';

export const createBookingSchema = z.object({
  slotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid slot ID format'),
  notes: z.string().max(200).optional()
});
