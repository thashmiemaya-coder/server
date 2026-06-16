import multer from 'multer';
import ErrorResponse from '../utils/ErrorResponse.js';

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (/image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
  else cb(new ErrorResponse('Only image files are allowed', 400), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
