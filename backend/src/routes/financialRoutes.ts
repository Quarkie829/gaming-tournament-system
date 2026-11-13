import { Router } from 'express';
import {
  listPayments,
  createPayment,
  updatePaymentStatus,
  listPrizes,
  createPrize,
  updatePrize,
  awardPrize,
  deletePrize,
  listSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  listTournamentSponsors,
  addTournamentSponsor,
  removeTournamentSponsor
} from '../controllers/financialController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

// Payments
router.get('/payments', authenticateToken, listPayments);
router.post('/payments', authenticateToken, createPayment);
router.patch('/payments/:id/status', authenticateToken, requireAdmin, updatePaymentStatus);

// Prizes
router.get('/prizes', listPrizes);
router.post('/prizes', authenticateToken, requireAdmin, createPrize);
router.put('/prizes/:id', authenticateToken, requireAdmin, updatePrize);
router.patch('/prizes/:id/award', authenticateToken, requireAdmin, awardPrize);
router.delete('/prizes/:id', authenticateToken, requireAdmin, deletePrize);

// Sponsors
router.get('/sponsors', listSponsors);
router.post('/sponsors', authenticateToken, requireAdmin, createSponsor);
router.put('/sponsors/:id', authenticateToken, requireAdmin, updateSponsor);
router.delete('/sponsors/:id', authenticateToken, requireAdmin, deleteSponsor);

// Tournament Sponsors
router.get('/tournaments/:tournamentId/sponsors', listTournamentSponsors);
router.post('/tournaments/:tournamentId/sponsors', authenticateToken, requireAdmin, addTournamentSponsor);
router.delete('/tournaments/:tournamentId/sponsors/:sponsorId', authenticateToken, requireAdmin, removeTournamentSponsor);

export default router;
