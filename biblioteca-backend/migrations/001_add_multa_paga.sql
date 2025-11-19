-- Migration: add coluna multa_paga em emprestimos
ALTER TABLE emprestimos
ADD COLUMN multa_paga TINYINT(1) NOT NULL DEFAULT 0;
