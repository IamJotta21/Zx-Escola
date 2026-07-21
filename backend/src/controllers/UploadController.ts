import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { UploadService } from '../services/UploadService';

const uploadService = new UploadService();

const getFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

export const registerUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Nenhum arquivo enviado ou tipo de arquivo inválido.',
      });
    }

    // 1. File size empty check
    if (file.size === 0) {
      // Delete temporary empty file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        status: 'error',
        message: 'O arquivo enviado está vazio (0 Bytes).',
      });
    }

    // 2. Compute SHA-256 Hash
    let hash = '';
    try {
      hash = await getFileHash(file.path);
    } catch (e) {
      // Fail-safe hash generation using file metadata if read fails
      hash = crypto
        .createHash('sha256')
        .update(file.filename + file.size)
        .digest('hex');
    }

    // 3. Check for duplicates (same hash)
    const duplicate = await uploadService.findByHash(hash);
    if (duplicate) {
      // Cleanup temporary file as we already have this content
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        // Ignored
      }
      return res.status(200).json({
        status: 'success',
        message: 'Arquivo já importado anteriormente.',
        data: duplicate,
      });
    }

    // 4. Register UploadedFile in db
    const fileRecord = await uploadService.registerUpload({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      hash,
      status: 'UPLOADED',
      userId,
    });

    return res.status(201).json({
      status: 'success',
      data: fileRecord,
    });
  } catch (error) {
    // Delete temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        // Ignored
      }
    }
    return next(error);
  }
};

export const getUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fileRecord = await uploadService.getUploadedFile(id);

    if (!fileRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'Arquivo não encontrado',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: fileRecord,
    });
  } catch (error) {
    return next(error);
  }
};
