import { Router } from 'express';
import { executeProcess, listEnrollments } from '../controllers/enrollment.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Require authentication for all enrollment routes
router.use(authenticate);

// List global enrollments history or search
router.get('/', authorize(['ADMIN', 'DIRETOR', 'STAFF']), listEnrollments);

// Execute Matrícula, Rematrícula, Transferência, Cancelamento, Lista de Espera
router.post('/process', authorize(['ADMIN', 'DIRETOR', 'STAFF']), executeProcess);

export default router;
