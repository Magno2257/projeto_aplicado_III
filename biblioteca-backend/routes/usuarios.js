const express = require('express');
const validator = require('validator');
const router = express.Router();

function validarCPF(cpf) {
  // Trata entrada nula/indefinida
  if (cpf === null || cpf === undefined) return false;

  // Força string e remove qualquer caractere não numérico
  cpf = String(cpf).replace(/\D/g, '');

  // Deve ter 11 dígitos
  if (cpf.length !== 11) return false;

  // Rejeita sequências com todos dígitos iguais (ex: '00000000000')
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(cpf[10]);
}

module.exports = (pool) => {
  // Listar usuários com filtro de nome e cpf
  router.get('/', async (req, res) => {
    const nome = req.query.nome;
    try {
      let query = 'SELECT * FROM usuarios';
      let params = [];

      if (nome) {
        query += ' WHERE nome_completo LIKE ? OR cpf LIKE ?';
        params.push(`%${nome}%`, `%${nome}%`);
      }

      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  });

  // Obter usuário por ID
  router.get('/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  });

  // Criar novo usuário
  router.post('/', async (req, res) => {
    try {
      const { nome_completo, cpf, telefone, email, endereco, tipo_usuario } = req.body;

      // Validação
      if (!nome_completo || !cpf || !email || !tipo_usuario) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'E-mail inválido' });
      }

      if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido' });
      }

      const [result] = await pool.query(
        'INSERT INTO usuarios (nome_completo, cpf, telefone, email, endereco, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)',
        [nome_completo, cpf, telefone, email, endereco, tipo_usuario]
      );

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  });

  // Atualizar usuário
  router.put('/:id', async (req, res) => {
    try {
      const { nome_completo, cpf, telefone, email, endereco, tipo_usuario } = req.body;

      // Validação
      if (!nome_completo || !cpf || !email || !tipo_usuario) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'E-mail inválido' });
      }

      if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido' });
      }

      const [result] = await pool.query(
        'UPDATE usuarios SET nome_completo = ?, cpf = ?, telefone = ?, email = ?, endereco = ?, tipo_usuario = ? WHERE id_usuario = ?',
        [nome_completo, cpf, telefone, email, endereco, tipo_usuario, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  });

  // Deletar usuário
  router.delete('/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  });

  return router;
};
