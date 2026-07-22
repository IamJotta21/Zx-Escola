import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// ─── Tuition Generation ────────────────────────────────────────────────────────

export const generateInstallments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, value, discount = 0, scholarshipPercent = 0, months = 12 } = req.body;

    if (!studentId || value === undefined || value === null) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId e value são obrigatórios',
      });
    }

    const baseVal = parseFloat(value.toString());
    const discVal = parseFloat(discount.toString());
    const scholPct = parseFloat(scholarshipPercent.toString());
    const monthsNum = parseInt(months.toString());

    if (isNaN(baseVal) || baseVal <= 0) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Valor deve ser um número positivo maior que zero' });
    }
    if (isNaN(discVal) || discVal < 0) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Desconto deve ser maior ou igual a zero' });
    }
    if (isNaN(scholPct) || scholPct < 0 || scholPct > 100) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Bolsa de estudos deve ser entre 0% e 100%' });
    }
    if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 24) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Quantidade de parcelas deve ser de 1 a 24 meses' });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
    }

    // Calculate monthly final value (pre-interest)
    const netValue = baseVal * (1 - scholPct / 100) - discVal;
    const finalMonthlyValue = Math.max(0, netValue);

    const generated = await prisma.$transaction(async (tx) => {
      const tuitions = [];
      const today = new Date();

      for (let i = 1; i <= monthsNum; i++) {
        const dueDate = new Date(today.getFullYear(), today.getMonth() + i, 10);
        const description = `Mensalidade ${i}/${monthsNum} - Ref: ${dueDate.toLocaleString(
          'pt-BR',
          {
            month: 'long',
            year: 'numeric',
          }
        )}`;

        const tuition = await tx.tuition.create({
          data: {
            studentId,
            description,
            dueDate: formatDate(dueDate),
            value: baseVal,
            discount: discVal,
            scholarshipPercent: scholPct,
            finalValue: finalMonthlyValue,
            status: 'PENDENTE',
          },
        });
        tuitions.push(tuition);
      }
      return tuitions;
    });

    return res.status(201).json({ status: 'success', data: generated });
  } catch (error) {
    return next(error);
  }
};

// ─── Payment Processing ────────────────────────────────────────────────────────

