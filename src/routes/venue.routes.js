import { Router } from 'express';
import {
  createVenue,
  listVenues,
  getNearbyVenues,
  searchVenues,
  getVenueById,
  addGround,
  getVenueGrounds,
  getVenueReviews,
  createVenueReview
} from '../controllers/venue.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createVenueSchema,
  nearbyVenuesSchema,
  searchVenuesSchema,
  createGroundSchema
} from '../validations/venue.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public / Player accessible queries
router.get('/', listVenues);

// CRITICAL: Register /nearby and /search BEFORE /:id so they aren't swallowed
router.get('/nearby', validateRequest({ query: nearbyVenuesSchema }), getNearbyVenues);
router.post('/nearby', validateRequest({ body: nearbyVenuesSchema }), getNearbyVenues);
router.get('/search', validateRequest({ query: searchVenuesSchema }), searchVenues);

router.get('/:id', getVenueById);
router.get('/:id/grounds', getVenueGrounds);
router.get('/:id/reviews', getVenueReviews);
router.post('/:id/reviews', authenticate, createVenueReview);

// Venue Owner & Admin management endpoints
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.VENUE_OWNER, ROLES.ADMIN),
  validateRequest({ body: createVenueSchema }),
  createVenue
);

router.post(
  '/:id/grounds',
  authenticate,
  authorizeRoles(ROLES.VENUE_OWNER, ROLES.ADMIN),
  validateRequest({ body: createGroundSchema }),
  addGround
);

export default router;
