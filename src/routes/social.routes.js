import { Router } from 'express';
import {
  createReview,
  endorseSkill,
  getPlayerSkills,
  sendMessage,
  getMessages
} from '../controllers/social.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createReviewSchema,
  endorseSkillSchema,
  sendMessageSchema
} from '../validations/social.validation.js';

const router = Router();

// Player peer review and reputation
router.post('/reviews', authenticate, validateRequest({ body: createReviewSchema }), createReview);

// Skill tags and endorsements
router.post(
  '/skills/endorse',
  authenticate,
  validateRequest({ body: endorseSkillSchema }),
  endorseSkill
);
router.get('/skills/:playerId', getPlayerSkills);

// Chat messages (room or direct peer-to-peer)
router.post(
  '/chat/messages',
  authenticate,
  validateRequest({ body: sendMessageSchema }),
  sendMessage
);
router.get('/chat/messages', authenticate, getMessages);

export default router;
