# 🗄️ Database Schema Documentation

This document describes all tables, schemas, relations, and indices configured in **Zx-Escola** via Prisma ORM for PostgreSQL.

---

## 🗺️ 1. Entity Relationship Overview

The schema is divided into module groups:
- **Core Access**: `users`, `profiles`, `refresh_tokens`, `audit_logs`
- **Academic Mappings**: `students`, `guardians`, `student_guardians`, `enrollments`, `teachers`, `employees`, `classes`, `rooms`
- **Diary & Reports**: `attendances`, `class_contents`, `activities`, `activity_grades`, `report_cards`
- **Library Module**: `books`, `book_categories`, `book_loans`, `book_reservations`
- **Data Exchange**: `imports`, `import_models`, `import_logs`, `exports`, `export_models`, `scheduled_jobs`

---

## 📊 2. Key Tables & Field Definitions

### `users`
Defines login identities.
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, encrypted hash)
- `role` (Enum: `ADMIN`, `DIRECTOR`, `STAFF`, `TEACHER`, `GUARDIAN`, `STUDENT`)
- `createdAt` / `updatedAt` (DateTime)

### `students`
Student profiles.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key linking `users.id`, Unique)
- `cpf` (String, Unique, Nullable)
- `status` (String, defaults to `LISTA_DE_ESPERA`)
- `classId` (UUID, Foreign Key linking `classes.id`, Nullable)
- **Indices**:
  - `@@index([classId])` (accelerates class rosters)

### `guardians`
Parents/responsibles database.
- `id` (UUID, Primary Key)
- `email` (String, Unique, Nullable)
- `isFinancial` (Boolean, default `false`)
- `userId` (UUID, Foreign Key linking `users.id`, Unique, Nullable)

### `student_guardians`
Composite join table linking multiple children to responsibles.
- `studentId` (UUID, Foreign Key, Part of PK)
- `guardianId` (UUID, Foreign Key, Part of PK)
- **Primary Key**: Composite `@@id([studentId, guardianId])`
- **Indices**:
  - `@@index([guardianId])` (optimized children lookup)

### `attendances`
Class register daily log.
- `id` (UUID, PK)
- `classId` (UUID, FK, index)
- `studentId` (UUID, FK, index)
- `date` (String, YYYY-MM-DD)
- `status` (String: `PRESENTE`, `FALTA`)

---

## ⚡ 3. Database Performance Indices

To ensure snappy analytical reporting and sub-second load times, indices are configured on all foreign keys:
1. `audit_logs` -> `[userId]`
2. `students` -> `[classId]`
3. `student_guardians` -> `[guardianId]`
4. `enrollments` -> `[studentId]`
5. `classes` -> `[roomId]`, `[teacherId]`
6. `attendances` -> `[classId]`, `[studentId]`
7. `report_cards` -> `[studentId]`
8. `tuitions` -> `[studentId]`
9. `transactions` -> `[tuitionId]`
10. `announcements` -> `[classId]`
11. `books` -> `[categoryId]`
12. `book_loans` -> `[bookId]`, `[userId]`
13. `book_reservations` -> `[bookId]`, `[userId]`
14. `school_documents` -> `[studentId]`
15. `imports` -> `[modelId]`, `[fileId]`, `[userId]`
16. `import_logs` -> `[importId]`
17. `exports` -> `[userId]`
