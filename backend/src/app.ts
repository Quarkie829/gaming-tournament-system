import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import gameRoutes from './routes/gameRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import teamRoutes from './routes/teamRoutes';
import registrationRoutes from './routes/registrationRoutes';
import matchRoutes from './routes/matchRoutes';
import financialRoutes from './routes/financialRoutes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Cross-Origin Resource Sharing
app.use(cors({
  origin: true, // Dynamically allow calling origin (localhost, GitHub Pages, Render, etc.)
  credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Gaming Tournament Management System API',
    timestamp: new Date().toISOString()
  });
});

// API Routes (Modules 1 - 6)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api', financialRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
