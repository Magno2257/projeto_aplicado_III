import { useState, useEffect } from 'react';
import { Table, Button, Form, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Livros() {
  const [livros, setLivros] = useState([]);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      carregarLivros(busca);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [busca]);

  const carregarLivros = async (termo = '') => {
        try {
      const res = await api.get('/livros', { params: { busca: termo } });
      setLivros(res.data);
    } catch (err) {
      console.error('Erro ao carregar livros:', err);
    }
  };

  const excluirLivro = async (id) => {
    if (confirm('Deseja realmente excluir este livro?')) {
      try {
        await api.delete(`/livros/${id}`);
        alert('Livro excluído!');
        carregarLivros(busca);
      } catch (err) {
        alert('Erro ao excluir livro.');
        console.error(err);
      }
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col><h2>Livros</h2></Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/livros/cadastro')}>
            Cadastrar novo livro
          </Button>
        </Col>
      </Row>

      <Form.Control
        type="text"
        placeholder="Buscar por título ou autor"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-3"
      />

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Autor</th>
            <th>Edição</th>
            <th>Categoria</th>
            <th>Material</th>
            <th>Exemplares</th>
            <th>Disponíveis</th>
            <th>Data Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {livros.map((livro) => (
            <tr key={livro.id_livro}>
              <td>{livro.id_livro}</td>
              <td>{livro.titulo}</td>
              <td>{livro.autor}</td>
              <td>{livro.edicao}</td>
              <td>{livro.categoria}</td>
              <td>{livro.tipo_de_material}</td>
              <td>{livro.numero_exemplares}</td>
              <td>{livro.disponibilidade}</td>
              <td>{new Date(livro.data_cadastro).toLocaleDateString()}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={() => navigate(`/livros/cadastro/${livro.id_livro}`)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => excluirLivro(livro.id_livro)}
                >
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
