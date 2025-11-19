module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { busca } = req.query;

      let query = 'SELECT * FROM vw_emprestimos_detalhados';
      let params = [];

      if (busca) {
        query += ' WHERE nome_completo LIKE ? OR titulo LIKE ?';
        params.push(`%${busca}%`, `%${busca}%`);
      }

      const [rows] = await db.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao buscar empréstimos detalhados:', err);
      res.status(500).json({ error: 'Erro ao buscar empréstimos detalhados' });
    }
  });

  return router;
};
