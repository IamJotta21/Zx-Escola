import { env } from '../config/env';

export enum LogCategory {
  SYSTEM = 'SYSTEM',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
  DATABASE = 'DATABASE',
  API = 'API',
}

class Logger {
  private formatMessage(category: LogCategory, message: string, details?: any): string {
    const timestamp = new Date().toISOString();
    const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : '';
    return `[${timestamp}] [${category}] ${message}${detailsStr}`;
  }

  public info(message: string, category = LogCategory.SYSTEM, details?: any) {
    if (env.NODE_ENV !== 'test') {
      console.log(this.formatMessage(category, message, details));
    }
  }

  public error(message: string, error?: any, category = LogCategory.ERROR) {
    if (env.NODE_ENV !== 'test') {
      const errDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.error(this.formatMessage(category, `❌ ERROR: ${message}`, errDetails));
    }
  }

  public security(message: string, details?: any) {
    if (env.NODE_ENV !== 'test') {
      console.warn(this.formatMessage(LogCategory.SECURITY, `🛡️ SECURITY: ${message}`, details));
    }
  }

  public db(message: string, query?: string, details?: any) {
    if (env.NODE_ENV !== 'test') {
      console.log(this.formatMessage(LogCategory.DATABASE, `🗄️ DB: ${message}`, { query, ...details }));
    }
  }

  public api(method: string, path: string, statusCode: number, durationMs: number) {
    if (env.NODE_ENV !== 'test') {
      console.log(
        this.formatMessage(LogCategory.API, `🌐 API: ${method} ${path} - Status: ${statusCode} (${durationMs}ms)`)
      );
    }
  }
}

export const logger = new Logger();
