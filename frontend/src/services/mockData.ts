// Helper functions to manage Mock Database in LocalStorage
const getStore = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  const stored = localStorage.getItem(`@ZxEscola:mockDb:${key}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialData;
    }
  }
  localStorage.setItem(`@ZxEscola:mockDb:${key}`, JSON.stringify(initialData));
  return initialData;
};

const setStore = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`@ZxEscola:mockDb:${key}`, JSON.stringify(data));
  }
};

// Mock Database for Zx-Escola Offline/Demo Session
export const getMockResponse = (url: string, method: string, params?: any, data?: any): any => {
  const cleanUrl = url.split('?')[0].replace(/^\/api/, '');
  const parts = cleanUrl.split('/').filter(Boolean);
  const resource = parts[0];
  const methodLower = method.toLowerCase();

  let reqBody = data;
  if (typeof data === 'string') {
    try {
      reqBody = JSON.parse(data);
    } catch {
      // ignore
    }
  }

  // Intercept write operations and collection queries for persistence
  // --- STUDENTS ---
  if (resource === 'students') {
    const list = getStore('students', [
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
    ]);

    if (parts.length === 1) {
      if (methodLower === 'get') {
        let filtered = [...list];
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(item => 
            item.user?.profile?.firstName?.toLowerCase().includes(s) ||
            item.user?.profile?.lastName?.toLowerCase().includes(s) ||
            item.user?.email?.toLowerCase().includes(s) ||
            item.cpf?.includes(s) ||
            item.rg?.includes(s) ||
            item.whatsapp?.includes(s)
          );
        }
        if (params?.gender) {
          filtered = filtered.filter(item => item.gender === params.gender);
        }
        if (params?.isActive) {
          const activeBool = params.isActive === 'true';
          filtered = filtered.filter(item => item.user?.isActive === activeBool);
        }
        if (params?.state) {
          filtered = filtered.filter(item => 
            (item.state?.toLowerCase() === params.state.toLowerCase()) || 
            (item.user?.profile?.state?.toLowerCase() === params.state.toLowerCase())
          );
        }
        return {
          status: 'success',
          data: {
            students: filtered,
            meta: { total: filtered.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `student-${Math.random().toString(36).substring(2, 9)}`;
        const newStudent = {
          id: newId,
          cpf: reqBody.cpf || '',
          rg: reqBody.rg || '',
          gender: reqBody.gender || 'Masculino',
          status: reqBody.status || 'MATRICULADO',
          whatsapp: reqBody.whatsapp || reqBody.phone || '',
          address: reqBody.address || '',
          city: reqBody.city || '',
          state: reqBody.state || '',
          cep: reqBody.cep || '',
          guardianName: reqBody.guardianName || '',
          fatherName: reqBody.fatherName || '',
          motherName: reqBody.motherName || '',
          notes: reqBody.notes || '',
          user: {
            id: `user-${newId}`,
            email: reqBody.email,
            isActive: reqBody.isActive !== false,
            profile: {
              firstName: reqBody.firstName,
              lastName: reqBody.lastName,
              phone: reqBody.phone || '',
              birthDate: reqBody.birthDate || '',
            }
          }
        };
        list.push(newStudent);
        setStore('students', list);
        return { status: 'success', data: newStudent };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'get') {
        const item = list.find(s => s.id === targetId);
        if (item) return { status: 'success', data: item };
        return { status: 'error', message: 'Aluno não encontrado' };
      }
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(s => s.id === targetId);
        if (idx !== -1) {
          const updated = {
            ...list[idx],
            ...reqBody,
            user: {
              ...list[idx].user,
              email: reqBody.email || list[idx].user.email,
              profile: {
                ...list[idx].user.profile,
                firstName: reqBody.firstName || list[idx].user.profile.firstName,
                lastName: reqBody.lastName || list[idx].user.profile.lastName,
                phone: reqBody.phone || list[idx].user.profile.phone,
                birthDate: reqBody.birthDate || list[idx].user.profile.birthDate,
              }
            }
          };
          list[idx] = updated;
          setStore('students', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Aluno não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(s => s.id !== targetId);
        setStore('students', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- TEACHERS ---
  if (resource === 'teachers') {
    const list = getStore('teachers', [
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
    ]);

    if (parts.length === 1) {
      if (methodLower === 'get') {
        let filtered = [...list];
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(item => 
            item.user?.profile?.firstName?.toLowerCase().includes(s) ||
            item.user?.profile?.lastName?.toLowerCase().includes(s) ||
            item.user?.email?.toLowerCase().includes(s) ||
            item.subjects?.toLowerCase().includes(s)
          );
        }
        return {
          status: 'success',
          data: {
            teachers: filtered,
            meta: { total: filtered.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `teacher-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          subjects: reqBody.subjects || '',
          workload: Number(reqBody.workload) || 20,
          classesCount: 0,
          user: {
            email: reqBody.email,
            isActive: reqBody.isActive !== false,
            profile: {
              firstName: reqBody.firstName,
              lastName: reqBody.lastName,
              phone: reqBody.phone || '',
            }
          },
          classes: []
        };
        list.push(newItem);
        setStore('teachers', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'get') {
        const item = list.find(t => t.id === targetId);
        if (item) return { status: 'success', data: item };
        return { status: 'error', message: 'Professor não encontrado' };
      }
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(t => t.id === targetId);
        if (idx !== -1) {
          const updated = {
            ...list[idx],
            subjects: reqBody.subjects || list[idx].subjects,
            workload: reqBody.workload !== undefined ? Number(reqBody.workload) : list[idx].workload,
            user: {
              ...list[idx].user,
              email: reqBody.email || list[idx].user.email,
              profile: {
                ...list[idx].user.profile,
                firstName: reqBody.firstName || list[idx].user.profile.firstName,
                lastName: reqBody.lastName || list[idx].user.profile.lastName,
                phone: reqBody.phone || list[idx].user.profile.phone,
              }
            }
          };
          list[idx] = updated;
          setStore('teachers', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Professor não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(t => t.id !== targetId);
        setStore('teachers', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- GUARDIANS ---
  if (resource === 'guardians') {
    const list = getStore('guardians', [
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
    ]);

    if (parts.length === 1) {
      if (methodLower === 'get') {
        let filtered = [...list];
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(item => 
            item.name?.toLowerCase().includes(s) ||
            item.email?.toLowerCase().includes(s) ||
            item.phone?.includes(s)
          );
        }
        if (params?.relationship) {
          filtered = filtered.filter(item => item.relationship === params.relationship);
        }
        if (params?.isFinancial) {
          const isFinBool = params.isFinancial === 'true';
          filtered = filtered.filter(item => item.isFinancial === isFinBool);
        }
        return {
          status: 'success',
          data: {
            guardians: filtered,
            meta: { total: filtered.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `guardian-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          name: reqBody.name || `${reqBody.firstName || ''} ${reqBody.lastName || ''}`.trim(),
          email: reqBody.email,
          phone: reqBody.phone || '',
          whatsapp: reqBody.whatsapp || reqBody.phone || '',
          relationship: reqBody.relationship || 'Outro',
          isFinancial: reqBody.isFinancial !== false,
          user: { email: reqBody.email },
          students: []
        };
        list.push(newItem);
        setStore('guardians', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'get') {
        const item = list.find(g => g.id === targetId);
        if (item) return { status: 'success', data: item };
        return { status: 'error', message: 'Responsável não encontrado' };
      }
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(g => g.id === targetId);
        if (idx !== -1) {
          const updated = { ...list[idx], ...reqBody };
          list[idx] = updated;
          setStore('guardians', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Responsável não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(g => g.id !== targetId);
        setStore('guardians', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- EMPLOYEES ---
  if (resource === 'employees') {
    const list = getStore('employees', [
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
    ]);

    if (parts.length === 1) {
      if (methodLower === 'get') {
        let filtered = [...list];
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(item => 
            item.user?.profile?.firstName?.toLowerCase().includes(s) ||
            item.user?.profile?.lastName?.toLowerCase().includes(s) ||
            item.user?.email?.toLowerCase().includes(s) ||
            item.department?.toLowerCase().includes(s) ||
            item.role?.toLowerCase().includes(s)
          );
        }
        return {
          status: 'success',
          data: {
            employees: filtered,
            meta: { total: filtered.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `empl-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          role: reqBody.role || 'STAFF',
          department: reqBody.department || '',
          notes: reqBody.notes || '',
          user: {
            email: reqBody.email,
            isActive: reqBody.isActive !== false,
            profile: {
              firstName: reqBody.firstName,
              lastName: reqBody.lastName,
              phone: reqBody.phone || '',
            }
          }
        };
        list.push(newItem);
        setStore('employees', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'get') {
        const item = list.find(e => e.id === targetId);
        if (item) return { status: 'success', data: item };
        return { status: 'error', message: 'Funcionário não encontrado' };
      }
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(e => e.id === targetId);
        if (idx !== -1) {
          const updated = {
            ...list[idx],
            role: reqBody.role || list[idx].role,
            department: reqBody.department || list[idx].department,
            notes: reqBody.notes || list[idx].notes,
            user: {
              ...list[idx].user,
              email: reqBody.email || list[idx].user.email,
              profile: {
                ...list[idx].user.profile,
                firstName: reqBody.firstName || list[idx].user.profile.firstName,
                lastName: reqBody.lastName || list[idx].user.profile.lastName,
                phone: reqBody.phone || list[idx].user.profile.phone,
              }
            }
          };
          list[idx] = updated;
          setStore('employees', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Funcionário não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(e => e.id !== targetId);
        setStore('employees', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- CLASSES ---
  if (resource === 'classes') {
    const list = getStore('classes', [
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
    ]);

    if (parts.length === 1) {
      if (methodLower === 'get') {
        return { status: 'success', data: list };
      }
      if (methodLower === 'post') {
        const newId = `class-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          name: reqBody.name,
          gradeYear: reqBody.gradeYear || '',
          schoolYear: reqBody.schoolYear || new Date().getFullYear().toString(),
          roomId: reqBody.roomId || null,
          room: reqBody.roomId ? { id: reqBody.roomId, name: 'Sala' } : null,
          teacherId: reqBody.teacherId || null,
          teacher: reqBody.teacherId ? { id: reqBody.teacherId, subjects: 'Matéria', user: { profile: { firstName: 'Prof.', lastName: '' } } } : null,
          students: []
        };
        list.push(newItem);
        setStore('classes', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'get') {
        const item = list.find(c => c.id === targetId);
        if (item) return { status: 'success', data: item };
        return { status: 'error', message: 'Turma não encontrada' };
      }
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(c => c.id === targetId);
        if (idx !== -1) {
          const updated = { ...list[idx], ...reqBody };
          list[idx] = updated;
          setStore('classes', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Turma não encontrada' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(c => c.id !== targetId);
        setStore('classes', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- ROOMS ---
  if (resource === 'rooms') {
    const list = getStore('rooms', [
      { id: 'sala-101-id', name: 'Sala 101', capacity: 35, type: 'TEORICA' },
      { id: 'sala-102-id', name: 'Laboratório de Física', capacity: 25, type: 'LABORATORIO' }
    ]);
    if (parts.length === 1) {
      if (methodLower === 'get') return { status: 'success', data: list };
      if (methodLower === 'post') {
        const newId = `room-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = { id: newId, name: reqBody.name, capacity: Number(reqBody.capacity) || 30, type: reqBody.type || 'TEORICA' };
        list.push(newItem);
        setStore('rooms', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'delete') {
        const filtered = list.filter(r => r.id !== targetId);
        setStore('rooms', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- CALENDAR EVENTS ---
  if (resource === 'calendar' && parts[1] === 'events') {
    const list = getStore('calendar_events', [
      {
        id: 'evt-1',
        title: 'Reunião de Pais e Mestres',
        description: 'Entrega de boletins do 1º Bimestre.',
        startDate: new Date().toISOString().split('T')[0] + 'T09:00:00',
        endDate: new Date().toISOString().split('T')[0] + 'T12:00:00',
        type: 'REUNIAO',
        color: 'bg-blue-500',
        classId: 'turma-a-id',
        targetAudience: 'RESPONSAVEIS'
      },
      {
        id: 'evt-2',
        title: 'Feira de Ciências',
        description: 'Apresentação de projetos dos alunos.',
        startDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] + 'T08:00:00',
        endDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] + 'T17:00:00',
        type: 'EVENTO',
        color: 'bg-emerald-500',
        classId: null,
        targetAudience: 'TODOS'
      }
    ]);

    if (parts.length === 2) {
      if (methodLower === 'get') {
        return { status: 'success', data: list };
      }
      if (methodLower === 'post') {
        const newId = `evt-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          title: reqBody.title,
          description: reqBody.description || '',
          startDate: reqBody.startDate,
          endDate: reqBody.endDate,
          type: reqBody.type || 'EVENTO',
          color: reqBody.color || 'bg-primary',
          classId: reqBody.classId || null,
          targetAudience: reqBody.targetAudience || 'TODOS'
        };
        list.push(newItem);
        setStore('calendar_events', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 3) {
      const targetId = parts[2];
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(e => e.id === targetId);
        if (idx !== -1) {
          const updated = { ...list[idx], ...reqBody };
          list[idx] = updated;
          setStore('calendar_events', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Evento não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(e => e.id !== targetId);
        setStore('calendar_events', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- SCHOOLDOCS ---
  if (resource === 'schooldocs') {
    const list = getStore('schooldocs', [
      {
        id: 'doc-1',
        type: 'DECLARACAO',
        title: 'Declaração de Matrícula - Lucas Santos',
        content: 'DECLARAÇÃO DE MATRÍCULA\n\nDeclaramos para os devidos fins que o(a) aluno(a) Lucas Santos está regularmente matriculado(a) nesta instituição de ensino no ano letivo de 2026...',
        studentId: 'student-1',
        studentName: 'Lucas Santos',
        issuedBy: 'diretor@zxescola.com.br',
        status: 'EMITIDO',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'doc-2',
        type: 'HISTORICO',
        title: 'Histórico Escolar Parcial - Mariana Costa',
        content: 'HISTÓRICO ESCOLAR\n\nAluno(a): Mariana Costa...',
        studentId: 'student-2',
        studentName: 'Mariana Costa',
        issuedBy: 'diretor@zxescola.com.br',
        status: 'RASCUNHO',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ]);

    if (parts.length === 1) {
      if (methodLower === 'get') {
        return { status: 'success', data: list };
      }
      if (methodLower === 'post') {
        const newId = `doc-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          type: reqBody.type,
          title: reqBody.title,
          content: reqBody.content || '',
          studentId: reqBody.studentId || null,
          studentName: reqBody.studentName || '',
          issuedBy: reqBody.issuedBy || 'diretor@zxescola.com.br',
          status: reqBody.status || 'RASCUNHO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        setStore('schooldocs', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(d => d.id === targetId);
        if (idx !== -1) {
          const updated = { ...list[idx], ...reqBody, updatedAt: new Date().toISOString() };
          list[idx] = updated;
          setStore('schooldocs', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Documento não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(d => d.id !== targetId);
        setStore('schooldocs', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    }
  }

  // --- LIBRARY ---
  if (resource === 'library') {
    const subResource = parts[1];

    if (subResource === 'books') {
      const list = getStore('library_books', [
        { id: 'book-1', title: 'Dom Casmurro', author: 'Machado de Assis', isbn: '978-8572325324', publisher: 'Principis', year: 1899, totalQty: 5, availableQty: 4, category: { id: 'cat-1', name: 'Literatura Brasileira' } },
        { id: 'book-2', title: 'Física Clássica', author: 'Caio Calçada', isbn: '978-8535712345', publisher: 'Atual', year: 2012, totalQty: 10, availableQty: 10, category: { id: 'cat-2', name: 'Ciências' } }
      ]);

      if (parts.length === 2) {
        if (methodLower === 'get') {
          let filtered = [...list];
          if (params?.search) {
            const s = params.search.toLowerCase();
            filtered = filtered.filter(item => 
              item.title?.toLowerCase().includes(s) ||
              item.author?.toLowerCase().includes(s) ||
              item.isbn?.includes(s)
            );
          }
          return { status: 'success', data: filtered };
        }
        if (methodLower === 'post') {
          const newId = `book-${Math.random().toString(36).substring(2, 9)}`;
          const newItem = {
            id: newId,
            title: reqBody.title,
            author: reqBody.author,
            isbn: reqBody.isbn,
            publisher: reqBody.publisher || '',
            year: Number(reqBody.year) || new Date().getFullYear(),
            totalQty: Number(reqBody.totalQty) || 1,
            availableQty: Number(reqBody.totalQty) || 1,
            category: reqBody.categoryId ? { id: reqBody.categoryId, name: 'Categoria' } : { id: 'cat-1', name: 'Literatura Brasileira' }
          };
          list.push(newItem);
          setStore('library_books', list);
          return { status: 'success', data: newItem };
        }
      } else if (parts.length === 3) {
        const targetId = parts[2];
        if (methodLower === 'put' || methodLower === 'patch') {
          const idx = list.findIndex(b => b.id === targetId);
          if (idx !== -1) {
            const updated = { ...list[idx], ...reqBody };
            list[idx] = updated;
            setStore('library_books', list);
            return { status: 'success', data: updated };
          }
          return { status: 'error', message: 'Livro não encontrado' };
        }
        if (methodLower === 'delete') {
          const filtered = list.filter(b => b.id !== targetId);
          setStore('library_books', filtered);
          return { status: 'success', data: { id: targetId } };
        }
      }
    }

    if (subResource === 'categories') {
      const list = getStore('library_categories', [
        { id: 'cat-1', name: 'Literatura Brasileira', description: 'Obras de autores brasileiros.' },
        { id: 'cat-2', name: 'Ciências', description: 'Física, Química, Biologia.' }
      ]);
      if (parts.length === 2) {
        if (methodLower === 'get') return { status: 'success', data: list };
        if (methodLower === 'post') {
          const newId = `cat-${Math.random().toString(36).substring(2, 9)}`;
          const newItem = { id: newId, name: reqBody.name, description: reqBody.description || '' };
          list.push(newItem);
          setStore('library_categories', list);
          return { status: 'success', data: newItem };
        }
      } else if (parts.length === 3) {
        const targetId = parts[2];
        if (methodLower === 'delete') {
          const filtered = list.filter(c => c.id !== targetId);
          setStore('library_categories', filtered);
          return { status: 'success', data: { id: targetId } };
        }
      }
    }

    if (subResource === 'loans') {
      const list = getStore('library_loans', [
        { id: 'loan-1', book: { title: 'Dom Casmurro' }, borrowerName: 'Maria Silva (Aluna)', loanDate: '2026-07-15', returnDate: null, dueDate: '2026-07-22', status: 'ATIVO' }
      ]);
      if (parts.length === 2) {
        if (methodLower === 'get') return { status: 'success', data: list };
        if (methodLower === 'post') {
          const newId = `loan-${Math.random().toString(36).substring(2, 9)}`;
          const newItem = {
            id: newId,
            book: { title: reqBody.bookTitle || 'Livro Selecionado' },
            borrowerName: reqBody.borrowerName,
            loanDate: reqBody.loanDate || new Date().toISOString().split('T')[0],
            dueDate: reqBody.dueDate,
            returnDate: null,
            status: 'ATIVO'
          };
          list.push(newItem);
          setStore('library_loans', list);
          return { status: 'success', data: newItem };
        }
      } else if (parts.length === 3) {
        const targetId = parts[2];
        if (methodLower === 'put' || methodLower === 'patch') {
          const idx = list.findIndex(l => l.id === targetId);
          if (idx !== -1) {
            const updated = { ...list[idx], ...reqBody };
            list[idx] = updated;
            setStore('library_loans', list);
            return { status: 'success', data: updated };
          }
        }
      }
    }

    if (subResource === 'reservations') {
      const list = getStore('library_reservations', []);
      if (parts.length === 2) {
        if (methodLower === 'get') return { status: 'success', data: list };
        if (methodLower === 'post') {
          const newId = `res-${Math.random().toString(36).substring(2, 9)}`;
          const newItem = {
            id: newId,
            book: { title: 'Livro' },
            requesterName: reqBody.requesterName,
            status: 'AGUARDANDO',
            createdAt: new Date().toISOString()
          };
          list.push(newItem);
          setStore('library_reservations', list);
          return { status: 'success', data: newItem };
        }
      }
    }
  }

  // --- COMMUNICATION ANNOUNCEMENTS ---
  if (resource === 'communication' && parts[1] === 'announcements') {
    const list = getStore('announcements', [
      { id: 'ann-1', title: 'Comunicado Geral', content: 'Férias escolares se aproximando. Fiquem atentos ao calendário de avaliações.', type: 'GERAL', createdAt: new Date().toISOString() }
    ]);
    if (parts.length === 2) {
      if (methodLower === 'get') return { status: 'success', data: list };
      if (methodLower === 'post') {
        const newId = `ann-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          title: reqBody.title,
          content: reqBody.content,
          type: reqBody.type || 'GERAL',
          createdAt: new Date().toISOString()
        };
        list.push(newItem);
        setStore('announcements', list);
        return { status: 'success', data: newItem };
      }
    }
  }

  // Fallback to static mock responses below

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
    const list = getStore('enrollments', [
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
    ]);

    return {
      status: 'success',
      data: {
        enrollments: list,
        meta: { total: list.length, page: 1, limit: 10, totalPages: 1 }
      }
    };
  }

  if (cleanUrl === '/enrollments/process') {
    if (methodLower === 'post') {
      const studentId = reqBody.studentId;
      const status = reqBody.status;

      // Update student status
      const studentsList = getStore('students', []);
      const studentIdx = studentsList.findIndex((s: any) => s.id === studentId);
      let studentEmail = 'estudante@escola.com';
      let studentName = { firstName: 'Estudante', lastName: '' };

      if (studentIdx !== -1) {
        studentsList[studentIdx].status = status;
        setStore('students', studentsList);
        studentEmail = studentsList[studentIdx].user?.email || studentEmail;
        studentName.firstName = studentsList[studentIdx].user?.profile?.firstName || studentName.firstName;
        studentName.lastName = studentsList[studentIdx].user?.profile?.lastName || studentName.lastName;
      }

      // Add enrollment log
      const enrollmentsList = getStore('enrollments', [
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
      ]);

      const newEnrollment = {
        id: `matr-${Math.random().toString(36).substring(2, 9)}`,
        status: status,
        student: {
          user: {
            email: studentEmail,
            profile: {
              firstName: studentName.firstName,
              lastName: studentName.lastName
            }
          }
        },
        createdAt: new Date().toISOString()
      };

      enrollmentsList.push(newEnrollment);
      setStore('enrollments', enrollmentsList);

      return {
        status: 'success',
        data: newEnrollment
      };
    }
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
          suspendedTenants: 1,
          totalUsers: 150,
          totalStudents: 120,
          totalTeachers: 30,
          monthlyRevenue: 1500,
          totalRevenue: 24000,
          activePlans: {
            BASIC: 3,
            PRO: 1,
            ENTERPRISE: 1
          }
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
    const list = getStore('report_cards', [
      {
        id: 'rc-1',
        studentId: 'aluno-lucas-id',
        studentName: 'Lucas Santos',
        classId: 'turma-a-id',
        subject: 'Matemática',
        schoolYear: '2026',
        bimester1: 8.5,
        bimester2: 7.0,
        bimester3: null,
        bimester4: null,
        remedialGrade: null,
        absences: 2,
        status: 'EM_ANDAMENTO'
      }
    ]);
    const filtered = list.filter(rc => rc.studentId === 'aluno-lucas-id');

    const mapped = filtered.map(rc => {
      const gradesList = [rc.bimester1, rc.bimester2, rc.bimester3, rc.bimester4].filter(g => g !== null && g !== undefined) as number[];
      const finalAverage = gradesList.length > 0 ? Number((gradesList.reduce((acc, v) => acc + v, 0) / gradesList.length).toFixed(2)) : null;

      let status = rc.status || 'EM_ANDAMENTO';
      if (finalAverage !== null) {
        if (gradesList.length === 4) {
          status = finalAverage >= 6.0 ? 'APROVADO' : 'REPROVADO';
        } else {
          status = 'CURSANDO';
        }
      }

      return {
        id: rc.id,
        subject: rc.subject,
        bimester1: rc.bimester1,
        bimester2: rc.bimester2,
        bimester3: rc.bimester3,
        bimester4: rc.bimester4,
        remedialGrade: rc.remedialGrade,
        finalAverage: finalAverage,
        absences: rc.absences || 0,
        status: status
      };
    });

    if (mapped.length === 0) {
      return {
        status: 'success',
        data: [
          { id: 'card-1', subject: 'Matemática', bimester1: 8.0, bimester2: 7.5, bimester3: null, bimester4: null, remedialGrade: null, finalAverage: 7.75, absences: 2, status: 'CURSANDO' },
          { id: 'card-2', subject: 'Física', bimester1: 7.0, bimester2: 8.0, bimester3: null, bimester4: null, remedialGrade: null, finalAverage: 7.5, absences: 0, status: 'CURSANDO' }
        ]
      };
    }

    return {
      status: 'success',
      data: mapped
    };
  }

  if (cleanUrl === '/portal/student/activities') {
    const reportCards = getStore('report_cards', []);
    const studentCards = reportCards.filter(rc => rc.studentId === 'aluno-lucas-id');

    const staticActivities = [
      { id: 'act-1', title: 'Trabalho de Física - Óptica', date: '2026-07-24', maxGrade: 10, myGrade: null },
      { id: 'act-2', title: 'Exercícios de Álgebra', date: '2026-07-20', maxGrade: 10, myGrade: 9.5 }
    ];

    studentCards.forEach((rc, index) => {
      if (rc.bimester1 !== null && rc.bimester1 !== undefined) {
        staticActivities.push({
          id: `act-grade-1-${index}`,
          title: `Avaliação 1º Bimestre - ${rc.subject}`,
          date: '2026-04-15',
          maxGrade: 10,
          myGrade: rc.bimester1
        });
      }
      if (rc.bimester2 !== null && rc.bimester2 !== undefined) {
        staticActivities.push({
          id: `act-grade-2-${index}`,
          title: `Avaliação 2º Bimestre - ${rc.subject}`,
          date: '2026-07-02',
          maxGrade: 10,
          myGrade: rc.bimester2
        });
      }
      if (rc.bimester3 !== null && rc.bimester3 !== undefined) {
        staticActivities.push({
          id: `act-grade-3-${index}`,
          title: `Avaliação 3º Bimestre - ${rc.subject}`,
          date: '2026-09-20',
          maxGrade: 10,
          myGrade: rc.bimester3
        });
      }
      if (rc.bimester4 !== null && rc.bimester4 !== undefined) {
        staticActivities.push({
          id: `act-grade-4-${index}`,
          title: `Avaliação 4º Bimestre - ${rc.subject}`,
          date: '2026-11-28',
          maxGrade: 10,
          myGrade: rc.bimester4
        });
      }
    });

    return {
      status: 'success',
      data: staticActivities
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
        name: 'Roberto Abreu',
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
      data: {
        notifications: [
          { id: 'not-g-1', title: 'Comunicado de Provas', content: 'As avaliações do 2º bimestre começam no dia 15.', isRead: false, createdAt: new Date().toISOString() }
        ],
        announcements: [
          { id: 'ann-g-1', title: 'Feriado Escolar', content: 'Lembramos que dia 07 não haverá aula devido ao feriado nacional.', createdAt: new Date().toISOString() }
        ]
      }
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
    const tuitions = getStore('financial_tuitions', [
      {
        id: 't-1',
        description: 'Mensalidade Julho/2026',
        dueDate: '2026-07-10',
        value: 850.00,
        discount: 50.00,
        scholarshipPercent: 10,
        fine: 0,
        interest: 0,
        finalValue: 715.00,
        status: 'PENDENTE',
        paymentMethod: null,
        paymentDate: null,
        studentId: 'aluno-lucas-id',
        student: {
          id: 'aluno-lucas-id',
          user: {
            email: 'aluno@escola.com',
            profile: { firstName: 'Lucas', lastName: 'Santos' }
          }
        }
      }
    ]);
    const transactions = getStore('financial_transactions', [
      {
        id: 'tr-1',
        type: 'RECEITA',
        category: 'Mensalidade',
        description: 'Mensalidade paga - Mariana Oliveira',
        value: 850.00,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'PIX'
      }
    ]);

    const paidTuitions = tuitions.filter((t: any) => t.status === 'PAGO');
    const pendingTuitions = tuitions.filter((t: any) => t.status === 'PENDENTE');
    const overdueTuitions = tuitions.filter((t: any) => t.status === 'ATRASADO');

    const totalRevenues = transactions.filter((t: any) => t.type === 'RECEITA').reduce((acc: number, t: any) => acc + t.value, 0);
    const totalExpenses = transactions.filter((t: any) => t.type === 'DESPESA').reduce((acc: number, t: any) => acc + t.value, 0);

    const paidSum = paidTuitions.reduce((acc: number, t: any) => acc + (t.paidValue || t.finalValue), 0);
    const pendingSum = pendingTuitions.reduce((acc: number, t: any) => acc + t.finalValue, 0);
    const overdueSum = overdueTuitions.reduce((acc: number, t: any) => acc + t.finalValue, 0);

    return {
      status: 'success',
      data: {
        summary: {
          totalRevenues,
          totalExpenses,
          balance: totalRevenues - totalExpenses,
          monthRevenue: paidSum,
          defaultRate: tuitions.length ? (overdueTuitions.length / tuitions.length) * 100 : 0,
          paidCount: paidTuitions.length,
          paidSum,
          pendingCount: pendingTuitions.length,
          pendingSum,
          overdueCount: overdueTuitions.length,
          overdueSum,
          totalTuitionsCount: tuitions.length
        },
        overdueList: overdueTuitions,
        paidList: paidTuitions,
        pendingList: pendingTuitions
      }
    };
  }

  if (cleanUrl === '/financial/tuitions') {
    const list = getStore('financial_tuitions', [
      {
        id: 't-1',
        description: 'Mensalidade Julho/2026',
        dueDate: '2026-07-10',
        value: 850.00,
        discount: 50.00,
        scholarshipPercent: 10,
        fine: 0,
        interest: 0,
        finalValue: 715.00,
        status: 'PENDENTE',
        paymentMethod: null,
        paymentDate: null,
        studentId: 'aluno-lucas-id',
        student: {
          id: 'aluno-lucas-id',
          user: {
            email: 'aluno@escola.com',
            profile: { firstName: 'Lucas', lastName: 'Santos' }
          }
        }
      }
    ]);
    return {
      status: 'success',
      data: list
    };
  }

  if (cleanUrl.startsWith('/financial/tuitions/')) {
    const targetId = cleanUrl.split('/').pop();
    const tuitionsList = getStore('financial_tuitions', []);
    const idx = tuitionsList.findIndex((t: any) => t.id === targetId);
    if (idx !== -1 && (methodLower === 'put' || methodLower === 'patch')) {
      const updated = { ...tuitionsList[idx], ...reqBody };
      tuitionsList[idx] = updated;
      setStore('financial_tuitions', tuitionsList);
      return { status: 'success', data: updated };
    }
  }

  if (cleanUrl === '/financial/installments' && methodLower === 'post') {
    const tuitionsList = getStore('financial_tuitions', []);
    const { studentId, description, value, firstDueDate, installmentsCount } = reqBody;

    const studentsList = getStore('students', []);
    const student = studentsList.find((s: any) => s.id === studentId);
    const studentEmail = student?.user?.email || 'aluno@escola.com';
    const studentFirstName = student?.user?.profile?.firstName || 'Aluno';
    const studentLastName = student?.user?.profile?.lastName || '';

    const count = Number(installmentsCount) || 1;
    const baseVal = Number(value) || 0;

    const newItems = [];
    const baseDate = new Date(firstDueDate || Date.now());

    for (let i = 0; i < count; i++) {
      const dueDateStr = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate())
        .toISOString().split('T')[0];
      const newId = `t-${Math.random().toString(36).substring(2, 9)}`;
      const newItem = {
        id: newId,
        description: `${description} (${i + 1}/${count})`,
        dueDate: dueDateStr,
        value: baseVal,
        discount: 0,
        scholarshipPercent: 0,
        fine: 0,
        interest: 0,
        finalValue: baseVal,
        status: 'PENDENTE',
        paymentMethod: null,
        paymentDate: null,
        studentId,
        student: {
          id: studentId,
          user: {
            email: studentEmail,
            profile: { firstName: studentFirstName, lastName: studentLastName }
          }
        }
      };
      newItems.push(newItem);
      tuitionsList.push(newItem);
    }
    setStore('financial_tuitions', tuitionsList);
    return { status: 'success', data: newItems };
  }

  if (cleanUrl.startsWith('/financial/pay/')) {
    const targetId = cleanUrl.split('/').pop();
    const tuitionsList = getStore('financial_tuitions', []);
    const idx = tuitionsList.findIndex((t: any) => t.id === targetId);
    if (idx !== -1 && methodLower === 'post') {
      const updated = {
        ...tuitionsList[idx],
        status: 'PAGO',
        paymentMethod: reqBody.paymentMethod || 'PIX',
        paymentDate: reqBody.paymentDate || new Date().toISOString().split('T')[0],
        paidValue: Number(reqBody.value) || tuitionsList[idx].finalValue
      };
      tuitionsList[idx] = updated;
      setStore('financial_tuitions', tuitionsList);

      // Add transaction
      const transactionsList = getStore('financial_transactions', []);
      transactionsList.push({
        id: `tr-${Math.random().toString(36).substring(2, 9)}`,
        type: 'RECEITA',
        category: 'Mensalidade',
        description: `Pagamento recebido - ${updated.student.user.profile?.firstName || 'Aluno'} ${updated.student.user.profile?.lastName || ''}`,
        value: updated.paidValue,
        date: updated.paymentDate,
        paymentMethod: updated.paymentMethod
      });
      setStore('financial_transactions', transactionsList);

      return { status: 'success', data: updated };
    }
  }

  if (cleanUrl === '/financial/transactions') {
    const list = getStore('financial_transactions', [
      {
        id: 'tr-1',
        type: 'RECEITA',
        category: 'Mensalidade',
        description: 'Mensalidade paga - Mariana Oliveira',
        value: 850.00,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'PIX'
      }
    ]);
    if (methodLower === 'get') return { status: 'success', data: list };
    if (methodLower === 'post') {
      const newId = `tr-${Math.random().toString(36).substring(2, 9)}`;
      const newItem = {
        id: newId,
        type: reqBody.type || 'RECEITA',
        category: reqBody.category || 'Outros',
        description: reqBody.description,
        value: Number(reqBody.value) || 0,
        date: reqBody.date || new Date().toISOString().split('T')[0],
        paymentMethod: reqBody.paymentMethod || 'PIX'
      };
      list.push(newItem);
      setStore('financial_transactions', list);
      return { status: 'success', data: newItem };
    }
  }

  if (cleanUrl.startsWith('/financial/transactions/')) {
    const targetId = cleanUrl.split('/').pop();
    const list = getStore('financial_transactions', []);
    if (methodLower === 'delete') {
      const filtered = list.filter((tr: any) => tr.id !== targetId);
      setStore('financial_transactions', filtered);
      return { status: 'success', data: { id: targetId } };
    }
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
        overdueCount: 2,
        pendingReservations: 3,
        totalFinesCollected: 15.00,
        overdueList: [
          {
            id: 'loan-overdue-1',
            dueDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
            borrowerName: 'Maria Silva (Aluna)',
            book: { title: 'Dom Casmurro' }
          },
          {
            id: 'loan-overdue-2',
            dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
            borrowerName: 'João Santos (Aluno)',
            book: { title: 'Memórias Póstumas de Brás Cubas' }
          }
        ]
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

  // 17. DIGITAL SECRETARY (schooldocs)
  if (cleanUrl === '/schooldocs') {
    return {
      status: 'success',
      data: [
        {
          id: 'doc-1',
          type: 'DECLARACAO',
          title: 'Declaração de Matrícula - Lucas Santos',
          content: 'DECLARAÇÃO DE MATRÍCULA\n\nDeclaramos para os devidos fins que o(a) aluno(a) Lucas Santos está regularmente matriculado(a) nesta instituição de ensino no ano letivo de 2026...',
          studentId: 'student-1',
          studentName: 'Lucas Santos',
          issuedBy: 'diretor@zxescola.com.br',
          status: 'EMITIDO',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'doc-2',
          type: 'HISTORICO',
          title: 'Histórico Escolar Parcial - Mariana Costa',
          content: 'HISTÓRICO ESCOLAR\n\nAluno(a): Mariana Costa...',
          studentId: 'student-2',
          studentName: 'Mariana Costa',
          issuedBy: 'diretor@zxescola.com.br',
          status: 'RASCUNHO',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ]
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

  if (cleanUrl === '/communication/notifications') {
    return {
      status: 'success',
      data: [
        {
          id: 'notif-1',
          title: 'Nova mensagem do Diretor',
          content: 'Lembrete: amanhã haverá conselho de classe pedagógico a partir das 14:00.',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif-2',
          title: 'Documento assinado',
          content: 'A Declaração de Matrícula de Lucas Santos foi assinada digitalmente.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    };
  }

  if (cleanUrl === '/communication/logs') {
    return {
      status: 'success',
      data: [
        {
          id: 'log-1',
          recipientRole: 'TEACHER',
          recipientName: 'Roberto Abreu',
          channel: 'EMAIL',
          subject: 'Conselho de Classe',
          body: 'Lembramos a todos os docentes da reunião pedagógica extraordinária de amanhã.',
          status: 'ENVIADO',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
        }
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
    const list = getStore('report_cards', [
      {
        id: 'rc-1',
        studentId: 'aluno-lucas-id',
        studentName: 'Lucas Santos',
        classId: 'turma-a-id',
        subject: 'Matemática',
        schoolYear: '2026',
        bimester1: 8.5,
        bimester2: 7.0,
        bimester3: null,
        bimester4: null,
        remedialGrade: null,
        absences: 2,
        status: 'EM_ANDAMENTO'
      }
    ]);

    if (methodLower === 'get') {
      const classId = params?.classId;
      const studentId = params?.studentId;
      let filtered = [...list];
      if (classId) {
        filtered = filtered.filter(rc => rc.classId === classId);
      }
      if (studentId) {
        filtered = filtered.filter(rc => rc.studentId === studentId);
      }
      return { status: 'success', data: filtered };
    }

    if (methodLower === 'post') {
      const key = `${reqBody.studentId}_${reqBody.subject}_${reqBody.schoolYear || '2026'}`;
      const idx = list.findIndex(rc => `${rc.studentId}_${rc.subject}_${rc.schoolYear}` === key);

      const newItem = {
        id: idx !== -1 ? list[idx].id : `rc-${Math.random().toString(36).substring(2, 9)}`,
        studentId: reqBody.studentId,
        subject: reqBody.subject,
        schoolYear: reqBody.schoolYear || '2026',
        classId: reqBody.classId || (idx !== -1 ? list[idx].classId : 'turma-a-id'),
        bimester1: reqBody.bimester1 !== undefined ? reqBody.bimester1 : (idx !== -1 ? list[idx].bimester1 : null),
        bimester2: reqBody.bimester2 !== undefined ? reqBody.bimester2 : (idx !== -1 ? list[idx].bimester2 : null),
        bimester3: reqBody.bimester3 !== undefined ? reqBody.bimester3 : (idx !== -1 ? list[idx].bimester3 : null),
        bimester4: reqBody.bimester4 !== undefined ? reqBody.bimester4 : (idx !== -1 ? list[idx].bimester4 : null),
        remedialGrade: reqBody.remedialGrade !== undefined ? reqBody.remedialGrade : (idx !== -1 ? list[idx].remedialGrade : null),
        absences: reqBody.absences !== undefined ? Number(reqBody.absences) : (idx !== -1 ? list[idx].absences : 0),
        status: 'EM_ANDAMENTO'
      };

      if (idx !== -1) {
        list[idx] = newItem;
      } else {
        list.push(newItem);
      }
      setStore('report_cards', list);
      return { status: 'success', data: newItem };
    }
  }

  if (parts[0] === 'tenants') {
    const list = getStore('tenants', [
      { id: 'escola-matriz-default-id', name: 'Escola Matriz Zx', tradeName: 'Zx Escola', cnpj: '12.345.678/0001-90', status: 'ATIVO', planId: 'plan-premium', createdAt: new Date().toISOString() },
      { id: 'escola-filial-id', name: 'Escola Filial Zx Norte', tradeName: 'Zx Escola Norte', cnpj: '12.345.678/0002-77', status: 'ATIVO', planId: 'plan-basic', createdAt: new Date().toISOString() }
    ]);
    if (parts.length === 1) {
      if (methodLower === 'get') {
        return {
          status: 'success',
          data: {
            tenants: list,
            meta: { total: list.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `tenant-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          name: reqBody.name,
          tradeName: reqBody.tradeName || reqBody.name,
          cnpj: reqBody.cnpj || '',
          status: reqBody.status || 'ATIVO',
          planId: reqBody.planId || 'plan-basic',
          createdAt: new Date().toISOString()
        };
        list.push(newItem);
        setStore('tenants', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(t => t.id === targetId);
        if (idx !== -1) {
          const updated = { ...list[idx], ...reqBody };
          list[idx] = updated;
          setStore('tenants', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Escola não encontrada' };
      }
    }
  }

  if (parts[0] === 'roles') {
    const list = getStore('roles', [
      { id: 'role-admin', name: 'Administrador', description: 'Acesso total ao sistema.', isSystemDefault: true, permissions: JSON.stringify({ library: ['view', 'lend'] }), createdAt: new Date().toISOString() },
      { id: 'role-diretor', name: 'Diretor', description: 'Direção escolar e acadêmica.', isSystemDefault: true, permissions: JSON.stringify({ library: ['view'] }), createdAt: new Date().toISOString() }
    ]);
    if (parts.length === 1) {
      if (methodLower === 'get') {
        return {
          status: 'success',
          data: {
            roles: list,
            meta: { total: list.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `role-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          name: reqBody.name,
          description: reqBody.description || '',
          permissions: typeof reqBody.permissions === 'string' ? reqBody.permissions : JSON.stringify(reqBody.permissions || {}),
          isSystemDefault: false,
          createdAt: new Date().toISOString()
        };
        list.push(newItem);
        setStore('roles', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(r => r.id === targetId);
        if (idx !== -1) {
          const updated = {
            ...list[idx],
            ...reqBody,
            permissions: typeof reqBody.permissions === 'string' ? reqBody.permissions : JSON.stringify(reqBody.permissions || list[idx].permissions)
          };
          list[idx] = updated;
          setStore('roles', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Perfil não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(r => r.id !== targetId);
        setStore('roles', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    } else if (parts.length === 3 && parts[2] === 'duplicate') {
      const targetId = parts[1];
      if (methodLower === 'post') {
        const source = list.find(r => r.id === targetId);
        if (source) {
          const newId = `role-${Math.random().toString(36).substring(2, 9)}`;
          const newItem = {
            ...source,
            id: newId,
            name: `${source.name} (Cópia)`,
            isSystemDefault: false,
            createdAt: new Date().toISOString()
          };
          list.push(newItem);
          setStore('roles', list);
          return { status: 'success', data: newItem };
        }
      }
    }
  }

  if (parts[0] === 'plans') {
    const list = getStore('plans', [
      { id: 'plan-basic', name: 'Plano Básico', price: 199.90, billingPeriod: 'MENSAL', maxStudents: 150, maxUsers: 10, library: true, financial: false, description: 'Indicado para pequenas escolas.', createdAt: new Date().toISOString() },
      { id: 'plan-premium', name: 'Plano Premium', price: 499.90, billingPeriod: 'MENSAL', maxStudents: 1000, maxUsers: 50, library: true, financial: true, description: 'Acesso completo a todos os recursos.', createdAt: new Date().toISOString() }
    ]);
    if (parts.length === 1) {
      if (methodLower === 'get') {
        return {
          status: 'success',
          data: {
            plans: list,
            meta: { total: list.length, page: 1, limit: 100, totalPages: 1 }
          }
        };
      }
      if (methodLower === 'post') {
        const newId = `plan-${Math.random().toString(36).substring(2, 9)}`;
        const newItem = {
          id: newId,
          name: reqBody.name,
          price: Number(reqBody.price) || 0,
          billingPeriod: reqBody.billingPeriod || 'MENSAL',
          maxStudents: Number(reqBody.maxStudents) || 100,
          maxUsers: Number(reqBody.maxUsers) || 10,
          library: reqBody.library !== false,
          financial: reqBody.financial !== false,
          description: reqBody.description || '',
          createdAt: new Date().toISOString()
        };
        list.push(newItem);
        setStore('plans', list);
        return { status: 'success', data: newItem };
      }
    } else if (parts.length === 2) {
      const targetId = parts[1];
      if (methodLower === 'put' || methodLower === 'patch') {
        const idx = list.findIndex(p => p.id === targetId);
        if (idx !== -1) {
          const updated = { ...list[idx], ...reqBody };
          list[idx] = updated;
          setStore('plans', list);
          return { status: 'success', data: updated };
        }
        return { status: 'error', message: 'Plano não encontrado' };
      }
      if (methodLower === 'delete') {
        const filtered = list.filter(p => p.id !== targetId);
        setStore('plans', filtered);
        return { status: 'success', data: { id: targetId } };
      }
    } else if (parts.length === 3 && parts[2] === 'duplicate') {
      const targetId = parts[1];
      if (methodLower === 'post') {
        const source = list.find(p => p.id === targetId);
        if (source) {
          const newId = `plan-${Math.random().toString(36).substring(2, 9)}`;
          const newItem = {
            ...source,
            id: newId,
            name: `${source.name} (Cópia)`,
            createdAt: new Date().toISOString()
          };
          list.push(newItem);
          setStore('plans', list);
          return { status: 'success', data: newItem };
        }
      }
    }
  }

  if (cleanUrl === '/academic/contents') {
    const list = getStore('academic_contents', [
      { id: 'cont-1', title: 'Introdução a Funções de Primeiro Grau', description: 'Definição de funções afins, gráficos e coeficientes.', date: '2026-07-20' }
    ]);
    if (methodLower === 'get') return { status: 'success', data: list };
    if (methodLower === 'post') {
      const newId = `cont-${Math.random().toString(36).substring(2, 9)}`;
      const newItem = {
        id: newId,
        title: reqBody.title,
        description: reqBody.description || '',
        date: reqBody.date || new Date().toISOString().split('T')[0]
      };
      list.push(newItem);
      setStore('academic_contents', list);
      return { status: 'success', data: newItem };
    }
  }

  if (cleanUrl === '/academic/attendance') {
    const list = getStore('academic_attendance', []);
    if (methodLower === 'get') return { status: 'success', data: list };
    if (methodLower === 'post') {
      const newId = `att-${Math.random().toString(36).substring(2, 9)}`;
      const newItem = {
        id: newId,
        classId: reqBody.classId,
        date: reqBody.date || new Date().toISOString().split('T')[0],
        records: reqBody.records || []
      };
      list.push(newItem);
      setStore('academic_attendance', list);
      return { status: 'success', data: newItem };
    }
  }

  if (cleanUrl.endsWith('/upload')) {
    return { status: 'success', data: { fileUrl: 'https://zx-escola.vercel.app/simulated-file.pdf' } };
  }

  return { status: 'success', data: null };
};
