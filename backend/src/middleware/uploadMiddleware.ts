import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';

// Configure multer for CSV file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only accept CSV files
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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Multer-specific errors
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
  
  // Handle custom file filter errors
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only CSV files are allowed'
    });
  }
  
  // Handle other upload-related errors
  return res.status(500).json({
    error: 'File upload error',
    message: error.message || 'An unexpected error occurred during file upload'
  });
};

// Single file upload middleware
export const uploadSingleCSV = upload.single('csvFile');

// Multiple files upload middleware (if needed)
// export const uploadMultipleCSV = upload.array('csvFiles', 5); // Max 5 files

// Fields upload middleware (if you need different field names)
// export const uploadFieldsCSV = upload.fields([
//   { name: 'csvFile', maxCount: 1 },
//   { name: 'backupFile', maxCount: 1 }
// ]);

// Complete middleware chain for single CSV upload
export const csvUploadMiddleware = [uploadSingleCSV, handleUploadError];

// Alternative: Create a wrapper function that combines both
// export const createCSVUploadMiddleware = (fieldName: string = 'csvFile') => {
//   const singleUpload = upload.single(fieldName);
  
//   return [
//     singleUpload,
//     handleUploadError
//   ];
// };

// Usage example for different file size limits
// export const createCustomUploadMiddleware = (options: {
//   fieldName?: string;
//   maxSize?: number; // in MB
//   allowedTypes?: string[];
// }) => {
//   const { fieldName = 'csvFile', maxSize = 5, allowedTypes = ['text/csv'] } = options;
  
//   const customUpload = multer({
//     storage: multer.memoryStorage(),
//     fileFilter: (req, file, cb) => {
//       const isValidType = allowedTypes.includes(file.mimetype) || 
//                          allowedTypes.some(type => file.originalname.endsWith(type.split('/')[1]));
      
//       if (isValidType) {
//         cb(null, true);
//       } else {
//         cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`));
//       }
//     },
//     limits: {
//       fileSize: maxSize * 1024 * 1024, // Convert MB to bytes
//     }
//   });
  
//   return [
//     customUpload.single(fieldName),
//     (error: any, req: Request, res: Response, next: NextFunction) => {
//       if (error instanceof multer.MulterError) {
//         if (error.code === 'LIMIT_FILE_SIZE') {
//           return res.status(400).json({
//             error: 'File too large',
//             message: `File size should not exceed ${maxSize}MB`
//           });
//         }
//       }
      
//       if (error.message?.includes('Only') && error.message?.includes('files are allowed')) {
//         return res.status(400).json({
//           error: 'Invalid file type',
//           message: error.message
//         });
//       }
      
//       return res.status(500).json({
//         error: 'File upload error',
//         message: error.message
//       });
//     }
//   ];
// };

export default {
  uploadSingleCSV,
  handleUploadError,
  csvUploadMiddleware,
//   createCSVUploadMiddleware,
//   createCustomUploadMiddleware
};