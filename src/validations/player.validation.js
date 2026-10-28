import { z } from 'zod';

export const updateLocationSchema = z.object({
  lng: z.coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  lat: z.coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
});

export const fcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required')
});
