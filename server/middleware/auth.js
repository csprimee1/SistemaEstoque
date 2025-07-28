// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { db } from '../server.js';  // ajuste o caminho conforme a sua estrutura

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.sendStatus(403);

    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [payload.userId]);
      if (rows.length === 0) return res.sendStatus(404);

      const user = rows[0];
      delete user.password;  // tira a senha por segurança
      req.user = user;
      next();
    } catch (error) {
      console.error('Erro no middleware authenticateToken:', error);
      res.sendStatus(500);
    }
  });
}
