import { Router } from 'express';
import {
  listTeams,
  getTeam,
  createTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  deleteTeam
} from '../controllers/teamController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticateToken, listTeams);
router.get('/:id', optionalAuthenticateToken, getTeam);
router.post('/', authenticateToken, createTeam);
router.post('/:id/members', authenticateToken, addTeamMember);
router.put('/:id/members/:userId', authenticateToken, updateMemberRole);
router.delete('/:id/members/:userId', authenticateToken, removeTeamMember);
router.delete('/:id', authenticateToken, deleteTeam);

export default router;
