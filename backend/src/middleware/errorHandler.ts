import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[Error Handler]:', err);

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    let msg = 'A duplicate entry already exists for this record.';
    if (err.sqlMessage && err.sqlMessage.includes('uq_tourn_user')) {
      msg = 'You are already registered for this tournament.';
    } else if (err.sqlMessage && err.sqlMessage.includes('uq_tourn_team')) {
      msg = 'This team is already registered for this tournament.';
    } else if (err.sqlMessage && err.sqlMessage.includes('username')) {
      msg = 'This username is already taken.';
    } else if (err.sqlMessage && err.sqlMessage.includes('email')) {
      msg = 'This email is already in use.';
    } else if (err.sqlMessage && err.sqlMessage.includes('team_name')) {
      msg = 'A team with this name already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('game_name')) {
      msg = 'A game with this name already exists.';
    }
    res.status(409).json({ success: false, message: msg, code: err.code });
    return;
  }

  // MySQL Check Constraint / Trigger Violations (SQLSTATE 45000)
  if (err.sqlState === '45000') {
    res.status(400).json({
      success: false,
      message: err.sqlMessage || 'Integrity rule violation.',
      code: 'BUSINESS_RULE_VIOLATION'
    });
    return;
  }

  // MySQL CHECK constraint failure
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    let msg = 'Data failed database constraint check.';
    if (err.sqlMessage && err.sqlMessage.includes('chk_one_entrant')) {
      msg = 'Registration must specify either a player or a team, not both.';
    } else if (err.sqlMessage && err.sqlMessage.includes('chk_tournament_dates')) {
      msg = 'Tournament dates are invalid: end date must be after start date, and deadline must be before or on start date.';
    } else if (err.sqlMessage && err.sqlMessage.includes('chk_tournament_fee')) {
      msg = 'Entry fee must be non-negative.';
    } else if (err.sqlMessage && err.sqlMessage.includes('chk_team_size')) {
      msg = 'Team size must be at least 1.';
    }
    res.status(400).json({ success: false, message: msg, code: err.code });
    return;
  }

  // Foreign Key constraint failures
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist.',
      code: err.code
    });
    return;
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    res.status(409).json({
      success: false,
      message: 'Cannot delete or update this record because it is referenced by other items (e.g. tournaments or registrations).',
      code: err.code
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message
  });
}
