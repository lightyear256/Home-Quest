import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  }
});

export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: 'File size should not exceed 5MB'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'Only one file is allowed'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'File field name should be "csvFile"'
        });
      
      default:
        return res.status(400).json({
          error: 'File upload error',
          message: error.message
        });
    }
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only CSV files are allowed'
    });
  }
  
  return res.status(500).json({
    error: 'File upload error',
    message: error.message || 'An unexpected error occurred during file upload'
  });
};

export const uploadSingleCSV = upload.single('csvFile');


export const csvUploadMiddleware = [uploadSingleCSV, handleUploadError];



export default {
  uploadSingleCSV,
  handleUploadError,
  csvUploadMiddleware,

};