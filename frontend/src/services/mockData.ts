// Mock Database for Zx-Escola Offline/Demo Session
export const getMockResponse = (url: string, method: string, params?: any, data?: any): any => {
  const cleanUrl = url.split('?')[0].replace(/^\/api/, '');

  // 1. AUTH / PROFILE ENDPOINTS
  if (cleanUrl === '/auth/profile') {
    const email = localStorage.getItem('@ZxEscola:user') 
      ? JSON.parse(localStorage.getItem('@ZxEscola:user')!).email 
      : 'diretor@escola.com';
    
    let role = 'DIRETOR';
    let firstName = 'Marielle';
    let lastName = 'Silva';

    if (email === 'superadmin@zxescola.com.br') { role = 'SUPER_ADMIN'; firstName = 'Super'; lastName = 'Administrador'; }
    else if (email === 'admin@escola.com') { role = 'ADMIN'; firstName = 'Carlos'; lastName = 'Eduardo'; }
    else if (email === 'secretaria@escola.com') { role = 'STAFF'; firstName = 'Flavia'; lastName = 'Lima'; }
    else if (email === 'professor@escola.com') { role = 'TEACHER'; firstName = 'Roberto'; lastName = 'Abreu'; }
    else if (email === 'financeiro@escola.com') { role = 'FINANCEIRO'; firstName = 'Marcos'; lastName = 'Souza'; }
    else if (email === 'pais@escola.com' || email === 'pai@escola.com') { role = 'GUARDIAN'; firstName = 'Pedro'; lastName = 'Santos'; }
    else if (email === 'aluno@escola.com') { role = 'STUDENT'; firstName = 'Lucas'; lastName = 'Santos'; }

    return {
      status: 'success',
      data: {
        id: `mock-user-${role}`,
        email,
        role,
        isActive: true,
        tenantId: 'escola-matriz-default-id',
        tenantName: 'Escola Matriz Zx',
        profile: {
          firstName,
          lastName,
          phone: '(11) 97777-6666',
          birthDate: '1985-05-15',
          avatarUrl: null,
        }
      }
    };
  }

  // 2. STUDENTS ENDPOINTS
  if (cleanUrl === '/students') {
    return {
      status: 'success',
      data: {
        students: [
          {
            id: 'aluno-lucas-id',
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            gender: 'Masculino',
            status: 'MATRICULADO',
            whatsapp: '(11) 92222-1111',
            user: {
              email: 'aluno@escola.com',
              isActive: true,
              profile: {
                firstName: 'Lucas',
                lastName: 'Santos',
                phone: '(11) 92222-1111',
                birthDate: '2010-08-20',
              }
            }
          },
          {
            id: 'aluno-mariana-id',
            cpf: '987.654.321-11',
            rg: '98.765.432-1',
            gender: 'Feminino',
            status: 'MATRICULADO',
            whatsapp: '(11) 91111-2222',
            user: {
              email: 'mariana@escola.com',
              isActive: true,
              profile: {
                firstName: 'Mariana',
                lastName: 'Oliveira',
                phone: '(11) 91111-2222',
                birthDate: '2011-03-12',
              }
            }
          },
          {
            id: 'aluno-gabriel-id',
            cpf: '456.789.123-22',
            rg: '45.678.912-3',
            gender: 'Masculino',
            status: 'LISTA_DE_ESPERA',
            whatsapp: '(11) 93333-4444',
            user: {
              email: 'gabriel@escola.com',
              isActive: true,
              profile: {
                firstName: 'Gabriel',
                lastName: 'Souza',
                phone: '(11) 93333-4444',
                birthDate: '2012-11-05',
              }
            }
          }
        ],
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 }
      }
    };
  }

  if (cleanUrl.startsWith('/students/')) {
    const id = cleanUrl.split('/').pop();
    const name = id === 'aluno-mariana-id' ? 'Mariana Oliveira' : id === 'aluno-gabriel-id' ? 'Gabriel Souza' : 'Lucas Santos';
    const email = id === 'aluno-mariana-id' ? 'mariana@escola.com' : id === 'aluno-gabriel-id' ? 'gabriel@escola.com' : 'aluno@escola.com';
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ')[1];
    
    return {
      status: 'success',
      data: {
        id: id || 'aluno-lucas-id',
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        gender: 'Masculino',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        cep: '01234-567',
        whatsapp: '(11) 92222-1111',
        guardianName: 'Pedro Santos',
        fatherName: 'Pedro Santos',
        motherName: 'Ana Santos',
        status: id === 'aluno-gabriel-id' ? 'LISTA_DE_ESPERA' : 'MATRICULADO',
        notes: 'Observações gerais do aluno no sistema demo.',
        user: {
          id: `user-${id}`,
          email,
          isActive: true,
          createdAt: new Date().toISOString(),
          profile: {
            firstName,
            lastName,
            phone: '(11) 92222-1111',
            birthDate: '2010-08-20',
            avatarUrl: null
          }
        },
        documents: [
          { id: 'doc-1', name: 'RG_Aluno.pdf', fileUrl: '#', fileType: 'pdf', createdAt: new Date().toISOString() },
          { id: 'doc-2', name: 'Comprovante_Residencia.pdf', fileUrl: '#', fileType: 'pdf', createdAt: new Date().toISOString() }
        ],
        history: [
          { id: 'hist-1', action: 'MATRICULA', details: 'Matrícula inicial realizada no sistema.', createdAt: new Date().toISOString() }
        ],
        guardians: [
          {
            guardian: {
              id: 'guardian-pedro-id',
              name: 'Pedro Santos',
              phone: '(11) 93333-2222',
              relationship: 'Pai',
              isFinancial: true
            }
          }
        ]
      }
    };
  }

  // 3. TEACHERS ENDPOINTS
  if (cleanUrl === '/teachers') {
    return {
      status: 'success',
      data: {
        teachers: [
          {
            id: 'prof-roberto-id',
            subjects: 'Matemática, Física',
            workload: 40,
            classesCount: 2,
            user: {
              email: 'professor@escola.com',
              isActive: true,
              profile: {
                firstName: 'Roberto',
                lastName: 'Abreu',
                phone: '(11) 95555-4444',
              }
            },
            classes: [
              { id: 'turma-a-id', name: '9º Ano A' },
              { id: 'turma-b-id', name: '1º Ano Médio B' }
            ]
          },
          {
            id: 'prof-ana-id',
            subjects: 'Português, Redação',
            workload: 30,
            classesCount: 1,
            user: {
              email: 'ana.prof@escola.com',
              isActive: true,
              profile: {
                firstName: 'Ana',
                lastName: 'Gomes',
                phone: '(11) 94444-5555',
              }
            },
            classes: [
              { id: 'turma-a-id', name: '9º Ano A' }
            ]
          }
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
      }
    };
  }

  // 4. GUARDIANS ENDPOINTS
  if (cleanUrl === '/guardians') {
    return {
      status: 'success',
      data: {
        guardians: [
          {
            id: 'guardian-pedro-id',
            name: 'Pedro Santos',
            email: 'pais@escola.com',
            phone: '(11) 93333-2222',
            whatsapp: '(11) 93333-2222',
            relationship: 'Pai',
            isFinancial: true,
            user: { email: 'pais@escola.com' },
            students: [
              {
                student: {
                  id: 'aluno-lucas-id',
                  user: {
                    profile: { firstName: 'Lucas', lastName: 'Santos' }
                  }
                }
              }
            ]
          }
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
      }
    };
  }

  // 5. EMPLOYEES ENDPOINTS
  if (cleanUrl === '/employees') {
    return {
      status: 'success',
      data: {
        employees: [
          {
            id: 'empl-flavia-id',
            role: 'STAFF',
            department: 'Secretaria',
            notes: 'Atendimento geral e matrículas.',
            user: {
              email: 'secretaria@escola.com',
              isActive: true,
              profile: {
                firstName: 'Flavia',
                lastName: 'Lima',
                phone: '(11) 96666-5555',
              }
            }
          },
          {
            id: 'empl-marcos-id',
            role: 'FINANCEIRO',
            department: 'Financeiro',
            notes: 'Faturamento, mensalidades e contas a pagar.',
            user: {
              email: 'financeiro@escola.com',
              isActive: true,
              profile: {
                firstName: 'Marcos',
                lastName: 'Souza',
                phone: '(11) 94444-3333',
              }
            }
          }
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
      }
    };
  }

  // 6. CLASSES AND ROOMS
  if (cleanUrl === '/classes') {
    return {
      status: 'success',
      data: [
        {
          id: 'turma-a-id',
          name: '9º Ano A',
          gradeYear: '9º Ano',
          schoolYear: '2026',
          roomId: 'sala-101-id',
          room: { id: 'sala-101-id', name: 'Sala 101' },
          teacherId: 'prof-roberto-id',
          teacher: {
            id: 'prof-roberto-id',
            subjects: 'Matemática',
            user: {
              profile: { firstName: 'Roberto', lastName: 'Abreu' }
            }
          },
          students: [
            {
              id: 'aluno-lucas-id',
              status: 'MATRICULADO',
              user: {
                email: 'aluno@escola.com',
                profile: { firstName: 'Lucas', lastName: 'Santos' }
              }
            },
            {
              id: 'aluno-mariana-id',
              status: 'MATRICULADO',
              user: {
                email: 'mariana@escola.com',
                profile: { firstName: 'Mariana', lastName: 'Oliveira' }
              }
            }
          ]
        }
      ]
    };
  }

  if (cleanUrl === '/rooms') {
    return {
      status: 'success',
      data: [
        { id: 'sala-101-id', name: 'Sala 101', capacity: 35, type: 'TEORICA' },
        { id: 'sala-102-id', name: 'Laboratório de Física', capacity: 25, type: 'LABORATORIO' }
      ]
    };
  }

  // 7. ENROLLMENTS / ACADEMIC PROCESSES
  if (cleanUrl === '/enrollments') {
    return {
      status: 'success',
      data: {
        enrollments: [
          {
            id: 'matr-1',
            status: 'MATRICULADO',
            student: {
              user: {
                email: 'aluno@escola.com',
                profile: { firstName: 'Lucas', lastName: 'Santos' }
              }
            },
            createdAt: new Date().toISOString()
          }
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
      }
    };
  }

  // 8. REPORTS
  if (cleanUrl === '/reports') {
    return {
      status: 'success',
      data: {
        financial: {
          totalRevenue: 25000,
          totalExpenses: 18000,
          netResult: 7000,
          defaultRate: 5,
          monthlyCashflow: [
            { month: 'Jan/2026', revenues: 12000, expenses: 9000 },
            { month: 'Fev/2026', revenues: 13000, expenses: 9000 }
          ]
        },
        tuitions: {
          totalExpected: 30000,
          totalCollected: 25000,
          totalPending: 3000,
          totalOverdue: 2000,
          collectionRate: 83.3
        },
        academic: {
          avgGrade: 7.8,
          passRate: 95.0,
          attendanceRate: 94.2,
          gradesBySubject: [
            { subject: 'Matemática', average: 7.5, count: 2 },
            { subject: 'Física', average: 8.0, count: 2 },
            { subject: 'Português', average: 7.9, count: 2 }
          ]
        },
        classes: [
          { id: 'turma-a-id', name: '9º Ano A', studentsCount: 2, attendancePercent: 94.2, avgGrade: 7.8 }
        ],
        students: {
          total: 2,
          byStatus: { MATRICULADO: 2, LISTA_DE_ESPERA: 1 },
          byGender: { Masculino: 1, Feminino: 1 }
        },
        teachers: [
          { id: 'prof-roberto-id', name: 'Roberto Abreu', workload: 40, classesCount: 2, subjects: ['Matemática', 'Física'] }
        ]
      }
    };
  }

  if (cleanUrl === '/reports/logs') {
    return {
      status: 'success',
      data: {
        logs: [
          { id: 'log-1', userId: 'user-admin', action: 'LOGIN', resource: 'AUTH', ipAddress: '127.0.0.1', details: 'User logged in', createdAt: new Date().toISOString() }
        ],
        total: 1
      }
    };
  }

  // 9. SUPERADMIN
  if (cleanUrl === '/superadmin/dashboard') {
    return {
      status: 'success',
      data: {
        summary: {
          totalTenants: 5,
          activeTenants: 4,
          totalUsers: 150,
          monthlyRevenue: 1500,
        },
        charts: {
          monthlyGrowth: [
            { month: 'Jan', count: 1 },
            { month: 'Fev', count: 3 },
            { month: 'Mar', count: 5 }
          ]
        }
      }
    };
  }

  if (cleanUrl === '/superadmin/monitoring') {
    return {
      status: 'success',
      data: {
        cpuUsage: 12,
        memoryUsage: 45,
        databaseStatus: 'ONLINE',
        storageStatus: 'ONLINE',
        uptime: '5d 12h 30m'
      }
    };
  }

  if (cleanUrl === '/superadmin/audit') {
    return {
      status: 'success',
      data: {
        logs: [
          { id: 'sa-log-1', action: 'CREATE_TENANT', details: 'Tenant Escola Matriz created', createdAt: new Date().toISOString() }
        ]
      }
    };
  }

  // 10. PORTAL STUDENT
  if (cleanUrl === '/portal/student/profile') {
    return {
      status: 'success',
      data: {
        id: 'aluno-lucas-id',
        name: 'Lucas Santos',
        email: 'aluno@escola.com',
        phone: '(11) 92222-1111',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        className: '9º Ano A',
        status: 'MATRICULADO',
        avatarUrl: null
      }
    };
  }

  if (cleanUrl === '/portal/student/dashboard') {
    return {
      status: 'success',
      data: {
        stats: {
          avgGrade: 7.8,
          attendancePercent: 95.0,
          pendingTasks: 2
        },
        announcements: [
          { id: 'ann-1', title: 'Reunião de Pais e Mestres', content: 'Prezados pais, no próximo sábado teremos nossa reunião.', createdAt: new Date().toISOString() }
        ]
      }
    };
  }

  if (cleanUrl === '/portal/student/grades') {
    return {
      status: 'success',
      data: [
        { id: 'card-1', subject: 'Matemática', b1: 8.0, b2: 7.5, b3: 8.5, b4: 7.0, rec: null, average: 7.75, status: 'APROVADO' },
        { id: 'card-2', subject: 'Física', b1: 7.0, b2: 8.0, b3: 8.0, b4: 9.0, rec: null, average: 8.0, status: 'APROVADO' }
      ]
    };
  }

  if (cleanUrl === '/portal/student/activities') {
    return {
      status: 'success',
      data: [
        { id: 'act-1', title: 'Trabalho de Física - Óptica', dueDate: '2026-08-10', status: 'PENDENTE' },
        { id: 'act-2', title: 'Exercícios de Álgebra', dueDate: '2026-07-28', status: 'ENTREGUE' }
      ]
    };
  }

  if (cleanUrl === '/portal/student/attendance') {
    return {
      status: 'success',
      data: {
        records: [
          { id: 'att-1', date: '23/07/2026', status: 'PRESENTE' },
          { id: 'att-2', date: '22/07/2026', status: 'PRESENTE' }
        ],
        summary: {
          total: 2,
          present: 2,
          absent: 0,
          percentage: 100
        }
      }
    };
  }

  if (cleanUrl === '/portal/student/schedule') {
    return {
      status: 'success',
      data: {
        contents: [
          { id: 'item-1', time: '08:00 - 09:30', subject: 'Matemática', room: 'Sala 101' },
          { id: 'item-2', time: '09:50 - 11:20', subject: 'Física', room: 'Sala 101' }
        ],
        activities: []
      }
    };
  }

  if (cleanUrl === '/portal/student/announcements') {
    return {
      status: 'success',
      data: [
        { id: 'ann-1', title: 'Reunião de Pais e Mestres', content: 'Prezados pais, no próximo sábado teremos nossa reunião.', createdAt: new Date().toISOString() }
      ]
    };
  }

  if (cleanUrl === '/portal/student/documents') {
    return {
      status: 'success',
      data: [
        { id: 'doc-dec', type: 'DECLARACAO', title: 'Declaração de Matrícula', createdAt: new Date().toISOString() },
        { id: 'doc-com', type: 'COMPROVANTE', title: 'Comprovante de Matrícula', createdAt: new Date().toISOString() }
      ]
    };
  }

  // 11. PORTAL TEACHER
  if (cleanUrl === '/portal/teacher/profile') {
    return {
      status: 'success',
      data: {
        id: 'prof-roberto-id',
        firstName: 'Roberto',
        lastName: 'Abreu',
        email: 'professor@escola.com',
        subjects: 'Matemática, Física',
        profile: {
          firstName: 'Roberto',
          lastName: 'Abreu',
          phone: '(11) 95555-4444'
        }
      }
    };
  }

  if (cleanUrl === '/portal/teacher/dashboard') {
    return {
      status: 'success',
      data: {
        stats: {
          classesCount: 2,
          studentsCount: 35,
          subjects: ['Matemática', 'Física']
        },
        announcements: [
          { id: 'ann-1', title: 'Reunião pedagógica', content: 'Reunião geral de planejamento pedagógico.', createdAt: new Date().toISOString() }
        ]
      }
    };
  }

  if (cleanUrl === '/portal/teacher/classes') {
    return {
      status: 'success',
      data: [
        {
          id: 'turma-a-id',
          name: '9º Ano A',
          gradeYear: '9º Ano',
          students: [
            { id: 'aluno-lucas-id', name: 'Lucas Santos', email: 'aluno@escola.com' },
            { id: 'aluno-mariana-id', name: 'Mariana Oliveira', email: 'mariana@escola.com' }
          ]
        }
      ]
    };
  }

  // 12. PORTAL GUARDIAN
  if (cleanUrl === '/portal/guardian/children') {
    return {
      status: 'success',
      data: [
        {
          id: 'aluno-lucas-id',
          name: 'Lucas Santos',
          className: '9º Ano A',
          avatarUrl: null
        }
      ]
    };
  }

  if (cleanUrl === '/portal/guardian/grades') {
    return {
      status: 'success',
      data: [
        { id: 'card-1', subject: 'Matemática', b1: 8.0, b2: 7.5, b3: 8.5, b4: 7.0, rec: null, average: 7.75, status: 'APROVADO' }
      ]
    };
  }

  if (cleanUrl === '/portal/guardian/finance') {
    return {
      status: 'success',
      data: [
        { id: 'fin-1', description: 'Mensalidade Julho/2026', value: 850.00, dueDate: '2026-07-10', status: 'PAGO', paidDate: '2026-07-09' },
        { id: 'fin-2', description: 'Mensalidade Agosto/2026', value: 850.00, dueDate: '2026-08-10', status: 'PENDENTE', paidDate: null }
      ]
    };
  }

  if (cleanUrl === '/portal/guardian/attendance') {
    return {
      status: 'success',
      data: {
        records: [
          { id: 'att-1', date: '23/07/2026', status: 'PRESENTE' }
        ],
        summary: { total: 1, present: 1, absent: 0, percentage: 100 }
      }
    };
  }

  if (cleanUrl === '/portal/guardian/messages') {
    return {
      status: 'success',
      data: [
        { id: 'msg-1', sender: 'Coordenação', content: 'Nota de aviso sobre o feriado escolar.', createdAt: new Date().toISOString() }
      ]
    };
  }

  if (cleanUrl === '/portal/guardian/documents') {
    return {
      status: 'success',
      data: [
        { id: 'doc-dec-g', type: 'DECLARACAO', title: 'Declaração de Matrícula', createdAt: new Date().toISOString() }
      ]
    };
  }

  // 13. FINANCIAL
  if (cleanUrl === '/financial/summary') {
    return {
      status: 'success',
      data: {
        summary: {
          totalExpected: 15000,
          totalCollected: 12000,
          totalPending: 2000,
          totalOverdue: 1000,
          collectionRate: 80.0
        },
        overdueList: [
          { id: 'trans-1', studentName: 'Lucas Santos', value: 850.00, dueDate: '2026-07-10', description: 'Mensalidade Julho' }
        ],
        paidList: [
          { id: 'trans-2', studentName: 'Mariana Oliveira', value: 850.00, dueDate: '2026-07-10', description: 'Mensalidade Julho' }
        ],
        pendingList: []
      }
    };
  }

  if (cleanUrl === '/financial/transactions') {
    return {
      status: 'success',
      data: [
        { id: 't-1', studentName: 'Lucas Santos', value: 850.00, status: 'PAGO', paymentMethod: 'PIX', date: new Date().toISOString() }
      ]
    };
  }

  if (cleanUrl === '/financial/invoices') {
    return {
      status: 'success',
      data: [
        { id: 'inv-1', number: '2026-0001', studentName: 'Lucas Santos', value: 850.00, status: 'EMITIDA', issueDate: new Date().toISOString() }
      ]
    };
  }

  // 14. LIBRARY
  if (cleanUrl === '/library/summary') {
    return {
      status: 'success',
      data: {
        totalBooks: 450,
        activeLoans: 12,
        overdueLoans: 2,
        pendingReservations: 3
      }
    };
  }

  if (cleanUrl === '/library/categories') {
    return {
      status: 'success',
      data: [
        { id: 'cat-1', name: 'Literatura Brasileira', description: 'Obras de autores brasileiros.' },
        { id: 'cat-2', name: 'Ciências', description: 'Física, Química, Biologia.' }
      ]
    };
  }

  if (cleanUrl === '/library/books') {
    return {
      status: 'success',
      data: [
        { id: 'book-1', title: 'Dom Casmurro', author: 'Machado de Assis', isbn: '978-8572325324', publisher: 'Principis', year: 1899, totalQty: 5, availableQty: 4, category: { id: 'cat-1', name: 'Literatura Brasileira' } },
        { id: 'book-2', title: 'Física Clássica', author: 'Caio Calçada', isbn: '978-8535712345', publisher: 'Atual', year: 2012, totalQty: 10, availableQty: 10, category: { id: 'cat-2', name: 'Ciências' } }
      ]
    };
  }

  if (cleanUrl === '/library/loans') {
    return {
      status: 'success',
      data: [
        { id: 'loan-1', book: { title: 'Dom Casmurro' }, student: { user: { profile: { firstName: 'Lucas', lastName: 'Santos' } } }, loanDate: '2026-07-15', returnDate: null, dueDate: '2026-07-22', status: 'ATRASADO' }
      ]
    };
  }

  if (cleanUrl === '/library/reservations') {
    return {
      status: 'success',
      data: []
    };
  }

  // 15. COMMUNICATION
  if (cleanUrl === '/communication/announcements') {
    return {
      status: 'success',
      data: [
        { id: 'ann-1', title: 'Comunicado Geral', content: 'Férias escolares se aproximando. Fiquem atentos ao calendário de avaliações.', type: 'GERAL', createdAt: new Date().toISOString() }
      ]
    };
  }

  // 16. ACADEMIC ENDPOINTS
  if (cleanUrl === '/academic/contents') {
    return {
      status: 'success',
      data: [
        { id: 'cont-1', title: 'Introdução a Funções de Primeiro Grau', description: 'Definição de funções afins, gráficos e coeficientes.', date: '2026-07-20' }
      ]
    };
  }

  if (cleanUrl === '/academic/attendance') {
    return {
      status: 'success',
      data: []
    };
  }

  if (cleanUrl === '/academic/report-cards') {
    return {
      status: 'success',
      data: []
    };
  }

  return { status: 'success', data: null };
};
