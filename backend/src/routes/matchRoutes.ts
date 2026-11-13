import { Router } from 'express';
import {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  updateMatchStatus,
  deleteMatch,
  addParticipant,
  removeParticipant,
  recordResults,
  raiseDispute,
  listDisputes,
  updateDisputeStatus,
  correctResult,
  getMatchCorrections
} from '../controllers/matchController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

router.get('/', listMatches);
router.get('/disputes', authenticateToken, listDisputes);
router.patch('/disputes/:id', authenticateToken, requireAdmin, updateDisputeStatus);

router.get('/:id', optionalAuthenticateToken, getMatch);
router.post('/', authenticateToken, requireAdmin, createMatch);
router.put('/:id', authenticateToken, requireAdmin, updateMatch);
router.patch('/:id/status', authenticateToken, requireAdmin, updateMatchStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteMatch);

router.post('/:id/participants', authenticateToken, requireAdmin, addParticipant);
router.delete('/:id/participants/:registrationId', authenticateToken, requireAdmin, removeParticipant);

router.post('/:id/results', authenticateToken, requireAdmin, recordResults);
router.post('/:id/disputes', authenticateToken, raiseDispute);

router.post('/:id/corrections', authenticateToken, requireAdmin, correctResult);
router.get('/:id/corrections', getMatchCorrections);

export default router;
