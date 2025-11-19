// routes/teste.js

const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Lista de todas as tabelas (deve ser em minúsculas e plural)
    const tabelas = [
        'livros',
        'usuarios',
        'multas',
        'reservas',
        'emprestimos',
        'relatorios'
    ];

    router.get('/db-status', async (req, res) => {
        const resultados = {};
        let statusGeral = 'OK';

        try {
            for (const tabela of tabelas) {
                try {
                    // Consulta segura para verificar a existência da tabela (SELECT 1 é mais eficiente)
                    await pool.query(`SELECT 1 FROM ${tabela} LIMIT 1`);
                    resultados[tabela] = 'Acessível (OK)';

                } catch (error) {
                    statusGeral = 'ERRO';
                    
                    // Verifica o código de erro para Tabela Não Existe (1146)
                    if (error.errno === 1146) {
                        resultados[tabela] = `FALHA: Tabela não existe (${tabela})`;
                    } else {
                        resultados[tabela] = `ERRO DESCONHECIDO: ${error.message}`;
                    }
                }
            }
            
            // Retorna o resultado final
            if (statusGeral === 'OK') {
                return res.status(200).json({ 
                    status: 'Sucesso',
                    mensagem: 'Todas as tabelas principais foram acessadas com sucesso.',
                    testes: resultados
                });
            } else {
                 return res.status(500).json({ 
                    status: 'Falha',
                    mensagem: 'Pelo menos uma tabela não pôde ser acessada. Verifique os erros.',
                    testes: resultados
                });
            }

        } catch (globalError) {
            console.error('Erro na conexão com o DB:', globalError);
            return res.status(500).json({ 
                status: 'Falha Crítica', 
                mensagem: 'Não foi possível se conectar ou executar a consulta inicial no banco de dados.', 
                erro: globalError.message 
            });
        }
    });

    return router;
};