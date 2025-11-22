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

  // ROTA DE LISTAGEM (GET /)
  // Lista empréstimos atrasados, fazendo JOIN com a tabela 'multas'
  router.get('/', async (req, res) => {
    try {
      // Esta query busca todos os empréstimos atrasados que AINDA NÃO FORAM DEVOLVIDOS.
      // O LEFT JOIN traz os dados da multa (ID, Valor, Status) se ela já tiver sido gerada
      // pelo emprestimos.js.
      const query = `
        SELECT
          e.id_emprestimo,
          u.id_usuario,
          u.nome_completo,
          l.id_livro,
          l.titulo,
          e.data_prevista,
          m.id_multa,                       
          m.valor_multa,                    
          m.status_pagamento,               
          DATEDIFF(CURDATE(), e.data_prevista) AS dias_atraso
        FROM emprestimos e
        JOIN usuarios u ON e.id_usuario = u.id_usuario
        JOIN livros l ON e.id_livro = l.id_livro
        LEFT JOIN multas m ON e.id_multa = m.id_multa  
        WHERE e.data_devolucao IS NULL AND CURDATE() > e.data_prevista
      `;

      const [rows] = await pool.query(query);

      const result = rows.map(r => {
        const diasAtraso = Math.max(0, r.dias_atraso);
        const valorCalculado = diasAtraso * TAXA_DIARIA;
        
        // CORREÇÃO: Converte o valor do banco de dados para float, se existir.
        const valorMultaDb = r.valor_multa !== null ? parseFloat(r.valor_multa) : null;
        
        return {
          id_emprestimo: r.id_emprestimo,
          id_multa: r.id_multa || null, 
          usuario: { id: r.id_usuario, nome_completo: r.nome_completo },
          livro: { id: r.id_livro, titulo: r.titulo },
          data_prevista: r.data_prevista,
          dias_atraso: diasAtraso,
          // Prioriza o valor da multa gerada no DB (se existir), senão calcula o atual
          valor: valorMultaDb !== null ? valorMultaDb : valorCalculado, 
          // Prioriza o status do DB (se existir), senão considera 'Pendente' (atrasado)
          status_pagamento: r.status_pagamento || 'Pendente' 
        };
      });

      res.json(result);
    } catch (err) {
      console.error('Erro ao listar multas (GET /):', err);
      // Se este erro ainda ocorrer, provavelmente é um problema de conexão ou permissão.
      res.status(500).json({ error: 'Erro ao listar multas' });
    }
  });

  // ROTA DE PAGAMENTO (POST /:id/pagar)
  // ID aqui é o ID do EMPRÉSTIMO, que contém o ID da Multa
  router.post('/:id/pagar', async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      const id_emprestimo = req.params.id;

      // 1. Buscar o ID da Multa (id_multa) e status na tabela emprestimos/multas
      const [emprestimo] = await connection.query(
        `SELECT e.id_multa, m.status_pagamento 
         FROM emprestimos e 
         LEFT JOIN multas m ON e.id_multa = m.id_multa 
         WHERE e.id_emprestimo = ?`,
        [id_emprestimo]
      );

      if (emprestimo.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Empréstimo não encontrado.' });
      }
      
      const id_multa = emprestimo[0].id_multa;
      const status_pagamento = emprestimo[0].status_pagamento;

      // 1.1. Verificação da Multa
      if (id_multa === null) {
         await connection.rollback();
         // Este erro indica que o empréstimo atrasado não gerou a multa (bug no emprestimos.js)
         return res.status(400).json({ error: 'Este empréstimo não tem multa associada.' });
      }
      if (status_pagamento === 'Pago') {
         await connection.rollback();
         return res.status(400).json({ error: `Multa ID ${id_multa} já estava paga.` });
      }
      if (status_pagamento === 'Cancelada') {
         await connection.rollback();
         return res.status(400).json({ error: `Multa ID ${id_multa} foi cancelada.` });
      }

      // 2. Atualizar o status_pagamento na tabela 'multas' para 'Pago'
      const [result] = await connection.query(
        "UPDATE multas SET status_pagamento = 'Pago', data_pagamento = CURDATE() WHERE id_multa = ?",
        [id_multa]
      );
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(500).json({ error: 'Falha ao atualizar o status da multa (Multa não encontrada).' });
      }

      await connection.commit();
      
      console.log(`Debug Pagamento: Multa ID ${id_multa} (Empréstimo ${id_emprestimo}) marcada como 'Pago'.`);
      res.json({ 
        message: 'Multa paga com sucesso. Devolução liberada.',
        id_multa: id_multa 
      });

    } catch (err) {
      if (connection) await connection.rollback();
      console.error('Erro ao marcar multa paga (POST /:id/pagar):', err);
      res.status(500).json({ error: 'Erro ao marcar multa paga' });
    } finally {
      if (connection) connection.release();
    }
  });

  return router;
};