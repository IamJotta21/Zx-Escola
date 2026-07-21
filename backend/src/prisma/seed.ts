/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('123456', 10);

  const seedUsers = [
    {
      email: 'admin@escola.com',
      role: 'ADMIN',
      firstName: 'Carlos',
      lastName: 'Eduardo',
      phone: '(11) 98888-7777',
    },
    {
      email: 'diretor@escola.com',
      role: 'DIRETOR',
      firstName: 'Marielle',
      lastName: 'Silva',
      phone: '(11) 97777-6666',
    },
    {
      email: 'secretaria@escola.com',
      role: 'STAFF',
      firstName: 'Flavia',
      lastName: 'Lima',
      phone: '(11) 96666-5555',
    },
    {
      email: 'professor@escola.com',
      role: 'TEACHER',
      firstName: 'Roberto',
      lastName: 'Abreu',
      phone: '(11) 95555-4444',
    },
    {
      email: 'financeiro@escola.com',
      role: 'FINANCEIRO',
      firstName: 'Marcos',
      lastName: 'Souza',
      phone: '(11) 94444-3333',
    },
    {
      email: 'pais@escola.com',
      role: 'GUARDIAN',
      firstName: 'Pedro',
      lastName: 'Santos',
      phone: '(11) 93333-2222',
    },
    {
      email: 'aluno@escola.com',
      role: 'STUDENT',
      firstName: 'Lucas',
      lastName: 'Santos',
      phone: '(11) 92222-1111',
    },
  ];

  for (const seed of seedUsers) {
    const user = await prisma.user.create({
      data: {
        email: seed.email,
        password: hashedPassword,
        role: seed.role,
        profile: {
          create: {
            firstName: seed.firstName,
            lastName: seed.lastName,
            phone: seed.phone,
          },
        },
      },
    });

    if (seed.role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          subjects: 'Matemática, Física, Geral',
          workload: 20,
        },
      });
    } else if (seed.role === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          status: 'MATRICULADO',
        },
      });
    } else if (seed.role === 'GUARDIAN') {
      await prisma.guardian.create({
        data: {
          userId: user.id,
          name: `${seed.firstName} ${seed.lastName}`,
          email: seed.email,
          phone: seed.phone,
          isFinancial: true,
        },
      });
    }

    console.log(`Created user: ${user.email} with role ${user.role}`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
