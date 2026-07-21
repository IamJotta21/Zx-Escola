import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

import os from 'os';

// Ensure import uploads directory exists
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const importUploadDir = isVercel
  ? path.join(os.tmpdir(), 'uploads', 'imports')
  : path.join(__dirname, '..', '..', 'uploads', 'imports');
if (!fs.existsSync(importUploadDir)) {
  fs.mkdirSync(importUploadDir, { recursive: true });
}

const allowedExtensions = ['.xml', '.json', '.csv', '.xlsx', '.xls', '.ods', '.zip', '.txt'];

const mimeTypeMap: Record<string, string[]> = {
  '.xml': ['application/xml', 'text/xml'],
  '.json': ['application/json', 'text/json', 'text/plain'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ],
  '.xls': ['application/vnd.ms-excel', 'application/octet-stream'],
  '.ods': ['application/vnd.oasis.opendocument.spreadsheet', 'application/octet-stream'],
  '.zip': ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  '.txt': ['text/plain'],
};

// Filename Sanitizer
export const sanitizeFilename = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  // Keep only alphanumeric, spaces, hyphens, and underscores
  const cleanBase = base.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();

  // Fallback if empty base
  const finalBase = cleanBase || 'import_file_' + Date.now();
  return `${finalBase}${ext}`;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, importUploadDir);
  },
  filename: (_req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + sanitized);
  },
});

// File validation filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Check extension whitelist
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        `Formato de arquivo ${ext} não suportado. Formatos aceitos: XML, JSON, CSV, XLSX, XLS, ODS, ZIP, TXT.`
      ) as any
    );
  }

  // 2. Validate MIME Type matches the extension
  const allowedMimeTypes = mimeTypeMap[ext] || [];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    // If not matching, we still perform check for safety.
    // Sometimes Windows or excel sets application/octet-stream for xlsx/zip, which we allowed,
    // but block totally mismatched ones (e.g. application/x-msdownload).
    if (file.mimetype === 'application/x-msdownload' || file.mimetype.includes('executable')) {
      return cb(
        new Error('MIME Type suspeito detectado. Arquivos executáveis não são aceitos.') as any
      );
    }
  }

  // 3. Check for dangerous filename characters (directory traversal)
  if (
    file.originalname.includes('..') ||
    file.originalname.includes('/') ||
    file.originalname.includes('\\')
  ) {
    return cb(
      new Error('Nome de arquivo inválido contendo caracteres de navegação de diretório.') as any
    );
  }

  cb(null, true);
};

export const importUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

export default importUpload;
