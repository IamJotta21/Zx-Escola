import { Router } from 'express';
import {
  getSuperAdminDashboard,
  impersonateTenant,
  sendGlobalNotification,
  getSystemMonitoring,
  getSuperAdminAuditLogs,
} from '../controllers/superadmin.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Restricted strictly to SUPER_ADMIN role
router.use(authorize(['SUPER_ADMIN']));

router.get('/dashboard', getSuperAdminDashboard);
router.post('/impersonate', impersonateTenant);
router.post('/notifications', sendGlobalNotification);
router.get('/monitoring', getSystemMonitoring);
router.get('/audit', getSuperAdminAuditLogs);

export default router;
