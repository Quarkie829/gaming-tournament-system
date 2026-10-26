import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { Game } from '../types';

export async function listGames(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string;
    let sql = `
      SELECT g.game_id, g.game_name, g.genre, g.platform, g.publisher,
             COUNT(t.tournament_id) AS tournament_count
      FROM Games g
      LEFT JOIN Tournaments t ON t.game_id = g.game_id
    `;
    const params: any[] = [];

    if (search) {
      sql += ' WHERE g.game_name LIKE ? OR g.genre LIKE ? OR g.platform LIKE ? OR g.publisher LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ' GROUP BY g.game_id ORDER BY g.game_name ASC';

    const games = await query(sql, params);
    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (err) {
    next(err);
  }
}

export async function getGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gameId = parseInt(req.params.id as string, 10);
    if (isNaN(gameId)) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const games = await query<Game[]>(
      'SELECT game_id, game_name, genre, platform, publisher FROM Games WHERE game_id = ?',
      [gameId]
    );

    if (games.length === 0) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    // Fetch tournaments for this game
    const tournaments = await query(
      `SELECT t.*, tr.participation_type, tr.team_size
       FROM Tournaments t
       LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
       WHERE t.game_id = ?
       ORDER BY t.start_date DESC`,
      [gameId]
    );

    res.json({
      success: true,
      game: games[0],
      tournaments
    });
  } catch (err) {
    next(err);
  }
}

export async function createGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { game_name, genre, platform, publisher } = req.body;

    if (!game_name || !genre || !platform || !publisher) {
      res.status(400).json({
        success: false,
        message: 'All fields (game_name, genre, platform, publisher) are required.'
      });
      return;
    }

    const insertResult: any = await query(
      'INSERT INTO Games (game_name, genre, platform, publisher) VALUES (?, ?, ?, ?)',
      [game_name.trim(), genre.trim(), platform.trim(), publisher.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Game created successfully.',
      game: {
        game_id: insertResult.insertId,
        game_name: game_name.trim(),
        genre: genre.trim(),
        platform: platform.trim(),
        publisher: publisher.trim()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gameId = parseInt(req.params.id as string, 10);
    if (isNaN(gameId)) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const { game_name, genre, platform, publisher } = req.body;

    if (!game_name || !genre || !platform || !publisher) {
      res.status(400).json({
        success: false,
        message: 'All fields (game_name, genre, platform, publisher) are required.'
      });
      return;
    }

    await query(
      'UPDATE Games SET game_name = ?, genre = ?, platform = ?, publisher = ? WHERE game_id = ?',
      [game_name.trim(), genre.trim(), platform.trim(), publisher.trim(), gameId]
    );

    res.json({
      success: true,
      message: 'Game updated successfully.',
      game: {
        game_id: gameId,
        game_name: game_name.trim(),
        genre: genre.trim(),
        platform: platform.trim(),
        publisher: publisher.trim()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gameId = parseInt(req.params.id as string, 10);
    if (isNaN(gameId)) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    await query('DELETE FROM Games WHERE game_id = ?', [gameId]);

    res.json({
      success: true,
      message: 'Game deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
