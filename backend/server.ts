import express, { Request, Response } from 'express';
import cors from 'cors';
import { config, getGroqKeysCount } from './core/config';
import { initDb, db } from './core/database';

import authRoutes from './routes/authRoutes';
import workoutRoutes from './routes/workoutRoutes';
import recoveryRoutes from './routes/recoveryRoutes';
import coachRoutes from './routes/coachRoutes';
import userRoutes from './routes/userRoutes';
import nutritionRoutes from './routes/nutritionRoutes';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL Database connection & migrations
initDb();

// System Status & Health Check
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    postgresConnected: db.isPostgresConnected(),
    model: config.defaultModel,
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

app.listen(config.port, () => {
  console.log(`⚡ FitAI Pro Node.js TypeScript Backend listening on port ${config.port}`);
  console.log(`🔑 Groq API Key rotation configured with ${getGroqKeysCount()} key(s)`);
});
