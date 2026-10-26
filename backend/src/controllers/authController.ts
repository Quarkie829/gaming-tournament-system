import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { User, UserProfile, AuthTokenPayload } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_gaming_tournament_jwt_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password, country } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Username, email, and password are required fields.'
      });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    // Check if username or email exists
    const existing = await query<User[]>(
      'SELECT user_id, username, email FROM Users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      const match = existing[0];
      const field = match.username.toLowerCase() === username.trim().toLowerCase() ? 'Username' : 'Email';
      res.status(409).json({
        success: false,
        message: `${field} is already in use.`
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user
    const insertResult: any = await query(
      'INSERT INTO Users (username, email, password_hash, country, role) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), password_hash, country?.trim() || 'India', 'player']
    );

    const userId = insertResult.insertId;

    const payload: AuthTokenPayload = {
      user_id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: 'player'
    };

    const token = generateToken(payload);

    res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      token,
      user: {
        user_id: userId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        country: country?.trim() || 'India',
        role: 'player'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password.'
      });
      return;
    }

    // Query user by username or email
    const users = await query<User[]>(
      'SELECT user_id, username, email, password_hash, country, role, created_at FROM Users WHERE username = ? OR email = ? LIMIT 1',
      [login.trim(), login.trim().toLowerCase()]
    );

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
      return;
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash!);

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
      return;
    }

    const payload: AuthTokenPayload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = generateToken(payload);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        country: user.country,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const users = await query<UserProfile[]>(
      'SELECT user_id, username, email, country, role, created_at FROM Users WHERE user_id = ? LIMIT 1',
      [req.user.user_id]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}
