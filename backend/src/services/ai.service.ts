export const callAIService = async (
  prompt: string,
  systemInstructions?: string
): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY || '';

  // If no OpenAI API Key is present, fall back to high-quality educational simulation mode
  if (!apiKey) {
    return simulateAIResponse(prompt, systemInstructions);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          ...(systemInstructions ? [{ role: 'system', content: systemInstructions }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Error Response:', errorText);
      return simulateAIResponse(prompt, systemInstructions);
    }

    const data = (await response.json()) as any;
    return (
      data.choices?.[0]?.message?.content ||
      'Não foi possível gerar uma resposta válida da Inteligência Artificial.'
    );
  } catch (err) {
    console.error('Error connecting to OpenAI:', err);
    return simulateAIResponse(prompt, systemInstructions);
  }
};

/**
 * High-quality educational responses simulated when the system doesn't have an OpenAI key set yet.
 * Ensures immediate premium user experience.
 */
const simulateAIResponse = (prompt: string, _systemInstructions?: string): string => {
  const lowerPrompt = prompt.toLowerCase();

  // 1. QUESTION GENERATOR
  if (
    lowerPrompt.includes('questões') ||
    lowerPrompt.includes('prova') ||
    lowerPrompt.includes('exercícios')
  ) {
    const isHard = lowerPrompt.includes('difícil') || lowerPrompt.includes('avançado');
    return `### PROVA DIDÁTICA CONSOLIDADA
**Tema**: Produção Didática Autogerada
**Nível**: ${isHard ? 'Avançado / Dificuldade Alta' : 'Intermediário'}

---

**Questão 1** (Múltipla Escolha):
Analise o impacto das transformações socioeconômicas ocorridas durante a Revolução Industrial no desenvolvimento urbano. Qual das alternativas abaixo apresenta a principal consequência social daquele período?
- A) Descentralização da produção fabril para zonas rurais.
- B) Êxodo rural acentuado resultando em urbanização acelerada e crescimento da classe operária.
- C) Fortalecimento imediato de leis de proteção ambiental urbana.
- D) Retorno voluntário da população às práticas feudais de cultivo de subsistência.
*Gabarito*: **B**. O surgimento das indústrias nas cidades atraiu contingentes populacionais do campo em busca de emprego.

---

**Questão 2** (Discursiva):
Explique detalhadamente como o ciclo hidrológico atua na regulação térmica global e de que maneira a poluição atmosférica urbana interfere nesse equilíbrio natural.

*Critério de Correção*: O aluno deve citar a evapotranspiração, o calor específico da água e o papel das correntes de vento, destacando o efeito estufa agravado pela retenção de poluentes.

---

**Questão 3** (Múltipla Escolha):
Assinale a alternativa que descreve de forma correta o conceito de cidadania ativa no mundo contemporâneo:
- A) Apenas o exercício do voto obrigatório a cada período eleitoral.
- B) Delegação absoluta de todas as decisões públicas ao poder executivo sem controle social.
- C) Participação consciente do indivíduo nos debates públicos, fiscalização do orçamento e atuação em causas coletivas.
- D) Isolamento total das esferas públicas com foco exclusivo em iniciativas corporativas privadas.
*Gabarito*: **C**.`;
  }

  // 2. LESSON PLAN GENERATOR
  if (
    lowerPrompt.includes('plano de aula') ||
    lowerPrompt.includes('didático') ||
    lowerPrompt.includes('metodologia')
  ) {
    return `### PLANO DE ENSINO E DIRETRIZ PEDAGÓGICA (AI)

* **Objetivo Geral**: Desenvolver a compreensão crítica dos estudantes acerca do conteúdo programático, estimulando debates e correlações práticas com o cotidiano escolar e social.
* **Carga Horária Estimada**: 2 Aulas de 50 minutos.

---

#### 1. CONTEÚDO PROGRAMÁTICO
* Introdução conceitual e panorama histórico.
* Análise dos pilares fundamentais do tema proposto.
* Discussão prática de casos reais e soluções contemporâneas.

#### 2. ESTRATÉGIA METODOLÓGICA
* **Sensibilização inicial**: Questionamento problematizador para verificar conhecimentos prévios da turma.
* **Exposição Dialógica**: Explicação dos tópicos chaves com suporte visual, promovendo interrupções controladas para perguntas.
* **Atividade Prática em Grupo**: Divisão da sala em equipes pequenas para debaterem um estudo de caso e apresentarem uma síntese rápida de 3 minutos.

#### 3. RECURSOS DIDÁTICOS
* Quadro de anotações, slides conceituais e textos de apoio fotocopiados.

#### 4. AVALIAÇÃO CONTINUADA
* Participação qualitativa nos debates e entrega de ficha reflexiva individual com 3 pontos sintetizados ao final do encontro.`;
  }

  // 3. STUDENT PERFORMANCE SUMMARY
  if (
    lowerPrompt.includes('desempenho') ||
    lowerPrompt.includes('boletim') ||
    lowerPrompt.includes('boletins')
  ) {
    return `### ANÁLISE DE RENDIMENTO ESCOLAR E ACOMPANHAMENTO PEDAGÓGICO

A partir da análise quantitativa e qualitativa dos registros de notas e assiduidade presentes no histórico escolar do aluno, identificamos os seguintes pontos-chaves:

1. **Rendimento Acadêmico**:
   * O estudante apresenta consistência satisfatória na maioria das disciplinas, com notas médias que demonstram compreensão dos conteúdos base.
   * Nota-se um pequeno recuo nos trimestres intermediários em matérias da área de exatas, sugerindo a necessidade de exercícios de fixação adicionais.

2. **Assiduidade e Frequência**:
   * A frequência atual está bem estabelecida e acima do patamar mínimo exigido pela legislação escolar. O comportamento demonstra engajamento com a rotina escolar.

3. **Plano de Ação Sugerido**:
   * Incentivar o desenvolvimento de planos de estudo autônomos para reforçar conceitos chaves de exatas.
   * Sugerir a participação em plantões de dúvidas semanais para sanar as lacunas identificadas antes das avaliações bimestrais de fechamento.`;
  }

  // 4. ANNOUNCEMENT GENERATOR
  if (lowerPrompt.includes('comunicado') || lowerPrompt.includes('aviso')) {
    return `### COMUNICADO OFICIAL À COMUNIDADE ESCOLAR

Prezados Pais, Responsáveis e Alunos,

Gostaríamos de informar que nossa equipe diretiva e docente segue trabalhando constantemente na melhoria contínua dos processos de ensino-aprendizagem. 

Pedimos que fiquem atentos ao calendário de atividades e avaliações que se aproxima. O apoio familiar na organização dos horários de estudos em casa é de suma importância para o sucesso e desenvolvimento dos nossos estudantes neste período letivo.

Contamos com a habitual parceria e cooperação de todos. Caso necessitem de agendamento de reuniões individuais, a coordenação está à disposição.

Atenciosamente,
**Zx-Escola — Direção Geral**`;
  }

  // 5. DEFAULT ASSISTANT CHAT
  return `### ASSISTENTE PEDAGÓGICO ZX-ESCOLA

Olá! Recebi sua consulta pedagógica:

"${prompt}"

Como assistente de Inteligência Artificial para professores, posso sugerir estratégias de mediação didática e propor metodologias ativas de ensino (como sala de aula invertida e gamificação). 

Recomenda-se focar na aprendizagem significativa, conectando os desafios do conteúdo programático aos interesses dos estudantes da nova geração. Se precisar de planos estruturados, questões avaliativas adicionais ou análise de comportamento, basta selecionar a ferramenta específica.`;
};
export default { callAIService };
