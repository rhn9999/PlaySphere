import { Router } from 'express';
import { bookSlot, getMyBookings, verifyQrPass } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createBookingSchema } from '../validations/booking.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Player books a slot (transactional Mongoose session)
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.PLAYER),
  validateRequest({ body: createBookingSchema }),
  bookSlot
);

// Player views their bookings
router.get('/my', authenticate, getMyBookings);

// Venue Owner or Admin verifies a player's QR Pass at the venue gate
router.get(
  '/verify/:qrPass',
  authenticate,
  authorizeRoles(ROLES.VENUE_OWNER, ROLES.ADMIN),
  verifyQrPass
);

export default router;
