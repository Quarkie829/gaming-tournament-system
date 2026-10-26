import { Router } from 'express';
import { getUserProfile, updateProfile, listUsers } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, listUsers);
router.get('/:id', authenticateToken, getUserProfile);
router.put('/:id', authenticateToken, updateProfile);

export default router;
