import { Router } from 'express';
import {
  listTeams,
  getTeam,
  createTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  deleteTeam,
  requestToJoinTeam,
  invitePlayerToTeam,
  getTeamRequests,
  getMyTeamRequests,
  respondToRequest
} from '../controllers/teamController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

// Specific routes before parameterized :id
router.get('/requests/my', authenticateToken, getMyTeamRequests);
router.patch('/requests/:requestId/respond', authenticateToken, respondToRequest);

router.get('/', optionalAuthenticateToken, listTeams);
router.get('/:id', optionalAuthenticateToken, getTeam);
router.post('/', authenticateToken, createTeam);
router.post('/:id/members', authenticateToken, addTeamMember);
router.post('/:id/join-requests', authenticateToken, requestToJoinTeam);
router.post('/:id/invitations', authenticateToken, invitePlayerToTeam);
router.get('/:id/requests', authenticateToken, getTeamRequests);
router.put('/:id/members/:userId', authenticateToken, updateMemberRole);
router.delete('/:id/members/:userId', authenticateToken, removeTeamMember);
router.delete('/:id', authenticateToken, deleteTeam);

export default router;
