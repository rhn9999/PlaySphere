import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { signupSchema, loginSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/signup', validateRequest({ body: signupSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
