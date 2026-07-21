# ⚙️ Administrator Manual

This guide describes configuration, account management, database recovery, and backup schedules for **Zx-Escola** administrators.

---

## 🛠️ 1. Initial System Configuration

### Database Setup
1. Instantiate a PostgreSQL database (e.g. Supabase instance).
2. Grab the connection string from the database settings page.
3. Configure the environment variable:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[db_name]?sslmode=require"
   ```

### Initial Administrator Account Creation
A seeding command is provided to create the default administrator user and establish baseline settings:
```bash
cd backend
npm run seed
```
This inserts:
- **Default Email**: `admin@zxescola.com.br`
- **Default Password**: `admin123` (Always change this immediately after logging in for the first time).

---

## 👥 2. User & Access Control Management

The system enforces Role-Based Access Control (RBAC). Users must be assigned one of the following roles:
- `ADMIN`: Full access to settings, databases, audit logs, financials, classes, imports/exports, and school details.
- `DIRECTOR` / `STAFF`: Access to student registrations, library details, announcements, reports, and attendance logs.
- `TEACHER`: Restricted to managing linked classes, attendance rolls, content entries, and grades.
- `GUARDIAN`: Restricted to viewing portals for linked children.
- `STUDENT`: Restricted to viewing their own grades, materials, and class calendar.

---

## 💾 3. Backup & Failover Strategy

### Local/Docker Backups
For systems configured on virtual private servers using localized storage or containers, a backup script is provided:
```powershell
.\scripts\backup.ps1
```
This utility:
- Generates a timestamped dump of the PostgreSQL database.
- Saves the dump file to the local directory under `backups/`.
- Deletes older dump files exceeding 30 days to optimize storage.

### Failover and Recovery
In the event of a platform outage or critical database failure:
1. **API Outage Check**: Inspect the health endpoint at `https://zx-escola.vercel.app/api/health` to confirm the serverless runtime environment is active.
2. **Database Offline State**: If the logs output `PrismaClientInitializationError`, the PostgreSQL server is unreachable. Check the SSL/IP whitelist rules on your Supabase dashboard.
3. **Database Restore**: Recover from a saved backup dump using standard PG restore utilities:
   ```bash
   pg_restore --host=[host] --username=[user] --dbname=[db_name] backups/db-backup-[date].dump
   ```
