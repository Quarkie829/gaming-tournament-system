import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import gameRoutes from './routes/gameRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import teamRoutes from './routes/teamRoutes';
import registrationRoutes from './routes/registrationRoutes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

// API Routes (Modules 1 - 4)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/registrations', registrationRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
