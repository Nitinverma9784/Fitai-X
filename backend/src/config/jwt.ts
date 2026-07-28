import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fitai_secret_key_pro_2026',
  expiresIn: '7d', // 7 days matching the current Math.floor(Date.now() / 1000) + 86400 * 7
};
