import { Router } from 'express';
import {
  register, login, logout, getMe, updateProfile, updatePassword,
  forgotPassword, resetPassword, addAddress, deleteAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.use(protect);
router.get('/me', getMe);
router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/password', updatePassword);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
