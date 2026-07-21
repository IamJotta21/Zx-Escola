import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  BookOpen,
  FileText,
  User,
  MessageSquare,
  Volume2,
  Copy,
  Printer,
  RefreshCw,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface StudentShort {
  id: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

export const AIAssistantPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'questions' | 'lesson_plan' | 'student_summary' | 'qa' | 'announcement'
  >('questions');
  const [students, setStudents] = useState<StudentShort[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Form states
  const [questionsForm, setQuestionsForm] = useState({
    subject: 'História',
    gradeYear: '7º Ano',
    topic: 'Revolução Francesa',
    qty: '5',
    difficulty: 'Média',
  });
  const [lessonPlanForm, setLessonPlanForm] = useState({
    subject: 'Geografia',
    gradeYear: '8º Ano',
    topic: 'Globalização',
    duration: '2 aulas',
    objectives: 'Explicar a conexão de redes econômicas e sociais globais.',
  });
  const [studentSummaryForm, setStudentSummaryForm] = useState({ studentId: '' });
  const [qaForm, setQaForm] = useState({ question: '', context: 'Geral' });
  const [announcementForm, setAnnouncementForm] = useState({
    topic: 'Reunião de Pais e Mestres do 2º Bimestre',
    audience: 'Pais e Responsáveis',
    tone: 'Formal e Acolhedor',
  });

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { limit: '200' } });
      setStudents(res.data.data.students || []);
    } catch {
      // Silent error
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleGenerate = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedResult('');
    setCopied(false);

    try {
      let endpoint = '';
      let payload = {};

      if (type === 'questions') {
        endpoint = '/ai/generate-questions';
        payload = questionsForm;
      } else if (type === 'lesson_plan') {
        endpoint = '/ai/generate-lesson-plan';
        payload = lessonPlanForm;
      } else if (type === 'student_summary') {
        endpoint = '/ai/summarize-student';
        payload = studentSummaryForm;
      } else if (type === 'qa') {
        endpoint = '/ai/ask-assistant';
        payload = qaForm;
      } else if (type === 'announcement') {
        endpoint = '/ai/generate-announcement';
        payload = announcementForm;
      }

      const res = await api.post(endpoint, payload);
      setGeneratedResult(res.data.data);
      addToast({ type: 'success', message: 'Conteúdo didático gerado com IA!' });
    } catch {
      addToast({
        type: 'error',
        message: 'Erro ao gerar conteúdo didático pela IA. Verifique as configurações.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    addToast({ type: 'success', message: 'Copiado para a área de transferência!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" /> Assistente de IA para
            Professores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Elabore provas, planos de aula, comunicados e analise turmas usando Inteligência
            Artificial.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto pb-px">
        {[
          {
            key: 'questions',
            label: 'Gerador de Provas/Questões',
            icon: <BookOpen className="h-4 w-4" />,
          },
          { key: 'lesson_plan', label: 'Plano de Aula', icon: <FileText className="h-4 w-4" /> },
          {
            key: 'student_summary',
            label: 'Análise de Desempenho',
            icon: <User className="h-4 w-4" />,
          },
          {
            key: 'qa',
            label: 'Tutor de Apoio Didático',
            icon: <MessageSquare className="h-4 w-4" />,
          },
          {
            key: 'announcement',
            label: 'Gerador de Comunicados',
            icon: <Volume2 className="h-4 w-4" />,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(
                t.key as 'questions' | 'lesson_plan' | 'student_summary' | 'qa' | 'announcement'
              );
              setGeneratedResult('');
            }}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side Form Config */}
        <Card className="stripe-card lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">
              Configurações de Geração
            </CardTitle>
            <CardDescription className="text-xs">
              Defina os parâmetros para a Inteligência Artificial criar o conteúdo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* QUESTIONS FORM */}
            {activeTab === 'questions' && (
              <form onSubmit={(e) => handleGenerate(e, 'questions')} className="space-y-4">
                <Input
                  label="Disciplina *"
                  value={questionsForm.subject}
                  onChange={(e) => setQuestionsForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                />
                <Input
                  label="Série / Ano Letivo"
                  value={questionsForm.gradeYear}
                  onChange={(e) => setQuestionsForm((f) => ({ ...f, gradeYear: e.target.value }))}
                />
                <Input
                  label="Tema ou Conteúdo *"
                  value={questionsForm.topic}
                  onChange={(e) => setQuestionsForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="Ex: Frações Equivalentes, Segunda Guerra"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Qtd Questões"
                    options={[
                      { value: '3', label: '3 Questões' },
                      { value: '5', label: '5 Questões' },
                      { value: '10', label: '10 Questões' },
                    ]}
                    value={questionsForm.qty}
                    onChange={(e) => setQuestionsForm((f) => ({ ...f, qty: e.target.value }))}
                  />
                  <Select
                    label="Dificuldade"
                    options={[
                      { value: 'Fácil', label: 'Fácil' },
                      { value: 'Média', label: 'Média' },
                      { value: 'Difícil', label: 'Difícil' },
                    ]}
                    value={questionsForm.difficulty}
                    onChange={(e) =>
                      setQuestionsForm((f) => ({ ...f, difficulty: e.target.value }))
                    }
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isGenerating}
                  className="w-full"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Gerar Questões
                </Button>
              </form>
            )}

            {/* LESSON PLAN FORM */}
            {activeTab === 'lesson_plan' && (
              <form onSubmit={(e) => handleGenerate(e, 'lesson_plan')} className="space-y-4">
                <Input
                  label="Disciplina *"
                  value={lessonPlanForm.subject}
                  onChange={(e) => setLessonPlanForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                />
                <Input
                  label="Série / Ano Letivo"
                  value={lessonPlanForm.gradeYear}
                  onChange={(e) => setLessonPlanForm((f) => ({ ...f, gradeYear: e.target.value }))}
                />
                <Input
                  label="Tema da Aula *"
                  value={lessonPlanForm.topic}
                  onChange={(e) => setLessonPlanForm((f) => ({ ...f, topic: e.target.value }))}
                  required
                />
                <Input
                  label="Duração Estimada"
                  value={lessonPlanForm.duration}
                  onChange={(e) => setLessonPlanForm((f) => ({ ...f, duration: e.target.value }))}
                />
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Objetivos Pedagógicos
                  </label>
                  <textarea
                    rows={3}
                    value={lessonPlanForm.objectives}
                    onChange={(e) =>
                      setLessonPlanForm((f) => ({ ...f, objectives: e.target.value }))
                    }
                    className="w-full text-xs bg-background text-foreground border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isGenerating}
                  className="w-full"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Gerar Plano de Aula
                </Button>
              </form>
            )}

            {/* STUDENT SUMMARY FORM */}
            {activeTab === 'student_summary' && (
              <form onSubmit={(e) => handleGenerate(e, 'student_summary')} className="space-y-4">
                <Select
                  label="Selecionar Estudante *"
                  options={[
                    { value: '', label: 'Selecione um estudante...' },
                    ...students.map((s) => ({
                      value: s.id,
                      label: s.user.profile
                        ? `${s.user.profile.firstName} ${s.user.profile.lastName}`
                        : s.id,
                    })),
                  ]}
                  value={studentSummaryForm.studentId}
                  onChange={(e) => setStudentSummaryForm({ studentId: e.target.value })}
                  required
                />
                <Button
                  type="submit"
                  isLoading={isGenerating}
                  className="w-full"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Gerar Ficha e Análise
                </Button>
              </form>
            )}

            {/* Q&A / TUTOR FORM */}
            {activeTab === 'qa' && (
              <form onSubmit={(e) => handleGenerate(e, 'qa')} className="space-y-4">
                <Input
                  label="Matéria ou Contexto"
                  value={qaForm.context}
                  onChange={(e) => setQaForm((f) => ({ ...f, context: e.target.value }))}
                />
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Escreva sua dúvida *
                  </label>
                  <textarea
                    rows={4}
                    value={qaForm.question}
                    onChange={(e) => setQaForm((f) => ({ ...f, question: e.target.value }))}
                    className="w-full text-xs bg-background text-foreground border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Como explicar frações de forma lúdica usando blocos de encaixe?"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isGenerating}
                  className="w-full"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Perguntar ao Tutor
                </Button>
              </form>
            )}

            {/* ANNOUNCEMENT FORM */}
            {activeTab === 'announcement' && (
              <form onSubmit={(e) => handleGenerate(e, 'announcement')} className="space-y-4">
                <Input
                  label="Assunto / Tema *"
                  value={announcementForm.topic}
                  onChange={(e) => setAnnouncementForm((f) => ({ ...f, topic: e.target.value }))}
                  required
                />
                <Input
                  label="Público Alvo"
                  value={announcementForm.audience}
                  onChange={(e) => setAnnouncementForm((f) => ({ ...f, audience: e.target.value }))}
                />
                <Input
                  label="Tom de Voz"
                  value={announcementForm.tone}
                  onChange={(e) => setAnnouncementForm((f) => ({ ...f, tone: e.target.value }))}
                  placeholder="Ex: Formal, acolhedor, urgente, informativo"
                />
                <Button
                  type="submit"
                  isLoading={isGenerating}
                  className="w-full"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Gerar Texto do Comunicado
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Right Side Generated Result */}
        <Card className="stripe-card lg:col-span-3 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Resultado Gerado</CardTitle>
              <CardDescription className="text-xs">
                O resultado aparecerá formatado abaixo.
              </CardDescription>
            </div>
            {generatedResult && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Processando prompts pedagógicos...
                </span>
              </div>
            ) : generatedResult ? (
              <div className="prose dark:prose-invert max-w-none text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-slate-500/5 p-4 rounded-xl border border-border/80">
                {generatedResult}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
                <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Selecione as opções à esquerda e clique em gerar para iniciar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAssistantPage;
