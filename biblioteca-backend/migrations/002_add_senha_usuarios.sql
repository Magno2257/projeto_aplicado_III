-- Migration: add coluna senha em usuarios
ALTER TABLE usuarios
ADD COLUMN senha VARCHAR(255) NULL;
