import { Router } from 'express';
import {
  listTournaments,
  getTournament,
  createTournament,
  updateTournament,
  updateTournamentStatus,
  deleteTournament,
  getTournamentStats
} from '../controllers/tournamentController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

router.get('/', listTournaments);
router.get('/stats', authenticateToken, requireAdmin, getTournamentStats);
router.get('/:id', optionalAuthenticateToken, getTournament);
router.post('/', authenticateToken, requireAdmin, createTournament);
router.put('/:id', authenticateToken, requireAdmin, updateTournament);
router.patch('/:id/status', authenticateToken, requireAdmin, updateTournamentStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteTournament);

export default router;
