import { Router } from 'express';
import {
  createSlot,
  getAvailableSlots,
  blockSlot,
  unblockSlot
} from '../controllers/slot.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createSlotSchema } from '../validations/venue.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public / Player slot availability lookup
router.get('/ground/:groundId/available', getAvailableSlots);

// Venue Owner & Admin slot creation and blockSlot() endpoints
router.post(
  '/ground/:groundId',
  authenticate,
  authorizeRoles(ROLES.VENUE_OWNER, ROLES.ADMIN),
  validateRequest({ body: createSlotSchema }),
  createSlot
);

router.post(
  '/:id/block',
  authenticate,
  authorizeRoles(ROLES.VENUE_OWNER, ROLES.ADMIN),
  blockSlot
);

router.post(
  '/:id/unblock',
  authenticate,
  authorizeRoles(ROLES.VENUE_OWNER, ROLES.ADMIN),
  unblockSlot
);

export default router;
