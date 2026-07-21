import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

const today = () => new Date().toISOString().split('T')[0];

// ─── Categories ────────────────────────────────────────────────────────────────

export const listCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await prisma.bookCategory.findMany({ orderBy: { name: 'asc' } });
    return res.json({ status: 'success', data: cats });
  } catch (err) {
    return next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'name é obrigatório' });
    const cat = await prisma.bookCategory.create({ data: { name, description } });
    return res.status(201).json({ status: 'success', data: cat });
  } catch (err) {
    return next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.bookCategory.delete({ where: { id } });
    return res.json({ status: 'success', message: 'Categoria removida' });
  } catch (err) {
    return next(err);
  }
};

// ─── Books ─────────────────────────────────────────────────────────────────────

export const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, categoryId } = req.query;
    const where: any = {};
    if (categoryId) where.categoryId = categoryId as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { author: { contains: search as string } },
        { isbn: { contains: search as string } },
      ];
    }
    const books = await prisma.book.findMany({
      where,
      include: { category: true },
      orderBy: { title: 'asc' },
    });
    return res.json({ status: 'success', data: books });
  } catch (err) {
    return next(err);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, author, isbn, publisher, year, categoryId, totalQty, description } = req.body;
    if (!title || !author)
      return res.status(400).json({ status: 'error', message: 'title e author são obrigatórios' });
    const qty = parseInt(totalQty || '1');
    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn: isbn || null,
        publisher: publisher || null,
        year: year ? parseInt(year) : null,
        categoryId: categoryId || null,
        totalQty: qty,
        availableQty: qty,
        description: description || null,
      },
      include: { category: true },
    });
    return res.status(201).json({ status: 'success', data: book });
  } catch (err) {
    return next(err);
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, publisher, year, categoryId, totalQty, description } = req.body;
    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        isbn: isbn || null,
        publisher: publisher || null,
        year: year ? parseInt(year) : null,
        categoryId: categoryId || null,
        totalQty: totalQty ? parseInt(totalQty) : undefined,
        description: description || null,
      },
      include: { category: true },
    });
    return res.json({ status: 'success', data: book });
  } catch (err) {
    return next(err);
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.book.delete({ where: { id } });
    return res.json({ status: 'success', message: 'Livro removido' });
  } catch (err) {
    return next(err);
  }
};

// ─── Loans ─────────────────────────────────────────────────────────────────────

export const listLoans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    const loans = await prisma.bookLoan.findMany({
      where,
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: loans });
  } catch (err) {
    return next(err);
  }
};

export const createLoan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId, userId, borrowerName, loanDate, dueDate, notes } = req.body;
    if (!bookId || !borrowerName || !dueDate)
      return res
        .status(400)
        .json({ status: 'error', message: 'bookId, borrowerName e dueDate são obrigatórios' });

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ status: 'error', message: 'Livro não encontrado' });
    if (book.availableQty <= 0)
      return res
        .status(400)
        .json({ status: 'error', message: 'Nenhum exemplar disponível para empréstimo' });

    const loan = await prisma.$transaction(async (tx) => {
      const l = await tx.bookLoan.create({
        data: {
          bookId,
          userId: userId || req.user?.id || 'unknown',
          borrowerName,
          loanDate: loanDate || today(),
          dueDate,
          notes: notes || null,
          status: 'ATIVO',
        },
        include: { book: true },
      });
      await tx.book.update({ where: { id: bookId }, data: { availableQty: { decrement: 1 } } });
      return l;
    });

    return res.status(201).json({ status: 'success', data: loan });
  } catch (err) {
    return next(err);
  }
};

export const returnBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { returnDate } = req.body;
    const retDate = returnDate || today();

    const loan = await prisma.bookLoan.findUnique({ where: { id }, include: { book: true } });
    if (!loan)
      return res.status(404).json({ status: 'error', message: 'Empréstimo não encontrado' });
    if (loan.status === 'DEVOLVIDO')
      return res.status(400).json({ status: 'error', message: 'Livro já devolvido' });

    // Calculate fine: R$1/day overdue
    const due = new Date(loan.dueDate);
    const ret = new Date(retDate);
    let fine = 0;
    if (ret > due) {
      const diffMs = ret.getTime() - due.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fine = diffDays * 1.0;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const l = await tx.bookLoan.update({
        where: { id },
        data: { returnDate: retDate, status: 'DEVOLVIDO', fine },
        include: { book: true },
      });
      await tx.book.update({
        where: { id: loan.bookId },
        data: { availableQty: { increment: 1 } },
      });
      return l;
    });

    return res.json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

// ─── Reservations ──────────────────────────────────────────────────────────────

export const listReservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    const reservations = await prisma.bookReservation.findMany({
      where,
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: reservations });
  } catch (err) {
    return next(err);
  }
};

export const createReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId, userId, requesterName } = req.body;
    if (!bookId || !requesterName)
      return res
        .status(400)
        .json({ status: 'error', message: 'bookId e requesterName são obrigatórios' });

    const reservation = await prisma.bookReservation.create({
      data: {
        bookId,
        userId: userId || req.user?.id || 'unknown',
        requesterName,
        reservedAt: today(),
        status: 'AGUARDANDO',
      },
      include: { book: true },
    });
    return res.status(201).json({ status: 'success', data: reservation });
  } catch (err) {
    return next(err);
  }
};

export const updateReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const r = await prisma.bookReservation.update({
      where: { id },
      data: { status },
      include: { book: true },
    });
    return res.json({ status: 'success', data: r });
  } catch (err) {
    return next(err);
  }
};

// ─── Dashboard Summary ─────────────────────────────────────────────────────────

export const getLibrarySummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalBooks, activeLoans, overdueLoans, pendingReservations] = await Promise.all([
      prisma.book.count(),
      prisma.bookLoan.count({ where: { status: 'ATIVO' } }),
      prisma.bookLoan.findMany({
        where: { status: 'ATIVO', dueDate: { lt: today() } },
        include: { book: true },
      }),
      prisma.bookReservation.count({ where: { status: 'AGUARDANDO' } }),
    ]);

    const totalFines = await prisma.bookLoan.aggregate({
      _sum: { fine: true },
    });

    return res.json({
      status: 'success',
      data: {
        totalBooks,
        activeLoans,
        overdueCount: overdueLoans.length,
        pendingReservations,
        totalFinesCollected: totalFines._sum.fine ?? 0,
        overdueList: overdueLoans,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
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
};
