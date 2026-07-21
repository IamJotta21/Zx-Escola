# 🏫 Zx-Escola SaaS — Sistema de Gestão Escolar Completo

Sistema de gestão escolar moderno e completo, desenvolvido com TypeScript, React, Node.js e Prisma ORM. Inclui módulos financeiros, acadêmicos, portais de alunos e responsáveis, relatórios analíticos, biblioteca, secretaria digital e assistente pedagógico com Inteligência Artificial.

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Rápida](#-instalação-rápida)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Perfis de Acesso](#-perfis-de-acesso)
- [API Reference](#-api-reference)
- [Docker](#-docker)
- [Scripts de Produção](#-scripts-de-produção)
- [LGPD e Segurança](#-lgpd-e-segurança)
- [Backup e Recuperação](#-backup-e-recuperação)
- [Solução de Problemas](#-solução-de-problemas)

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 👥 **Alunos** | Cadastro completo, matrículas, rematrículas, transferências |
| 👨‍👩‍👧 **Responsáveis** | Pai, Mãe, Responsável Financeiro, parentesco, WhatsApp |
| 🎓 **Professores** | Cadastro, disciplinas, carga horária, turmas |
| 🏢 **Funcionários** | Cadastro por departamento |
| 🚪 **Turmas & Salas** | Gerenciamento de classes, capacidade, alocação |
| 📚 **Diário de Classe** | Presenças, faltas, conteúdos, atividades, notas |
| 📊 **Boletins** | Médias bimestrais, situação final, recuperação |
| 💰 **Financeiro** | Mensalidades, PIX, Boleto, Cartão, descontos, bolsas, fluxo de caixa |
| 📢 **Comunicação** | Mensagens para pais/alunos/professores/turmas, notificações, e-mail, WhatsApp |
| 📖 **Biblioteca** | Livros, empréstimos, devoluções, multas, reservas |
| 🗂️ **Secretaria Digital** | Declarações, contratos, upload de documentos, PDF |
| 🌐 **Portal dos Pais** | Notas, financeiro, frequência, mensagens, agenda, documentos |
| 🎒 **Portal do Aluno** | Notas, atividades, calendário, materiais, comunicados |
| 📈 **Relatórios & BI** | Gráficos financeiros, acadêmicos, exportação CSV/Excel/PDF |
| 🤖 **Assistente de IA** | Geração de provas, planos de aula, análise de alunos, comunicados |

---

## 🛠️ Tecnologias

**Backend:**
- Node.js 20 + TypeScript 5
- Express.js 4
- Prisma ORM 5 (SQLite em desenvolvimento / PostgreSQL em produção)
- JWT (RS256 / HS256) com Refresh Tokens
- Zod (validação de schemas)
- Helmet + CORS (segurança)
- Morgan (logs de requisições)
- Multer (upload de arquivos)

**Frontend:**
- React 18 + TypeScript 5
- Vite 5
- React Router 6
- Tailwind CSS 3
- Lucide React (ícones)
- Axios (HTTP client)
- React Hook Form + Zod

---

## 🔧 Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** 9.x ou superior
- (Opcional) Docker + Docker Compose para containerização

---

## 🚀 Instalação Rápida

### Windows (PowerShell)

```powershell
# Clone o repositório
git clone https://github.com/seu-usuario/zx-escola.git
cd zx-escola

# Execute o script de configuração automática
.\scripts\setup.ps1

# Inicie os servidores de desenvolvimento
.\scripts\dev.ps1
```

### Linux/macOS

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/zx-escola.git
cd zx-escola

# Backend
cd backend
npm install
cp ../.env.example .env  # edite as variáveis
npx prisma migrate deploy --schema=src/prisma/schema.prisma
npx prisma generate --schema=src/prisma/schema.prisma
npm run seed
npm run dev &

# Frontend
cd ../frontend
npm install
npm run dev &
```

### Via Docker

```bash
cp .env.example .env   # edite as variáveis
docker-compose up -d
```

**Acesso:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

**Credenciais iniciais (seed):**
- Admin: `admin@escola.com` / `admin123`

---

## ⚙️ Configuração de Variáveis de Ambiente

Copie `.env.example` para `backend/.env` e configure:

```env
# Banco de dados
DATABASE_URL="file:./dev.db"              # SQLite (dev) ou PostgreSQL URL (prod)

# JWT (OBRIGATÓRIO — use strings aleatórias de 64+ chars em produção)
JWT_SECRET=sua-chave-secreta-aqui
JWT_REFRESH_SECRET=outra-chave-secreta-aqui

# OpenAI (opcional — deixe vazio para modo demonstração)
OPENAI_API_KEY=sk-...

# CORS (produção — liste os domínios autorizados)
ALLOWED_ORIGINS=https://app.minhaescola.com
```

---

## 📁 Estrutura do Projeto

```
Zx-Escola/
├── backend/
│   ├── src/
│   │   ├── config/          # env.ts, database.ts
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── middlewares/     # auth, errorHandler, upload
│   │   ├── routes/          # Definições de rotas HTTP
│   │   ├── services/        # ai.service.ts e outros
│   │   ├── prisma/          # schema.prisma, seed, migrations
│   │   └── uploads/         # Arquivos enviados
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components & layout
│   │   ├── contexts/        # Auth, Toast, Theme
│   │   ├── pages/           # Páginas de cada módulo
│   │   ├── routes/          # React Router config
│   │   └── services/        # api.ts (Axios instance)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── scripts/
│   ├── setup.ps1            # Configuração inicial
│   ├── dev.ps1              # Iniciar desenvolvimento
│   ├── backup.ps1           # Backup do banco e uploads
│   └── update.ps1           # Atualização do sistema
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## 🎭 Perfis de Acesso

| Role | Acesso |
|---|---|
| `ADMIN` | Acesso total ao sistema |
| `DIRETOR` | Todos os módulos exceto configurações técnicas |
| `STAFF` | Alunos, matrículas, secretaria, comunicação |
| `TEACHER` | Diário de classe, notas, boletins, IA |
| `FINANCEIRO` | Módulo financeiro e relatórios |
| `GUARDIAN` | Portal do Responsável (leitura dos filhos) |
| `STUDENT` | Portal do Aluno (leitura própria) |

---

## 📡 API Reference

Base URL: `http://localhost:3000/api`

| Endpoint | Método | Descrição | Roles |
|---|---|---|---|
| `/auth/login` | POST | Autenticação | Público |
| `/auth/refresh` | POST | Renovar token | Público |
| `/auth/profile` | GET | Perfil do usuário | Todos |
| `/students` | GET/POST | Gestão de alunos | ADMIN, DIRETOR, STAFF |
| `/guardians` | GET/POST | Responsáveis | ADMIN, DIRETOR, STAFF |
| `/teachers` | GET/POST | Professores | ADMIN, DIRETOR |
| `/financial/tuitions` | GET/POST | Mensalidades | ADMIN, DIRETOR, FINANCEIRO |
| `/financial/transactions` | GET/POST | Transações | ADMIN, DIRETOR, FINANCEIRO |
| `/academic/attendance` | GET/POST | Frequência | ADMIN, DIRETOR, TEACHER |
| `/academic/report-cards` | GET/POST | Boletins | Todos |
| `/communication/announcements` | GET/POST | Comunicados | ADMIN, DIRETOR, STAFF, TEACHER |
| `/library/books` | GET/POST | Livros | ADMIN, DIRETOR, STAFF, TEACHER |
| `/portal/guardian/*` | GET | Portal dos Pais | GUARDIAN |
| `/portal/student/*` | GET | Portal do Aluno | STUDENT |
| `/reports` | GET | Dados de relatórios | ADMIN, DIRETOR, FINANCEIRO |
| `/ai/*` | POST | Assistente de IA | ADMIN, DIRETOR, STAFF, TEACHER |
| `/health` | GET | Status do servidor | Público |

---

## 🐳 Docker

**Desenvolvimento:**
```bash
docker-compose up
```

**Produção:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔐 LGPD e Segurança

- **Autenticação**: JWT com tokens de acesso (15min) e refresh (7 dias)
- **Autorização**: RBAC granular por role em cada endpoint
- **CORS**: Configurável por variável de ambiente; restrito em produção
- **Helmet**: Headers de segurança HTTP em todas as respostas
- **Rate Limiting**: Configurável via `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`
- **Senhas**: Hashed com bcrypt (salt 12)
- **Dados sensíveis**: Nunca retornados no payload (passwords, tokens)
- **Body Limit**: 10mb para evitar ataques DoS por payload
- **LGPD**: Dados de alunos menores ficam exclusivamente no backend; portais de pais e alunos exibem apenas os dados do próprio usuário/filho
- **Auditoria**: Tabela `AuditLog` disponível para registro de ações críticas

---

## 💾 Backup e Recuperação

**Backup manual (Windows):**
```powershell
.\scripts\backup.ps1
```

**Backup automático via Windows Task Scheduler:**
1. Abra o Agendador de Tarefas
2. Crie uma nova tarefa básica
3. Programa: `powershell.exe`
4. Argumentos: `-NonInteractive -File "C:\caminho\scripts\backup.ps1"`
5. Gatilho: Diariamente às 02:00

**Backups são salvos em:** `./backups/YYYY-MM-DD_HH-mm-ss/`
- `dev_TIMESTAMP.db` — banco SQLite
- `uploads/` — arquivos enviados

Os últimos 30 backups são mantidos automaticamente.

---

## 🔧 Solução de Problemas

**Servidor não inicia:**
```powershell
# Verifique se o .env existe e está correto
cat backend/.env
# Verifique erros de porta em uso
netstat -ano | findstr :3000
```

**Erro de banco de dados:**
```powershell
cd backend
npx prisma migrate reset --schema=src/prisma/schema.prisma  # APAGA os dados!
npx prisma migrate deploy --schema=src/prisma/schema.prisma
npm run seed
```

**Frontend não conecta ao backend:**
- Verifique se `VITE_API_URL` em `frontend/.env` aponta para o servidor correto
- Confirme que o backend está rodando: http://localhost:3000/health

---

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
