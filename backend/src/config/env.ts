import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database — SQLite file path (default) or PostgreSQL URL for production
  DATABASE_URL: z.string().default('file:./dev.db'),

  // JWT secrets — require at least 32 chars in production
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),

  // Supabase — optional (used only for cloud file storage)
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_KEY: z.string().optional().default(''),
  SUPABASE_BUCKET: z.string().default('school-storage'),

  // AI Integration — optional; system falls back to demo mode if empty
  OPENAI_API_KEY: z.string().optional().default(''),

  // CORS — comma-separated list of allowed origins (production)
  // e.g. ALLOWED_ORIGINS=https://app.myschool.com,https://admin.myschool.com
  ALLOWED_ORIGINS: z.string().optional().default('*'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(200), // per window
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parseResult.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = parseResult.data;
