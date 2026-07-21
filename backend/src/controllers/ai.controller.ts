import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { callAIService } from '../services/ai.service';

export const generateQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, gradeYear, topic, qty, difficulty } = req.body;
    if (!subject || !topic) {
      return res
        .status(400)
        .json({ status: 'error', message: 'subject e topic são obrigatórios.' });
    }

    const prompt = `Gere uma lista de ${qty || 5} questões sobre o tema "${topic}" da disciplina de "${subject}" adequada para alunos do "${gradeYear || 'Ensino Geral'}". Nível de dificuldade solicitado: "${difficulty || 'Média'}". Apresente gabaritos e critérios de correção.`;
    const sysInstructions =
      'Você é um professor experiente e criador de conteúdos pedagógicos de alta qualidade. Formate suas respostas usando Markdown limpo com títulos, marcadores e separadores claros.';

    const result = await callAIService(prompt, sysInstructions);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

export const generateLessonPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, gradeYear, topic, duration, objectives } = req.body;
    if (!subject || !topic) {
      return res
        .status(400)
        .json({ status: 'error', message: 'subject e topic são obrigatórios.' });
    }

    const prompt = `Elabore um Plano de Aula completo. Disciplina: "${subject}", Série: "${gradeYear || 'Ensino Geral'}", Tema: "${topic}", Duração Estimada: "${duration || '2 aulas'}". Objetivos de aprendizagem a cobrir: "${objectives || 'Gerais da ementa'}". Estruture com conteúdo programático, metodologia, recursos e métodos de avaliação.`;
    const sysInstructions =
      'Você é um coordenador pedagógico sênior focado em planos de ensino modernos, dinâmicos e adaptados a metodologias ativas.';

    const result = await callAIService(prompt, sysInstructions);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

export const summarizeStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ status: 'error', message: 'studentId é obrigatório.' });
    }

    // Load student records
    const [student, reportCards, attendances, activityGrades] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { include: { profile: true } } },
      }),
      prisma.reportCard.findMany({ where: { studentId } }),
      prisma.attendance.findMany({ where: { studentId } }),
      prisma.activityGrade.findMany({
        where: { studentId },
        include: { activity: true },
      }),
    ]);

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Estudante não encontrado.' });
    }

    const name = student.user.profile
      ? `${student.user.profile.firstName} ${student.user.profile.lastName}`
      : student.user.email;

    // Build data summary for AI context
    const gradeSummary = reportCards
      .map(
        (rc) =>
          `${rc.subject}: Média Final = ${rc.finalAverage ?? 'Não lançada'}, Status = ${rc.status}, Faltas = ${rc.absences}`
      )
      .join('\n');

    const totalPresences = attendances.length;
    const presentCount = attendances.filter((a) => a.status === 'PRESENTE').length;
    const attendancePercent =
      totalPresences > 0 ? Math.round((presentCount / totalPresences) * 100) : 100;

    const activitySummary = activityGrades
      .map((ag) => `${ag.activity.title}: Nota = ${ag.value} (Máx: ${ag.activity.maxGrade})`)
      .join('\n');

    const prompt = `Resuma o desempenho pedagógico do estudante "${name}". 
Histórico de boletim:
${gradeSummary || 'Nenhuma média lançada.'}

Taxa de Presença: ${attendancePercent}% (${presentCount} presenças em ${totalPresences} aulas).

Desempenho em Atividades Práticas:
${activitySummary || 'Nenhuma nota de atividade individual lançada.'}

Escreva uma síntese pedagógica profissional e construtiva detalhando os pontos fortes, as oportunidades de melhoria e as orientações práticas para recuperação/desenvolvimento do estudante.`;

    const sysInstructions =
      'Você é um psicopedagogo e professor orientador de turma. Escreva relatórios claros, objetivos, empáticos e focados no crescimento acadêmico do aluno.';

    const result = await callAIService(prompt, sysInstructions);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

export const askAssistant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      return res.status(400).json({ status: 'error', message: 'question é obrigatória.' });
    }

    const prompt = `Contexto Adicional / Disciplina: "${context || 'Geral/Pedagógico'}"
Dúvida do Professor: "${question}"
Responda de forma clara, oferecendo suporte didático ou respondendo à dúvida conceitual.`;
    const sysInstructions =
      'Você é o Tutor de Apoio Didático de Inteligência Artificial da Escola. Seu papel é capacitar e apoiar o corpo docente.';

    const result = await callAIService(prompt, sysInstructions);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};

export const generateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, audience, tone } = req.body;
    if (!topic) {
      return res.status(400).json({ status: 'error', message: 'topic é obrigatório.' });
    }

    const prompt = `Escreva um comunicado escolar sobre: "${topic}". Público-alvo: "${audience || 'Toda a comunidade escolar'}". Tom de voz esperado: "${tone || 'Profissional e acolhedor'}".`;
    const sysInstructions =
      'Você é o Diretor Executivo de Comunicação e Relações Públicas do Colégio. Crie comunicados claros, bem pontuados e que transmitem confiança.';

    const result = await callAIService(prompt, sysInstructions);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};
export default {
  generateQuestions,
  generateLessonPlan,
  summarizeStudent,
  askAssistant,
  generateAnnouncement,
};
