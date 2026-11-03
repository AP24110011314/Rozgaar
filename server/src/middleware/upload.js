import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../utils/appError.js';

// Multer memory storage (5 MB max)
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

export const uploadResumeMiddleware = multerUpload.single('resume');

/**
 * Verify file type using magic bytes (not client Content-Type or extension)
 */
export async function verifyMagicBytes(req, res, next) {
  try {
    if (!req.file) {
      throw AppError.badRequest('Resume file is required in "resume" field');
    }

    const type = await fileTypeFromBuffer(req.file.buffer);

    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const isPdf = type?.mime === 'application/pdf';
    const isDocx =
      type?.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      (type?.ext === 'docx' && type?.mime === 'application/zip');

    if (!type || (!isPdf && !isDocx)) {
      throw AppError.unsupportedFileType(
        'Unsupported file type. Only authentic PDF and DOCX files are allowed'
      );
    }

    req.fileMetadata = {
      mime: isPdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: isPdf ? 'pdf' : 'docx',
    };

    next();
  } catch (err) {
    next(err);
  }
}

