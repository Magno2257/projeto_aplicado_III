import { useState, useEffect } from 'react';
import { Table, Button, Form, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Emprestimos() {
  const [emprestimos, setEmprestimos] = useState([]);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
      const delayDebounce = setTimeout(() => {
        carregarEmprestimos(busca);
      }, 400);

      return () => clearTimeout(delayDebounce);
    }, [busca]);


  const carregarEmprestimos = async (termoBusca = '') => {
    try {
      // Envia o termo de busca como query param para a API
      const res = await api.get('/emprestimos-detalhados', {
        params: { busca: termoBusca }
      });
      setEmprestimos(res.data);
    } catch (err) {
      console.error('Erro ao carregar empréstimos:', err);
    }
  };

  const devolverEmprestimo = async (id) => {
    try {
      await api.put(`/emprestimos/${id}`);
      alert('Devolução registrada!');
      carregarEmprestimos(busca);
    } catch (err) {
      alert('Erro ao devolver livro.');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return isNaN(date) ? '---' : date.toLocaleDateString();
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col><h2>Empréstimos</h2></Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/emprestimos/cadastro')}>
            Registrar novo empréstimo
          </Button>
        </Col>
      </Row>

      <Form.Control
        type="text"
        placeholder="Buscar por usuário ou livro"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-3"
      />

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuário</th>
            <th>Livro</th>
            <th>Data Empréstimo</th>
            <th>Data Prevista</th>
            <th>Data Devolução</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {emprestimos.map((e) => (
            <tr key={e.id_emprestimo}>
              <td>{e.id_emprestimo}</td>
              <td>{e.nome_completo}</td>
              <td>{e.titulo}</td>
              <td>{formatDate(e.data_emprestimo)}</td>
              <td>{formatDate(e.data_prevista)}</td>
              <td>{formatDate(e.data_devolucao)}</td>
              <td>{e.status_calculado}</td>
              <td>
                {e.data_devolucao === null && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => devolverEmprestimo(e.id_emprestimo)}
                  >
                    Devolver
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
