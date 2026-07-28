import express, { Request, Response } from 'express';
import cors from 'cors';
import { envConfig } from './config/env';
import { getGroqKeysCount } from './config/groq';
import { corsConfig } from './config/cors';
import { initDb, isPostgresConnected } from './core/database/connection';
import { notFoundHandler } from './core/middleware/notFound.middleware';
import { errorHandler } from './core/middleware/error.middleware';

import authRoutes from './modules/auth/routes/auth.routes';
import workoutRoutes from './modules/workout/routes/workout.routes';
import recoveryRoutes from './modules/recovery/routes/recovery.routes';
import coachRoutes from './modules/coach/routes/coach.routes';
import userRoutes from './modules/user/routes/user.routes';
import nutritionRoutes from './modules/nutrition/routes/nutrition.routes';

const app = express();
app.use(cors(corsConfig));
app.use(express.json());

// Initialize PostgreSQL Database connection & migrations
initDb();

// System Status & Health Check
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    postgresConnected: isPostgresConnected(),
    model: envConfig.defaultModel,
    activeKeysCount: getGroqKeysCount(),
    keyRotationActive: true,
    timestamp: new Date().toISOString(),
  });
});

// Mount Modular Service Routers
app.use('/api/auth', authRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/user', userRoutes);
app.use('/api/nutrition', nutritionRoutes);

// Centralized error and 404 handler middleware
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(envConfig.port, '0.0.0.0', () => {
  console.log(`⚡ FitAI Pro Node.js TypeScript Backend listening on port ${envConfig.port}`);
  console.log(`🔑 Groq API Key rotation configured with ${getGroqKeysCount()} key(s)`);
});
