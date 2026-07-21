# Contributing to Zx-Escola

Thank you for your interest in contributing to the **Zx-Escola** project! We appreciate your help in building a modern, secure, and robust School Management System.

To ensure a smooth collaboration, please follow the guidelines outlined below.

---

## 📋 Code of Conduct

By participating in this project, you agree to maintain a respectful, professional, and inclusive environment for everyone.

## 🌿 Branching Policy

- We use the `main` branch as the main production-ready branch.
- Feature development must be done in feature branches (e.g., `feature/feature-name` or `fix/bug-fix-name`) branched from `main`.
- Direct commits to `main` are restricted in production repositories. Please create a Pull Request (PR) to merge changes into `main`.

## 🛠️ Style Guide and Standards

This project enforces code quality, type-checking, and formatting standards. Before committing, ensure that:
1. **Types**: Your code compiles cleanly under strict TypeScript constraints. Do not use explicit `any` types unless absolutely necessary and documented.
2. **Linting**: Code passes all linter checks. Run:
   ```bash
   # Inside frontend/
   npm run lint
   
   # Inside backend/
   npm run lint
   ```
3. **Formatting**: Format files with Prettier:
   ```bash
   # Inside frontend/
   npm run format
   
   # Inside backend/
   npm run format
   ```

## 🧪 Testing

We require all integrations to have tests. Ensure that your changes do not break existing backend tests.
To run backend tests locally:
```bash
# Inside backend/
npm run test
```

## 🚀 Creating a Pull Request

1. Fork the repository and create your branch from `main`.
2. Commit your changes with clear, descriptive commit messages.
3. Push to your branch and open a Pull Request.
4. Verify that the automated CI/CD pipeline build and checks succeed.
5. A repository maintainer will review your code shortly.
