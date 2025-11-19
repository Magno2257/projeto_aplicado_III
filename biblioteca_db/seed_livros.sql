USE biblioteca_db;

-- Seed de livros para testes
INSERT INTO livros (titulo, autor, edicao, categoria, data_cadastro, numero_exemplares, tipo_de_material) VALUES
('Dom Casmurro', 'Machado de Assis', '1ª', 'romance', '2025-11-18', 5, 'livro'),
('Grande Sertão: Veredas', 'João Guimarães Rosa', '2ª', 'romance', '2025-11-18', 3, 'livro'),
('Os Lusíadas', 'Luís de Camões', '3ª', 'poesia', '2025-11-18', 2, 'livro'),
('A Hora da Estrela', 'Clarice Lispector', '1ª', 'romance', '2025-11-18', 4, 'livro'),
('Introdução à Psicologia', 'Ana Sousa', '1ª', 'ciências humanas', '2025-11-18', 6, 'livro'),
('Física Moderna', 'Carlos P. Lima', '4ª', 'ciências humanas', '2025-11-18', 2, 'livro'),
('Poesias Reunidas', 'Cecília Meireles', '1ª', 'poesia', '2025-11-18', 3, 'livro'),
('Metodologia Científica', 'Sérgio Ribeiro', '2ª', 'ciências humanas', '2025-11-18', 5, 'livro'),
('História do Brasil', 'Beatriz Nogueira', '3ª', 'ciências humanas', '2025-11-18', 4, 'livro'),
('Tecnologia e Sociedade', 'Marcos Duarte', '1ª', 'ciências humanas', '2025-11-18', 2, 'livro'),
('Teses e Ensaios', 'Paulo Almeida', '1ª', 'ciências humanas', '2025-11-18', 1, 'tese'),
('Documentários & Estudos', 'Renata Castro', '1ª', 'ciências humanas', '2025-11-18', 1, 'audiovisual');

-- Você pode adicionar/remover linhas conforme necessário.
-- Para importar (assumindo que o DB já existe):
-- mysql -u <usuario> -p biblioteca_db < seed_livros.sql
