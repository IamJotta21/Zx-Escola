import { Router } from 'express';
import {
  listPlans,
  createPlan,
  updatePlan,
  duplicatePlan,
  listSubscriptions,
  assignSubscription,
} from '../controllers/plan.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Public/Authenticated reading of plans
router.get('/', listPlans);

// Admin & Super Admin plan management
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN']), createPlan);
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN']), updatePlan);
router.post('/:id/duplicate', authorize(['SUPER_ADMIN', 'ADMIN']), duplicatePlan);

// Subscriptions management
router.get('/subscriptions', authorize(['SUPER_ADMIN', 'ADMIN']), listSubscriptions);
router.post('/subscriptions/assign', authorize(['SUPER_ADMIN', 'ADMIN']), assignSubscription);

export default router;
