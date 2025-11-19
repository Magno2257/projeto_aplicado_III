require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let pool;

async function initializeDb() {
  pool = await mysql.createPool(dbConfig);
  console.log('Banco de dados conectado!');

  // Importar rotas depois que o pool estiver disponível
  const usuariosRoutes = require('./routes/usuarios')(pool);
  const livrosRoutes = require('./routes/livros')(pool);
  const emprestimosRoutes = require('./routes/emprestimos')(pool);
  const livrosDisponiveisRoutes = require('./routes/livrosDisponiveis')(pool);
  const emprestimosDetalhadosRoutes = require('./routes/emprestimosDetalhados')(pool);
  const authRoutes = require('./routes/auth')(pool);
  const multasRoutes = require('./routes/multas')(pool);
  const testeRoutes = require('./routes/teste')(pool);
  app.use('/usuarios', usuariosRoutes);
  app.use('/livros', livrosRoutes);
  app.use('/emprestimos', emprestimosRoutes);
  app.use('/livros-disponiveis', livrosDisponiveisRoutes);
  app.use('/emprestimos-detalhados', emprestimosDetalhadosRoutes);
  app.use('/auth', authRoutes);
  app.use('/multas', multasRoutes);
  app.use('/teste', testeRoutes);
}

initializeDb().catch(console.error);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