export const payTuition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentDate = formatDate(new Date()) } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ status: 'error', message: 'paymentMethod é obrigatório' });
    }

    const tuition = await prisma.tuition.findUnique({ where: { id } });
    if (!tuition) {
      return res.status(404).json({ status: 'error', message: 'Parcela não encontrada' });
    }

    if (tuition.status === 'PAGO') {
      return res.status(400).json({ status: 'error', message: 'Parcela já foi paga' });
    }

    const payD = new Date(paymentDate);
    const dueD = new Date(tuition.dueDate);

    let fine = 0;
    let interest = 0;
    const netBaseValue = tuition.value * (1 - tuition.scholarshipPercent / 100) - tuition.discount;

    // Fines (2%) and interest (1% month / 0.033% day pro-rata)
    if (payD > dueD) {
      const diffTime = Math.abs(payD.getTime() - dueD.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      fine = netBaseValue * 0.02;
      interest = diffDays * 0.00033 * netBaseValue;
    }

    const finalVal = Math.max(0, netBaseValue + fine + interest);

    const result = await prisma.$transaction(async (tx) => {
      // Update tuition status
      const updatedTuition = await tx.tuition.update({
        where: { id },
        data: {
          status: 'PAGO',
          paymentMethod,
          paymentDate,
          fine: parseFloat(fine.toFixed(2)),
          interest: parseFloat(interest.toFixed(2)),
          finalValue: parseFloat(finalVal.toFixed(2)),
        },
      });

      // Add to Cash Flow as Revenue (RECEITA)
      await tx.transaction.create({
        data: {
          type: 'RECEITA',
          category: 'Mensalidade',
          description: `Recebimento: ${tuition.description}`,
          value: parseFloat(finalVal.toFixed(2)),
          date: paymentDate,
          paymentMethod,
          tuitionId: id,
        },
      });

      return updatedTuition;
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// ─── Tuition List / Defaulters ──────────────────────────────────────────────────

export const getStudentTuitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;

    const tuitions = await prisma.tuition.findMany({
      where: { studentId },
      orderBy: { dueDate: 'asc' },
    });

    return res.status(200).json({ status: 'success', data: tuitions });
  } catch (error) {
    return next(error);
  }
};

export const listTuitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, studentId, search, classId, startDate, endDate } = req.query;

    const where: any = {};
    const todayStr = formatDate(new Date());

    if (status) {
      if (status === 'ATRASADO') {
        where.OR = [
          { status: 'ATRASADO' },
          { AND: [{ status: 'PENDENTE' }, { dueDate: { lt: todayStr } }] },
        ];
      } else {
        where.status = status as string;
      }
    }

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (classId) {
      where.student = { classId: classId as string };
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = startDate as string;
      if (endDate) where.dueDate.lte = endDate as string;
    }

    if (search) {
      const searchStr = (search as string).trim();
      const searchFilter = [
        { description: { contains: searchStr } },
        {
          student: {
            OR: [
              { cpf: { contains: searchStr } },
              {
                user: {
                  OR: [
                    { email: { contains: searchStr } },
                    {
                      profile: {
                        OR: [
                          { firstName: { contains: searchStr } },
                          { lastName: { contains: searchStr } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilter }];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const tuitions = await prisma.tuition.findMany({
      where,
      include: {
        student: {
          include: {
            user: { include: { profile: true } },
            class: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.status(200).json({ status: 'success', data: tuitions });
  } catch (error) {
    return next(error);
  }
};

// ─── Cash Flow Transactions (Receitas e Despesas) ───────────────────────────────

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      type,
      category,
      description,
      value,
      date = formatDate(new Date()),
      paymentMethod,
    } = req.body;

    if (!type || !category || !description || value === undefined || value === null) {
      return res.status(400).json({
        status: 'error',
        message: 'type (RECEITA/DESPESA), category, description e value são obrigatórios',
      });
    }

    if (!['RECEITA', 'DESPESA'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Tipo de lançamento deve ser RECEITA ou DESPESA',
      });
    }

    const parsedVal = parseFloat(value.toString());
    if (isNaN(parsedVal) || parsedVal <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valor do lançamento deve ser um número positivo maior que zero',
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        description,
        value: parsedVal,
        date,
        paymentMethod: paymentMethod || null,
      },
    });

    return res.status(201).json({ status: 'success', data: transaction });
  } catch (error) {
    return next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return res.status(404).json({ status: 'error', message: 'Lançamento não encontrado' });
    }

    await prisma.transaction.delete({ where: { id } });

    return res.status(200).json({ status: 'success', message: 'Lançamento removido com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const listTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, category } = req.query;

    const where: any = {};
    if (type) where.type = type as string;
    if (category) where.category = category as string;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: transactions });
  } catch (error) {
    return next(error);
  }
};

// ─── Dashboard Stats & Summaries ────────────────────────────────────────────────

export const getFinancialSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStr = formatDate(new Date());
    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

    // 1. Transactions & Month Revenue
    const transactions = await prisma.transaction.findMany();
    const totalRevenues = transactions
      .filter((t) => t.type === 'RECEITA')
      .reduce((sum, t) => sum + t.value, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'DESPESA')
      .reduce((sum, t) => sum + t.value, 0);
    const balance = totalRevenues - totalExpenses;

    const monthRevenue = transactions
      .filter((t) => t.type === 'RECEITA' && t.date && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.value, 0);

    // 2. All tuitions stats
    const allTuitions = await prisma.tuition.findMany({
      include: {
        student: {
          include: {
            user: { include: { profile: true } },
            class: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalTuitionsCount = allTuitions.length;

    // Paid
    const paidTuitions = allTuitions.filter((t) => t.status === 'PAGO');
    const paidCount = paidTuitions.length;
    const paidSum = paidTuitions.reduce((sum, t) => sum + t.finalValue, 0);

    // Pending (on-time)
    const pendingTuitions = allTuitions.filter((t) => t.status === 'PENDENTE' && t.dueDate >= todayStr);
    const pendingCount = pendingTuitions.length;
    const pendingSum = pendingTuitions.reduce((sum, t) => sum + t.finalValue, 0);

    // Overdue (Inadimplência)
    const overdueTuitions = allTuitions.filter(
      (t) => t.status === 'ATRASADO' || (t.status === 'PENDENTE' && t.dueDate < todayStr)
    );
    const overdueCount = overdueTuitions.length;
    const overdueSum = overdueTuitions.reduce((sum, t) => sum + t.finalValue, 0);

    // Defaulter Rate (% Inadimplência)
    const defaultRate = totalTuitionsCount > 0 ? Math.round((overdueCount / totalTuitionsCount) * 1000) / 10 : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalRevenues: parseFloat(totalRevenues.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          balance: parseFloat(balance.toFixed(2)),
          monthRevenue: parseFloat(monthRevenue.toFixed(2)),
          defaultRate,
          paidCount,
          paidSum: parseFloat(paidSum.toFixed(2)),
          pendingCount,
          pendingSum: parseFloat(pendingSum.toFixed(2)),
          overdueCount,
          overdueSum: parseFloat(overdueSum.toFixed(2)),
          totalTuitionsCount,
        },
        overdueList: overdueTuitions,
        paidList: paidTuitions,
        pendingList: pendingTuitions,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Update Tuition (Editar Parcela) ────────────────────────────────────────────

export const updateTuition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { description, dueDate, value, discount, scholarshipPercent } = req.body;

    const tuition = await prisma.tuition.findUnique({ where: { id } });
    if (!tuition) {
      return res.status(404).json({ status: 'error', message: 'Parcela não encontrada' });
    }

    if (tuition.status === 'PAGO') {
      return res
        .status(400)
        .json({ status: 'error', message: 'Não é possível editar uma parcela já paga' });
    }

    const baseVal = value !== undefined ? parseFloat(value.toString()) : tuition.value;
    const discVal = discount !== undefined ? parseFloat(discount.toString()) : tuition.discount;
    const scholPct =
      scholarshipPercent !== undefined
        ? parseFloat(scholarshipPercent.toString())
        : tuition.scholarshipPercent;

    const netValue = baseVal * (1 - scholPct / 100) - discVal;
    const finalValue = Math.max(0, netValue);

    const updated = await prisma.tuition.update({
      where: { id },
      data: {
        description: description ?? tuition.description,
        dueDate: dueDate ?? tuition.dueDate,
        value: baseVal,
        discount: discVal,
        scholarshipPercent: scholPct,
        finalValue: parseFloat(finalValue.toFixed(2)),
      },
    });

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return next(error);
  }
};

// ─── Update Transaction (Editar Lançamento) ──────────────────────────────────────

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, category, description, value, date, paymentMethod } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return res.status(404).json({ status: 'error', message: 'Lançamento não encontrado' });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type: type ?? transaction.type,
        category: category ?? transaction.category,
        description: description ?? transaction.description,
        value: value !== undefined ? parseFloat(value.toString()) : transaction.value,
        date: date ?? transaction.date,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : transaction.paymentMethod,
      },
    });

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return next(error);
  }
};

export default {
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
};
