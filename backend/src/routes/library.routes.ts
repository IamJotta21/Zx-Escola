import { Router } from 'express';
import {
  listCategories,
  createCategory,
  deleteCategory,
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  listLoans,
  createLoan,
  returnBook,
  listReservations,
  createReservation,
  updateReservation,
  getLibrarySummary,
} from '../controllers/library.controller';
import { authenticate, authorize, Role } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

const staff: Role[] = ['ADMIN', 'DIRETOR', 'STAFF'];
const allStaff: Role[] = ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'];

// Dashboard
router.get('/summary', authorize(allStaff), getLibrarySummary);

// Categories
router.get('/categories', listCategories);
router.post('/categories', authorize(staff), createCategory);
router.delete('/categories/:id', authorize(staff), deleteCategory);

// Books
router.get('/books', listBooks);
router.post('/books', authorize(staff), createBook);
router.put('/books/:id', authorize(staff), updateBook);
router.delete('/books/:id', authorize(staff), deleteBook);

// Loans
router.get('/loans', authorize(allStaff), listLoans);
router.post('/loans', authorize(allStaff), createLoan);
router.put('/loans/:id/return', authorize(allStaff), returnBook);

// Reservations
router.get('/reservations', authorize(allStaff), listReservations);
router.post('/reservations', createReservation);
router.put('/reservations/:id', authorize(allStaff), updateReservation);

export default router;
