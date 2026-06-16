import { Router } from 'express';
import {
  getUsers, getUser, updateUserRole, toggleUserActive, deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/active', toggleUserActive);
router.delete('/:id', deleteUser);
export default router;
