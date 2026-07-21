# 🧑‍💻 Developer Manual

Welcome to the developer guide for **Zx-Escola**. This document describes directory organization, naming conventions, build commands, and standards.

---

## 📂 1. Directory Structure

The project is structured as a monorepo containing a separate frontend client and backend server:

```
zx-escola/
├── .github/                 # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml           # CI/CD automated test pipeline
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/          # Configurations (database, environment variables)
│   │   ├── controllers/     # Route controller endpoints
│   │   ├── interfaces/      # TypeScript interfaces
│   │   ├── middlewares/     # Authentication, uploads & error handlers
│   │   ├── prisma/          # Database migrations, seed and schema file
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services (AI, CSV Parsers, Exports)
│   │   ├── utils/           # Helper scripts and tests
│   │   ├── validators/      # Payload validators
│   │   └── app.ts           # Express App setup (Serverless function target)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React client application
│   ├── public/              # Static assets copied directly to build output
│   ├── src/
│   │   ├── components/      # Reusable UI components & Wizard panels
│   │   ├── contexts/        # Auth, Theme, and global Toast states
│   │   ├── hooks/           # Custom React hooks (e.g. useImport)
│   │   ├── layouts/         # Dashboard wrapper pages
│   │   ├── pages/           # Client route pages (Bulletins, Finance, AI)
│   │   ├── routes/          # Client-side router declarations
│   │   ├── services/        # API clients (Axios connection)
│   │   └── main.tsx         # React application entry point
│   ├── package.json
│   └── tsconfig.json
└── vercel.json              # Vercel Serverless monorepo deployment config
```

---

## 🛠️ 2. Development Commands

### Backend Local Commands
```bash
cd backend

# Install dependencies
npm install

# Generate local Prisma Client types
npm run prisma:generate

# Run local development server (live hot reload)
npm run dev

# Run automated integration tests
npm run test
```

### Frontend Local Commands
```bash
cd frontend

# Install dependencies
npm install

# Run Vite dev server locally
npm run dev

# Format code with Prettier
npm run format

# Run linter
npm run lint

# Generate production build
npm run build
```

---

## 📝 3. Coding Conventions

- **Type Safety**: TypeScript strict configurations are enabled. Explicit `any` type casts must be avoided. Prefer typing objects through Prisma types (`User`, `Student`) or creating strict union declarations.
- **Linter & Formatters**:
  - Prettier handles file formats. Always run `npm run format` prior to commits.
  - ESLint validates rule agreements. The build pipeline enforces `--max-warnings 0` for all frontend checks.
- **Serverless Compatibility**: File-writes inside backend services must never write directly to the local project structure. Use `os.tmpdir()` when hosted in production (e.g., Vercel) to write uploads/exports to temporary system storage.
