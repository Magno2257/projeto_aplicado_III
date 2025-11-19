const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

module.exports = (pool) => {
  // Rota de login simples: procura usuário por email e retorna token
  router.post('/login', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

      const [rows] = await pool.query('SELECT id_usuario, nome_completo, email FROM usuarios WHERE email = ?', [email]);

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const user = rows[0];
      const token = jwt.sign({ id: user.id_usuario, email: user.email }, JWT_SECRET, { expiresIn: '8h' });

      res.json({ token, user: { id: user.id_usuario, nome_completo: user.nome_completo, email: user.email } });
    } catch (err) {
      console.error('Erro no /login:', err);
      res.status(500).json({ error: 'Erro ao autenticar' });
    }
  });

  return router;
};
