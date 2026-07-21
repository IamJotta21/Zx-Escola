import { Router } from 'express';
import {
  generateInstallments,
  payTuition,
  getStudentTuitions,
  listTuitions,
  updateTuition,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listTransactions,
  getFinancialSummary,
} from '../controllers/financial.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

// Restricted to Admin, Director, or Financial operators
router.use(authorize(['ADMIN', 'DIRETOR', 'FINANCEIRO']));

// Dashboard / Summaries
router.get('/summary', getFinancialSummary);

// Installments & Tuition
router.post('/installments', generateInstallments);
router.get('/student/:studentId', getStudentTuitions);
router.get('/tuitions', listTuitions);
router.put('/tuitions/:id', updateTuition);
router.post('/pay/:id', payTuition);

// Cash Flow (Receitas & Despesas)
router.get('/transactions', listTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;
