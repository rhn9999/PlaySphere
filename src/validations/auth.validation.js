import { z } from 'zod';
import { ROLES, ROLE_LIST } from '../constants/index.js';

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum([ROLES.PLAYER, ROLES.ADMIN, ROLES.VENUE_OWNER]).default(ROLES.PLAYER),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    // Role specific extensions
    sports: z.array(z.string()).optional(),
    businessName: z.string().optional(),
    adminLevel: z.enum(['SUPERADMIN', 'MODERATOR']).optional()
  })
  .refine(
    (data) => {
      if (data.role === ROLES.VENUE_OWNER && (!data.businessName || data.businessName.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Business name is required when registering as a Venue Owner',
      path: ['businessName']
    }
  );

export const loginSchema = z
  .object({
    identifier: z.string().min(1, 'Email or username is required').optional(),
    login: z.string().min(1, 'Email or username is required').optional(),
    email: z.string().optional(),
    username: z.string().optional(),
    emailOrUsername: z.string().optional(),
    password: z.string().min(1, 'Password is required')
  })
  .refine(
    (data) => Boolean(data.identifier || data.login || data.email || data.username || data.emailOrUsername),
    {
      message: 'Email or username is required',
      path: ['identifier']
    }
  );
