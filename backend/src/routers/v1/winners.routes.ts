import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getMyWinnings,
  uploadProof,
  getWinners,
  getWinnerById,
  approveWinner,
  rejectWinner,
  markPaid,
} from '../../controllers/winners.controller';
import { validateUUIDParam } from '../../validators/index';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware';

const uploadDir = path.resolve(__dirname, '../../../uploads/winner-proofs');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  },
});

const router = Router();

// Protected routes (before /:id to avoid conflict)
router.get('/me', authMiddleware, getMyWinnings);
router.post('/:id/upload-proof', authMiddleware, validateUUIDParam('id'), upload.single('proof'), uploadProof);

// Admin routes (before /:id to avoid conflict)
router.get('/', authMiddleware, adminMiddleware, getWinners);

// Dynamic routes last
router.get('/:id', authMiddleware, adminMiddleware, validateUUIDParam('id'), getWinnerById);
router.post('/:id/approve', authMiddleware, adminMiddleware, validateUUIDParam('id'), approveWinner);
router.post('/:id/reject', authMiddleware, adminMiddleware, validateUUIDParam('id'), rejectWinner);
router.post('/:id/mark-paid', authMiddleware, adminMiddleware, validateUUIDParam('id'), markPaid);

export default router;
