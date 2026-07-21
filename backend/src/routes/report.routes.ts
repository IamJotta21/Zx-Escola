import { Router } from 'express';
import { authenticate, authorize, Role } from '../middlewares/auth';
import { getReportsData, getSystemLogs } from '../controllers/report.controller';

const router = Router();
router.use(authenticate);

const allowedRoles: Role[] = ['ADMIN', 'DIRETOR', 'FINANCEIRO'];

router.get('/', authorize(allowedRoles), getReportsData);
router.get('/logs', authorize(['ADMIN', 'DIRETOR']), getSystemLogs);

export default router;
