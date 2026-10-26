import { Router } from 'express';
import { listGames, getGame, createGame, updateGame, deleteGame } from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';

const router = Router();

router.get('/', listGames);
router.get('/:id', getGame);
router.post('/', authenticateToken, requireAdmin, createGame);
router.put('/:id', authenticateToken, requireAdmin, updateGame);
router.delete('/:id', authenticateToken, requireAdmin, deleteGame);

export default router;
