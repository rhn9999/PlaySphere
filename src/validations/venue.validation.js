import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().min(2, 'Venue name must be at least 2 characters'),
  address: z.union([
    z.string().min(3, 'Address must be at least 3 characters'),
    z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().default('India'),
      fullAddress: z.string().min(3, 'Full address is required')
    })
  ]),
  location: z
    .object({
      coordinates: z
        .tuple([
          z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
          z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90')
        ])
        .optional()
    })
    .optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url('Photo must be a valid URL'),
        isPrimary: z.boolean().default(false)
      })
    )
    .optional(),
  operatingHours: z.any().optional(),
  sport: z.union([z.string(), z.array(z.string())]).optional()
});

export const nearbyVenuesSchema = z.object({
  lng: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  lat: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  radius: z.coerce.number().positive().max(50000, 'Radius cannot exceed 50 km (50,000 meters)').optional(),
  distance: z.coerce.number().positive().max(50000, 'Distance cannot exceed 50 km (50,000 meters)').optional(),
  sport: z.string().optional()
});

export const searchVenuesSchema = z.object({
  q: z.string().optional()
});

export const createGroundSchema = z.object({
  name: z.string().min(1, 'Ground name is required'),
  sportType: z.string().min(2, 'Sport type is required'),
  surface: z.string().min(2, 'Surface type is required'),
  coverPhoto: z.string().url().optional().or(z.literal(''))
});

export const createSlotSchema = z.object({
  start: z.string().datetime({ message: 'Start must be a valid ISO datetime' }),
  end: z.string().datetime({ message: 'End must be a valid ISO datetime' }),
  price: z.number().min(0, 'Price must be 0 or positive')
});

export const checkAvailabilitySchema = z.object({
  groundId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ground ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});
