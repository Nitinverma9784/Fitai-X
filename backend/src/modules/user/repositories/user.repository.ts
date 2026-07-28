import { pool, isPostgresConnected } from '../../../core/database/connection';
import { memoryDb } from '../../../shared/database/memoryDb';
import { calculateLevelData } from '../utils/level.utils';

export class UserRepository {
  async ensureUserExists(userId: number = 1): Promise<void> {
    if (!isPostgresConnected()) {
      let u = memoryDb.users.find(user => user.id === userId);
      if (!u) {
        u = {
          id: userId,
          name: 'Athlete',
          email: 'user@fitai.pro',
          avatar: 'AT',
          tier: 'FITAI PRO ATHLETE',
          xp: 0,
          onboarding_completed: false,
          created_at: new Date(),
        };
        memoryDb.users.push(u);
      }
      return;
    }

    try {
      const res = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
      if (res.rowCount === 0) {
        await pool.query(
          `INSERT INTO users (id, name, email, avatar, xp, onboarding_completed)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [userId, 'Athlete', `athlete_${userId}@fitai.pro`, 'AT', 0, false]
        );
      }
    } catch (err: any) {
      console.warn(`⚠️ ensureUserExists error for userId=${userId}:`, err.message);
    }
  }

  async getUser(userId: number = 1): Promise<any> {
    await this.ensureUserExists(userId);

    if (isPostgresConnected()) {
      const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        const lvl = calculateLevelData(u.xp || 0);
        return { ...u, ...lvl };
      }
    }

    const memUser = memoryDb.users.find(u => u.id === userId) || {
      id: userId,
      name: 'Athlete',
      email: 'user@fitai.pro',
      avatar: 'AT',
      xp: 0,
    };
    const lvl = calculateLevelData(memUser.xp || 0);
    return { ...memUser, ...lvl };
  }

  async getUserByEmail(email: string): Promise<any> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    if (isPostgresConnected()) {
      const res = await pool.query(`SELECT * FROM users WHERE LOWER(email) = $1`, [cleanEmail]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        const lvl = calculateLevelData(u.xp || 0);
        return { ...u, ...lvl };
      }
      return null;
    }

    const memUser = memoryDb.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (memUser) {
      const lvl = calculateLevelData(memUser.xp || 0);
      return { ...memUser, ...lvl };
    }
    return null;
  }

  async createUser(data: { name: string; email: string; provider?: string; avatar?: string; passwordHash?: string }): Promise<any> {
    const cleanEmail = data.email.trim().toLowerCase();
    const avatar = data.avatar || data.name.slice(0, 2).toUpperCase();
    const provider = data.provider || 'email';

    if (isPostgresConnected()) {
      const res = await pool.query(
        `INSERT INTO users (name, email, auth_provider, avatar, password_hash, xp, onboarding_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar
         RETURNING *`,
        [data.name, cleanEmail, provider, avatar, data.passwordHash || null, 0, false]
      );
      const u = res.rows[0];
      const lvl = calculateLevelData(u.xp || 0);
      return { ...u, ...lvl };
    }

    const newId = memoryDb.users.length > 0 ? Math.max(...memoryDb.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      name: data.name,
      email: cleanEmail,
      auth_provider: provider,
      avatar,
      password_hash: data.passwordHash || null,
      xp: 0,
      onboarding_completed: false,
      created_at: new Date(),
    };
    memoryDb.users.push(newUser);
    const lvl = calculateLevelData(0);
    return { ...newUser, ...lvl };
  }

  async addXp(userId: number = 1, amount: number): Promise<{ xpAdded: number; newTotalXp: number; levelData: any; leveledUp: boolean }> {
    await this.ensureUserExists(userId);

    let oldXp = 0;
    let newXp = 0;

    if (isPostgresConnected()) {
      const curr = await pool.query(`SELECT xp FROM users WHERE id = $1`, [userId]);
      oldXp = curr.rows[0]?.xp || 0;
      newXp = oldXp + amount;
      await pool.query(`UPDATE users SET xp = $1 WHERE id = $2`, [newXp, userId]);
    } else {
      const u = memoryDb.users.find(user => user.id === userId);
      if (u) {
        oldXp = u.xp || 0;
        u.xp = oldXp + amount;
        newXp = u.xp;
      }
    }

    const oldLevelData = calculateLevelData(oldXp);
    const newLevelData = calculateLevelData(newXp);
    const leveledUp = newLevelData.level > oldLevelData.level;

    return {
      xpAdded: amount,
      newTotalXp: newXp,
      levelData: newLevelData,
      leveledUp,
    };
  }

  async updateUser(userId: number = 1, updates: Record<string, any>): Promise<any> {
    await this.ensureUserExists(userId);

    const allowedFields = [
      'name', 'email', 'avatar', 'tier', 'goal', 'weight_kg', 'height_cm',
      'body_fat_pct', 'gender', 'age', 'equipment', 'time_commitment',
      'experience_level', 'injuries', 'diet_preference', 'daily_calories_target',
      'protein_target_g', 'carbs_target_g', 'fats_target_g', 'water_target_l',
      'onboarding_completed', 'xp'
    ];

    const filtered: Record<string, any> = {};
    for (const key of Object.keys(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        filtered[snakeKey] = updates[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return this.getUser(userId);
    }

    if (isPostgresConnected()) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [col, val] of Object.entries(filtered)) {
        setClauses.push(`${col} = $${idx}`);
        values.push(val);
        idx++;
      }

      values.push(userId);
      const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(query, values);
      const u = res.rows[0];
      const lvl = calculateLevelData(u.xp || 0);
      return { ...u, ...lvl };
    }

    const u = memoryDb.users.find(user => user.id === userId);
    if (u) {
      Object.assign(u, filtered);
      const lvl = calculateLevelData(u.xp || 0);
      return { ...u, ...lvl };
    }

    return this.getUser(userId);
  }
}

export const userRepository = new UserRepository();
