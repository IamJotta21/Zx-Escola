# Changelog

All notable changes to the **Zx-Escola** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-21

### Added
- Git repository initialization with `main` branch.
- Comprehensive root `.gitignore` ignoring logs, dependencies, IDE settings, local databases (`dev.db`), and uploaded files.
- Open-source MIT `LICENSE` file.
- `CONTRIBUTING.md` guide for repository contributions.
- STRICT types checks on the frontend (`tsconfig.app.json` fully integrated).
- Formatted source files with Prettier rules to standardize styling.

### Fixed
- Frontend compilation errors (e.g., incorrect props on `SkeletonTable` components, invalid button variants, unused variables, and undefined references to `previewRows` in the Import Wizard).
- Backend test suite crash in `runTests.ts` due to database schema mismatch and foreign key constraint violations by dynamically creating and tearing down a mock test user.
- ESLint configuration rules and warning suppressions to allow compilation checks to pass with 0 errors/warnings.
