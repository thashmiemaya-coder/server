import { Router } from 'express';
import {
  submitContact, getMessages, updateMessageStatus, deleteMessage,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.post('/', submitContact);
router.use(protect, authorize('admin'));
router.get('/', getMessages);
router.put('/:id', updateMessageStatus);
router.delete('/:id', deleteMessage);
export default router;
