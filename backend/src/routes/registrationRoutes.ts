import { Router } from 'express';
import {
  registerSolo,
  registerTeam,
  getMyRegistrations,
  listAllRegistrations,
  updateRegistrationStatus,
  cancelRegistration
} from '../controllers/registrationController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

router.post('/solo', authenticateToken, registerSolo);
router.post('/team', authenticateToken, registerTeam);
router.get('/my', authenticateToken, getMyRegistrations);
router.get('/', authenticateToken, requireAdmin, listAllRegistrations);
router.patch('/:id/status', authenticateToken, requireAdmin, updateRegistrationStatus);
router.patch('/:id/cancel', authenticateToken, cancelRegistration);

export default router;
