import { Router } from 'express';
import {
  createMatch,
  listMatches,
  getMatchById,
  pingNearbyPlayers,
  requestJoin,
  respondJoinRequest,
  getMatchJoinRequests
} from '../controllers/match.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createMatchSchema,
  joinMatchSchema,
  respondJoinRequestSchema
} from '../validations/match.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// List open matches (public/player filterable)
router.get('/', listMatches);
router.get('/:id', getMatchById);

// Player creates an OpenMatch (nearby players notified based on location & sport)
router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.PLAYER),
  validateRequest({ body: createMatchSchema }),
  createMatch
);

// Host re-broadcasts to nearby players to fill remaining spots (host only, rate-limited to once per 5 minutes)
router.post(
  '/:id/ping',
  authenticate,
  authorizeRoles(ROLES.PLAYER),
  pingNearbyPlayers
);

// Player requests to join a match
router.post(
  '/:id/join',
  authenticate,
  authorizeRoles(ROLES.PLAYER),
  validateRequest({ body: joinMatchSchema }),
  requestJoin
);

// Host inspects pending join requests for their match
router.get('/:id/join-requests', authenticate, getMatchJoinRequests);

// Host accepts or rejects a join request
router.post(
  '/requests/:requestId/respond',
  authenticate,
  validateRequest({ body: respondJoinRequestSchema }),
  respondJoinRequest
);

export default router;
