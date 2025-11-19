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
            console.error("SQL ERROR:", err);
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
            console.error(err);
            res.status(500).json({ error: "Erro ao buscar empréstimo" });
        }
    });

    // Rota de Criação: POST /emprestimos
    router.post("/", async (req, res) => {
        try {
            const { id_usuario, id_livro } = req.body;

            // 1. Verifica disponibilidade na VIEW vw_livros_disponiveis (ou vw_disponibilidade)
            const [livros] = await pool.query(
                "SELECT disponibilidade FROM vw_disponibilidade WHERE id_livro = ?",
                [id_livro]
            );

            if (livros.length === 0 || livros[0].disponibilidade < 1) {
                return res.status(400).json({ error: "Livro indisponível." });
            }

            // 2. Calcula data prevista (Se o TRIGGER SQL estiver ativo, este cálculo é redundante,
            // mas mantemos aqui para garantir o envio do campo se o Trigger falhar ou for removido).
            const dataPrevista = new Date();
            dataPrevista.setDate(dataPrevista.getDate() + 7);
            const dataPrevistaFormatada = dataPrevista.toISOString().slice(0, 10);

            // 3. INSERÇÃO (Usando os nomes das FKs conforme a correção)
            const [result] = await pool.query(
                "INSERT INTO emprestimos (data_prevista, FK_USUARIO_ID_usuario, FK_LIVROS_ID_livro) VALUES (?, ?, ?)",
                [dataPrevistaFormatada, id_usuario, id_livro]
            );

            res.status(201).json({ id: result.insertId });
        } catch (err) {
            console.error("SQL ERROR:", err);
            res.status(500).json({ error: "Erro ao registrar empréstimo." });
        }
    });

    // Rota de Devolução: PUT /emprestimos/:id
    router.put('/:id', async (req, res) => {
        const id_emprestimo = req.params.id;
        const dataDevolucao = new Date();
        dataDevolucao.setHours(0, 0, 0, 0); 

        try {
            // 1. Buscar detalhes do empréstimo (data_prevista, usuário, e checar se já foi devolvido)
            const [emprestimos] = await pool.query(
                'SELECT data_prevista, data_devolucao, FK_USUARIO_ID_usuario FROM emprestimos WHERE id_emprestimo = ?',
                [id_emprestimo]
            );

            if (emprestimos.length === 0) {
                return res.status(404).json({ error: 'Empréstimo não encontrado.' });
            }

            if (emprestimos[0].data_devolucao !== null) {
                return res.status(400).json({ error: 'Este empréstimo já foi devolvido.' });
            }
            
            const { data_prevista, FK_USUARIO_ID_usuario } = emprestimos[0];
            const dataPrevista = new Date(data_prevista);
            dataPrevista.setUTCHours(0, 0, 0, 0);

            // 2. Calcular Multa
            let multaValor = 0;
            let diasAtraso = 0;

            if (dataDevolucao > dataPrevista) {
                const diffTime = Math.abs(dataDevolucao.getTime() - dataPrevista.getTime());
                diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                multaValor = diasAtraso * 2.00; // R$ 2,00 por dia de atraso
            }

            // 3. Registrar multa, se houver
            if (multaValor > 0) {
                await pool.query(
                    'INSERT INTO multas (valor_multa, data_registro, FK_USUARIO_ID_usuario, FK_EMPRESTIMO_ID_emprestimo) VALUES (?, ?, ?, ?)',
                    [multaValor, dataDevolucao, FK_USUARIO_ID_usuario, id_emprestimo]
                );
            }

            // 4. Registrar a devolução (UPDATE)
            const [result] = await pool.query(
                'UPDATE emprestimos SET data_devolucao = ? WHERE id_emprestimo = ?',
                [dataDevolucao, id_emprestimo]
            );

            let mensagem = 'Devolução registrada com sucesso.';
            if (multaValor > 0) {
                mensagem += ` Multa de R$ ${multaValor.toFixed(2)} (${diasAtraso} dias de atraso) registrada.`;
            }
            
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Empréstimo não encontrado para atualização.' });

            res.json({ message: mensagem, multa: multaValor });

        } catch (err) {
            console.error('ERRO NA DEVOLUÇÃO:', err);
            res.status(500).json({ error: 'Erro interno ao registrar devolução e/ou multa.' });
        }
    });

    // Você pode adicionar a rota DELETE aqui, se desejar.

    // 5. Retorna o router
    return router;
};