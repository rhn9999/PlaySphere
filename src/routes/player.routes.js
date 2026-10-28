import { Router } from 'express';
import {
  updatePlayerLocation,
  updateFcmToken,
  getMyProfile
} from '../controllers/player.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  updateLocationSchema,
  fcmTokenSchema
} from '../validations/player.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Retrieve current authenticated player's profile
router.get('/me', authenticate, getMyProfile);

// Update player location coordinates [longitude, latitude]
router.post(
  '/update-location',
  authenticate,
  authorizeRoles(ROLES.PLAYER),
  validateRequest({ body: updateLocationSchema }),
  updatePlayerLocation
);

// Register/update player FCM token for push notifications
router.post(
  '/fcm-token',
  authenticate,
  authorizeRoles(ROLES.PLAYER),
  validateRequest({ body: fcmTokenSchema }),
  updateFcmToken
);

export default router;
