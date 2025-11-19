CREATE DATABASE IF NOT EXISTS biblioteca_db;

USE biblioteca_db;

-- Tabela LIVROS -> livros
CREATE TABLE
    livros (
        id_livro int PRIMARY KEY auto_increment,
        titulo varchar(255) not null,
        autor varchar(255) not null,
        edicao varchar(50),
        categoria ENUM ('romance', 'poesia', 'ciências humanas') NOT NULL,
        data_cadastro date not null default (current_date()),
        numero_exemplares int not null default 1,
        tipo_de_material enum (
            'livro',
            'periódico',
            'tese',
            'dissertação',
            'audiovisual'
        ) NOT NULL
    );

-- Tabela USUARIO -> usuarios
CREATE TABLE
    usuarios (
        id_usuario int PRIMARY KEY auto_increment,
        nome_completo varchar(100) not null,
        data_cadastro date not null default (current_date()),
        telefone varchar(20),
        email varchar(100) unique,
        endereco text,
        cpf varchar(14) unique not null,
        tipo_usuario enum ('professor', 'aluno', 'técnico') not null
    );

-- Tabela MULTA -> multas
CREATE TABLE
    multas (
        id_multa int PRIMARY KEY auto_increment,
        valor_multa decimal(4, 2) not null,
        data_vencimento date not null,
        data_pagamento date null,
        status_pagamento varchar(100)
    );

-- Tabela RESERVA -> reservas
CREATE TABLE
    reservas (
        id_reserva int PRIMARY KEY auto_increment,
        data_reserva date not null default (current_date()),
        status_reserva enum ('ativo', 'cancelada', 'pronta'),
        data_notificacao date not null default (current_date()),
        id_usuario int not null,
        id_livro int not null
    );

-- Tabela EMPRESTIMO -> emprestimos
CREATE TABLE
    emprestimos (
        id_emprestimo INT AUTO_INCREMENT PRIMARY KEY,
        data_emprestimo DATE NOT NULL DEFAULT (CURRENT_DATE),
        data_prevista DATE not null,
        data_devolucao DATE,
        status_devolucao varchar(20) not null default 'ativo',
        id_usuario int not null,
        id_multa int null,
        id_livro int not null
    );

-- Tabela Relatorios -> relatorios
CREATE TABLE
    relatorios (
        id_relatorio int PRIMARY KEY auto_increment,
        titulo varchar(200),
        data_geracao date,
        conteudo text,
        id_usuario int
    );

-- CHAVES ESTRANGEIRAS (com nomes de tabelas em minúsculas)
ALTER TABLE reservas ADD CONSTRAINT fk_reservas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE reservas ADD CONSTRAINT fk_reservas_livro FOREIGN KEY (id_livro) REFERENCES livros (id_livro) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE emprestimos ADD CONSTRAINT fk_emprestimos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE emprestimos ADD CONSTRAINT fk_emprestimos_multa FOREIGN KEY (id_multa) REFERENCES multas (id_multa) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE emprestimos ADD CONSTRAINT fk_emprestimos_livro FOREIGN KEY (id_livro) REFERENCES livros (id_livro) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE relatorios ADD CONSTRAINT fk_relatorios_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger para calcular a data_prevista
DELIMITER / / CREATE TRIGGER set_data_prevista BEFORE INSERT ON emprestimos FOR EACH ROW BEGIN IF NEW.data_prevista IS NULL THEN
SET
    NEW.data_prevista = DATE_ADD (CURRENT_DATE, INTERVAL 10 DAY);

END IF;

END;

/ / DELIMITER;

-- View para informar o status calculado dos empréstimos
CREATE VIEW
    vw_emprestimos AS
SELECT
    e.id_emprestimo,
    e.id_usuario,
    e.id_livro,
    e.data_emprestimo,
    e.data_prevista,
    e.data_devolucao,
    CASE
        WHEN e.data_devolucao IS NOT NULL THEN 'devolvido'
        WHEN CURDATE () > e.data_prevista THEN 'atrasado'
        ELSE 'emprestado'
    END AS status_calculado
FROM
    emprestimos e;

CREATE
OR REPLACE VIEW vw_emprestimos_detalhados AS
SELECT
    e.id_emprestimo,
    e.data_emprestimo,
    e.data_prevista,
    e.data_devolucao,
    u.id_usuario,
    u.nome_completo,
    l.id_livro,
    l.titulo,
    CASE
        WHEN e.data_devolucao IS NOT NULL THEN 'devolvido'
        WHEN CURDATE () > e.data_prevista THEN 'atrasado'
        ELSE 'emprestado'
    END AS status_calculado
FROM
    emprestimos e
    JOIN usuarios u ON e.FK_USUARIO_ID_usuario = u.id_usuario
    JOIN livros l ON e.FK_LIVROS_ID_livro = l.id_livro;

        CREATE OR REPLACE VIEW vw_disponibilidade AS
SELECT
  l.id_livro,
  -- ... (outras colunas)
  (l.numero_exemplares - COUNT(e.id_emprestimo)) AS disponibilidade
FROM livros l
LEFT JOIN emprestimos e
  ON l.id_livro = e.FK_LIVROS_ID_livro AND e.data_devolucao IS NULL
GROUP BY l.id_livro;


CREATE OR REPLACE VIEW vw_disponibilidade AS
SELECT
	l.id_livro,
    l.titulo,
    l.numero_exemplares,
    (l.numero_exemplares - COUNT(e.id_emprestimo)) AS disponibilidade
FROM
	livros l
    LEFT JOIN emprestimos e ON l.id_livro = e.FK_LIVROS_ID_livro AND e.data_devolucao IS NULL
GROUP BY
	l.id_livro,
    l.titulo,
    l.numero_exemplares;

-- 3. CRIAÇÃO DA VW_EMPRESTIMOS_DETALHADOS CORRIGIDA (consistente com FKs longas)
CREATE OR REPLACE VIEW vw_emprestimos_detalhados AS
SELECT 
	e.id_emprestimo,
    e.data_emprestimo,
    e.data_prevista,
    e.data_devolucao,
    u.id_usuario,
    u.nome_completo,
    l.id_livro,
    l.titulo,
    CASE
    WHEN e.data_devolucao IS NOT NULL THEN 'devolvido'
    WHEN CURDATE() > e.data_prevista THEN 'atrasado'
    ELSE 'emprestado'
    END AS status_calculado
FROM emprestimos e
JOIN usuarios u ON e.FK_USUARIO_ID_usuario = u.id_usuario 
JOIN livros l ON e.FK_LIVROS_ID_livro = l.id_livro;