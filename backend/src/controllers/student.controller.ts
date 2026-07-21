import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { isValidEmail, isValidCPF, isValidCEP, isValidPhone } from '../utils/validators';

// 1. Create Student
export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      birthDate,
      avatarUrl,
      cpf,
      rg,
      gender,
      address,
      city,
      state,
      cep,
      whatsapp,
      guardianName,
      fatherName,
      motherName,
      status,
      notes,
      isActive,
    } = req.body;

    if (!email || !firstName || !lastName) {
      return res
        .status(400)
        .json({ status: 'error', message: 'E-mail, nome e sobrenome são obrigatórios' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (cpf && !isValidCPF(cpf)) {
      return res.status(400).json({ status: 'error', message: 'CPF inválido' });
    }
    if (cep && !isValidCEP(cep)) {
      return res.status(400).json({ status: 'error', message: 'CEP inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }
    if (whatsapp && !isValidPhone(whatsapp)) {
      return res.status(400).json({ status: 'error', message: 'WhatsApp inválido' });
    }

    // Check email uniqueness
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ status: 'error', message: 'E-mail já cadastrado' });
    }

    // Check CPF uniqueness
    if (cpf) {
      const cpfExists = await prisma.student.findUnique({ where: { cpf } });
      if (cpfExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'CPF já cadastrado para outro aluno' });
      }
    }

    const defaultPassword = await bcrypt.hash('123456', 10);

    // Transaction to create User, Profile, Student, and History
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: defaultPassword,
          role: 'STUDENT',
          isActive: isActive !== undefined ? isActive : true,
          profile: {
            create: {
              firstName,
              lastName,
              phone,
              birthDate: birthDate ? new Date(birthDate) : null,
              avatarUrl,
            },
          },
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          cpf,
          rg,
          gender,
          address,
          city,
          state,
          cep,
          whatsapp,
          guardianName,
          fatherName: fatherName || null,
          motherName: motherName || null,
          status: status || 'LISTA_DE_ESPERA',
          notes,
        },
      });

      await tx.studentHistory.create({
        data: {
          studentId: student.id,
          action: 'MATRICULA',
          details: `Matrícula efetuada por ${req.user?.email || 'Sistema'}. Código de usuário: ${user.id}`,
        },
      });

      return { user, student };
    });

    return res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// 2. Update Student
export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      email,
      firstName,
      lastName,
      phone,
      birthDate,
      avatarUrl,
      cpf,
      rg,
      gender,
      address,
      city,
      state,
      cep,
      whatsapp,
      guardianName,
      fatherName,
      motherName,
      status,
      notes,
      isActive,
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (cpf && !isValidCPF(cpf)) {
      return res.status(400).json({ status: 'error', message: 'CPF inválido' });
    }
    if (cep && !isValidCEP(cep)) {
      return res.status(400).json({ status: 'error', message: 'CEP inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }
    if (whatsapp && !isValidPhone(whatsapp)) {
      return res.status(400).json({ status: 'error', message: 'WhatsApp inválido' });
    }

    // Check CPF uniqueness if changing
    if (cpf && cpf !== student.cpf) {
      const cpfExists = await prisma.student.findUnique({ where: { cpf } });
      if (cpfExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'CPF já cadastrado para outro aluno' });
      }
    }

    // Check email uniqueness if changing
    if (email && email !== student.user.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'E-mail já cadastrado para outro usuário' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update User & Profile
      await tx.user.update({
        where: { id: student.userId },
        data: {
          email,
          isActive: isActive !== undefined ? isActive : student.user.isActive,
          profile: {
            update: {
              firstName,
              lastName,
              phone,
              birthDate: birthDate ? new Date(birthDate) : null,
              avatarUrl,
            },
          },
        },
      });

      // Update Student
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          cpf,
          rg,
          gender,
          address,
          city,
          state,
          cep,
          whatsapp,
          guardianName,
          fatherName: fatherName !== undefined ? fatherName : undefined,
          motherName: motherName !== undefined ? motherName : undefined,
          status: status !== undefined ? status : undefined,
          notes,
        },
      });

      await tx.studentHistory.create({
        data: {
          studentId: id,
          action: 'ALTERACAO_DADOS',
          details: `Dados cadastrais atualizados por ${req.user?.email || 'Sistema'}.`,
        },
      });

      return updatedStudent;
    });

    return res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Delete Student (Full deletion with cascades)
export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
    }

    // Deleting the associated User will cascade delete the Profile, Student profile, RefreshTokens, etc.
    await prisma.user.delete({
      where: { id: student.userId },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Aluno excluído permanentemente com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};

// 4. List Students with Filters and Pagination
export const listStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, gender, state, isActive, status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query condition
    const where: any = {
      user: {},
    };

    // Text Search in FirstName, LastName, CPF, RG, E-mail
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { cpf: { contains: searchStr } },
        { rg: { contains: searchStr } },
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
      ];
    }

    // Categorical Filters
    if (gender) {
      where.gender = gender as string;
    }
    if (state) {
      where.state = state as string;
    }
    if (status) {
      where.status = status as string;
    }
    if (isActive !== undefined) {
      where.user.isActive = isActive === 'true';
    }

    const [total, students] = await prisma.$transaction([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          class: true,
          guardians: {
            include: {
              guardian: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
      }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        students,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Get Single Student Detailed Ficha
export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        documents: true,
        history: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
    }

    return res.status(200).json({
      status: 'success',
      data: student,
    });
  } catch (error) {
    return next(error);
  }
};

// 6. Upload Student Document Anexo
export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: 'error', message: 'Arquivo é obrigatório' });
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
    }

    const documentName = name || file.originalname;
    const fileUrl = `/uploads/${file.filename}`;

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          studentId: id,
          name: documentName,
          fileUrl,
          fileType: file.mimetype,
        },
      });

      await tx.studentHistory.create({
        data: {
          studentId: id,
          action: 'DOCUMENTO_ENVIADO',
          details: `Documento "${documentName}" anexado por ${req.user?.email || 'Sistema'}.`,
        },
      });

      return doc;
    });

    return res.status(201).json({
      status: 'success',
      data: document,
    });
  } catch (error) {
    return next(error);
  }
};
export default {
  createStudent,
  updateStudent,
  deleteStudent,
  listStudents,
  getStudent,
  uploadDocument,
};
