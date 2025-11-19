module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { busca } = req.query;

      let query = 'SELECT * FROM vw_disponibilidade';
      let params = [];

      if (busca) {
        query += ' WHERE titulo LIKE ? OR autor LIKE ?';
        params.push(`%${busca}%`, `%${busca}%`);
      }

      const [rows] = await db.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao buscar disponibilidade:', err);
      res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
    }
  });

  return router;
};
