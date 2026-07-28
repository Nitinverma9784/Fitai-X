import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  defaultModel: process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile',
  dbUrl: process.env.DATABASE_URL || 'postgres://postgres:nitinverma@127.0.0.1:5433/fitaix',
};
