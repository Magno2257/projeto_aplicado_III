module.exports = (pool) => {
  const express = require('express');
  const router = express.Router();
  const jwt = require('jsonwebtoken');

  const TAXA_DIARIA = 1.5;
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

  // Middleware simples para proteger rotas de multas
  router.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Não autorizado' });
    const parts = auth.split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'Token inválido' });
    const token = parts[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  });

  // Listar multas (empréstimos atrasados) com cálculo de dias e valor
  router.get('/', async (req, res) => {
    try {
      const query = `
        SELECT
          e.id_emprestimo,
          u.id_usuario,
          u.nome_completo,
          l.id_livro,
          l.titulo,
          e.data_prevista,
          e.data_devolucao,
          DATEDIFF(CURDATE(), e.data_prevista) AS dias_atraso,
          COALESCE(e.multa_paga, 0) AS multa_paga
        FROM emprestimos e
        JOIN usuarios u ON e.id_usuario = u.id_usuario
        JOIN livros l ON e.id_livro = l.id_livro
        WHERE e.data_devolucao IS NULL AND CURDATE() > e.data_prevista
      `;

      const [rows] = await pool.query(query);

      const result = rows.map(r => ({
        id_emprestimo: r.id_emprestimo,
        usuario: { id: r.id_usuario, nome_completo: r.nome_completo },
        livro: { id: r.id_livro, titulo: r.titulo },
        data_prevista: r.data_prevista,
        dias_atraso: Math.max(0, r.dias_atraso),
        valor: Math.max(0, r.dias_atraso) * TAXA_DIARIA,
        multa_paga: Boolean(r.multa_paga)
      }));

      res.json(result);
    } catch (err) {
      console.error('Erro ao listar multas:', err);
      res.status(500).json({ error: 'Erro ao listar multas' });
    }
  });

  // Marcar multa como paga (adiciona/usa coluna multa_paga em emprestimos)
  router.post('/:id/pagar', async (req, res) => {
    try {
      const id = req.params.id;
      const [result] = await pool.query('UPDATE emprestimos SET multa_paga = 1 WHERE id_emprestimo = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Empréstimo não encontrado' });
      res.json({ message: 'Multa marcada como paga' });
    } catch (err) {
      console.error('Erro ao marcar multa paga:', err);
      res.status(500).json({ error: 'Erro ao marcar multa paga' });
    }
  });

  return router;
};
