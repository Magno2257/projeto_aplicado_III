const express = require("express");
const router = express.Router();

module.exports = (pool) => {
  // Rota de Listagem: GET /emprestimos
  router.get("/", async (req, res) => {
    try {
      // Usa a VIEW para listar os empréstimos detalhados
      const [rows] = await pool.query(
        "SELECT * FROM vw_emprestimos_detalhados"
      );
      res.json(rows);
    } catch (err) {
      console.error("SQL ERROR na listagem:", err);
      res.status(500).json({ error: "Erro ao buscar empréstimos." });
    }
  });

  // Rota de Busca por ID: GET /emprestimos/:id
  router.get("/:id", async (req, res) => {
    try {
      // Usa a VIEW para buscar os detalhes por ID
      const [rows] = await pool.query(
        "SELECT * FROM vw_emprestimos_detalhados WHERE id_emprestimo = ?",
        [req.params.id]
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "Empréstimo não encontrado" });
      res.json(rows[0]);
    } catch (err) {
      console.error("SQL ERROR na busca por ID:", err);
      res.status(500).json({ error: "Erro ao buscar empréstimo" });
    }
  });

  // Rota de Criação: POST /emprestimos
  router.post("/", async (req, res) => {
    try {
      const { id_usuario, id_livro } = req.body;

      // 1. Verifica disponibilidade na VIEW
      const [livros] = await pool.query(
        "SELECT disponibilidade FROM vw_disponibilidade WHERE id_livro = ?",
        [id_livro]
      );

      if (livros.length === 0 || livros[0].disponibilidade < 1) {
        return res.status(400).json({ error: "Livro indisponível." });
      }

      // 2. Calcula data prevista (7 dias no futuro)
      const dataPrevista = new Date();
      dataPrevista.setDate(dataPrevista.getDate() + 7); 
      const dataPrevistaFormatada = dataPrevista.toISOString().slice(0, 10);

      // 3. INSERÇÃO
      const [result] = await pool.query(
        "INSERT INTO emprestimos (data_prevista, id_usuario, id_livro) VALUES (?, ?, ?)",
        [dataPrevistaFormatada, id_usuario, id_livro]
      );

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error("SQL ERROR no POST:", err);
      res.status(500).json({ error: "Erro ao registrar empréstimo." });
    }
  });

  // Função centralizada para finalizar a devolução (Passos 5 e 6)
  const updateDevolucao = async (id_emprestimo, id_livro, dataDevolucao) => {
    // 5. Registrar a devolução (UPDATE)
    const [result] = await pool.query(
      "UPDATE emprestimos SET data_devolucao = ? WHERE id_emprestimo = ?",
      [dataDevolucao.toISOString().slice(0, 10), id_emprestimo] // Garante formato YYYY-MM-DD
    );

    // 6. ATUALIZAR DISPONIBILIDADE DO LIVRO (Incrementa o número de exemplares)
    await pool.query(
      "UPDATE livros SET numero_exemplares = numero_exemplares + 1 WHERE id_livro = ?",
      [id_livro]
    );

    if (result.affectedRows === 0) {
      throw new Error("Empréstimo não encontrado para atualização de devolução.");
    }
  };

  // Rota de Devolução: PUT /emprestimos/:id
  router.put("/:id", async (req, res) => {
    const id_emprestimo = req.params.id;
    const dataDevolucao = new Date();
    dataDevolucao.setHours(0, 0, 0, 0);

    try {
      // 1. Buscar detalhes do empréstimo (data_prevista, usuário, id_multa, id_livro)
      const [emprestimos] = await pool.query(
        "SELECT data_prevista, data_devolucao, id_usuario, id_multa, id_livro FROM emprestimos WHERE id_emprestimo = ?",
        [id_emprestimo]
      );

      if (emprestimos.length === 0) {
        return res.status(404).json({ error: "Empréstimo não encontrado." });
      }

      if (emprestimos[0].data_devolucao !== null) {
        return res
          .status(400)
          .json({ error: "Este empréstimo já foi devolvido." });
      }

      const { data_prevista, id_usuario, id_multa, id_livro } = emprestimos[0];
      const dataPrevista = new Date(data_prevista);
      dataPrevista.setUTCHours(0, 0, 0, 0); // Ajuste UTC para comparação correta

      // 2. VERIFICAÇÃO DE BLOQUEIO DE MULTA JÁ EXISTENTE (Caso de segunda tentativa)
      if (id_multa !== null) {
        const [multaStatus] = await pool.query(
          "SELECT status_pagamento FROM multas WHERE id_multa = ?",
          [id_multa]
        );

        if (multaStatus.length === 0) {
            console.error(`ERRO CRÍTICO: Empréstimo ${id_emprestimo} tem id_multa=${id_multa}, mas a multa não existe na tabela 'multas'.`);
            return res.status(500).json({ error: "Erro interno: Multa referenciada não encontrada no banco de dados." });
        }
        
        const status = multaStatus[0].status_pagamento;
        console.log(`Debug Devolução: Multa ID ${id_multa} para Empréstimo ${id_emprestimo} tem Status: '${status}'`); // <<< LOG DE DEBUG

        // Se a multa for encontrada e o status for diferente de 'Pago', BLOQUEIA.
        if (status !== "Pago") {
          return res.status(403).json({
            error: `⛔ Devolução bloqueada. A multa (ID ${id_multa}) está pendente: ${status}. É necessário pagar a multa antes de devolver.`,
          });
        }
        // Se id_multa existe e está paga, o fluxo continua (Passa para o Passo 5/6).
      }


      // 3. Calcular Multa
      let multaValor = 0;
      let diasAtraso = 0;

      if (dataDevolucao > dataPrevista) {
        const diffTime = Math.abs(
          dataDevolucao.getTime() - dataPrevista.getTime()
        );
        diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        multaValor = diasAtraso * 2.0; // R$ 2,00 por dia de atraso
      }

      // 4. REGISTRAR NOVA MULTA E BLOQUEAR IMEDIATAMENTE (Caso de primeira tentativa de devolução atrasada)
      // Esta condição só será verdadeira se: multaValor > 0 E id_multa === null (primeira tentativa atrasada)
      if (multaValor > 0 && id_multa === null) {
        // Registra a nova multa na tabela 'multas'
        const [multaResult] = await pool.query(
          "INSERT INTO multas (valor_multa, data_vencimento, status_pagamento, id_usuario, id_emprestimo) VALUES (?, ?, 'Pendente', ?, ?)",
          [multaValor, dataDevolucao.toISOString().slice(0, 10), id_usuario, id_emprestimo]
        );
        const novaMultaId = multaResult.insertId;

        // Atualiza o id_multa no empréstimo
        await pool.query(
          "UPDATE emprestimos SET id_multa = ? WHERE id_emprestimo = ?",
          [novaMultaId, id_emprestimo]
        );
        
        // !!! BLOQUEIO IMEDIATO !!!
        return res.status(403).json({
          error: `🚫 Atraso de ${diasAtraso} dias detectado. Uma multa de R$ ${multaValor.toFixed(2)} foi gerada (ID ${novaMultaId}). Pague para liberar a devolução.`,
          multa_id: novaMultaId,
          status: 'Pendente'
        });
      }

      // 5 & 6. Finalizar a devolução (Executa se: multaValor == 0 OU se id_multa existe e está PAGO)
      await updateDevolucao(id_emprestimo, id_livro, dataDevolucao);

      let mensagem = "Devolução registrada com sucesso.";
      
      // Mensagem customizada se a devolução foi de um item com multa paga
      if (id_multa !== null) {
        mensagem += ` (Multa ID ${id_multa} estava paga).`;
      } else if (multaValor === 0) {
        mensagem += " Sem multa registrada.";
      }

      res.json({ message: mensagem });
    } catch (err) {
      console.error("ERRO NA DEVOLUÇÃO:", err);
      // Inclui a mensagem de erro específica se for a exceção que lançamos
      const errorMessage = err.message.includes("Empréstimo não encontrado") ? err.message : "Erro interno ao registrar devolução e/ou multa.";
      res
        .status(500)
        .json({ error: errorMessage });
    }
  });

  return router;
};