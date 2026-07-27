import { pool, isPostgresConnected, memoryDb } from '../../core/database';

export class CoachService {
  async saveChatMessage(userId: number = 1, sender: string, text: string): Promise<any> {
    if (isPostgresConnected()) {
      const res = await pool.query(
        `
        INSERT INTO chat_messages (user_id, sender, text)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
        [userId, sender, text]
      );
      return res.rows[0];
    }
    const msg = {
      id: memoryDb.chat_messages.length + 1,
      user_id: userId,
      sender,
      text,
      created_at: new Date(),
    };
    memoryDb.chat_messages.push(msg);
    return msg;
  }

  async getChatHistory(userId: number = 1): Promise<any[]> {
    if (isPostgresConnected()) {
      const res = await pool.query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY id ASC', [userId]);
      return res.rows;
    }
    return memoryDb.chat_messages;
  }
}

export const coachService = new CoachService();
