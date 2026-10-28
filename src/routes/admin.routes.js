import { Router } from 'express';
import {
  fileReport,
  listReports,
  resolveReport,
  banUser,
  overrideScore,
  getAuditLogs
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  createReportSchema,
  resolveReportSchema,
  banUserSchema,
  overrideScoreSchema
} from '../validations/admin.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Players or any authenticated user can file a report against misconduct
router.post('/reports', authenticate, validateRequest({ body: createReportSchema }), fileReport);

// All subsequent routes require ADMIN privileges
router.use(authenticate, authorizeRoles(ROLES.ADMIN));

router.get('/reports', listReports);
router.patch('/reports/:id/resolve', validateRequest({ body: resolveReportSchema }), resolveReport);

// banUser() endpoint
router.post('/users/:id/ban', validateRequest({ body: banUserSchema }), banUser);

// overrideScore() endpoint
router.patch(
  '/players/:id/reliability-score',
  validateRequest({ body: overrideScoreSchema }),
  overrideScore
);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
