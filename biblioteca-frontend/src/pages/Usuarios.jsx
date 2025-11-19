import { useState, useEffect } from 'react';
import { Table, Button, Form, Container, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function formatarCPF(cpf) {
  if (!cpf) return '';
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return cpf;
  return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(tel) {
  if (!tel) return '';
  const nums = tel.replace(/\D/g, '');
  if (nums.length === 11) {
    return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (nums.length === 10) {
    return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return tel;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const delay = setTimeout(() => {
      carregarUsuarios(busca);
    }, 400);

    return () => clearTimeout(delay);
  }, [busca]);

  const carregarUsuarios = async (nome = '') => {
    try {
      setCarregando(true);
      const res = await api.get('/usuarios', {
        params: { nome },
      });
      setUsuarios(res.data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleBuscar = (e) => {
    setBusca(e.target.value);
  };

  const iniciarEdicao = (usuario) => {
    navigate(`/usuarios/cadastro/${usuario.id_usuario}`);
  };

  const excluirUsuario = async (id) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/usuarios/${id}`);
        alert('Usuário excluído com sucesso!');
        carregarUsuarios();
      } catch (err) {
        alert('Erro ao excluir usuário.');
        console.error(err);
      }
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col><h2>Usuários</h2></Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/usuarios/cadastro')}>
            Cadastrar novo usuário
          </Button>
        </Col>
      </Row>

      <Form.Control
        type="text"
        placeholder="Buscar por nome ou CPF"
        value={busca}
        onChange={handleBuscar}
        className="mb-3"
      />

      {carregando ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Carregando usuários...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Endereço</th>
              <th>Data Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario}>
                <td>{u.id_usuario}</td>
                <td>{u.nome_completo}</td>
                <td>{formatarCPF(u.cpf)}</td>
                <td>{formatarTelefone(u.telefone)}</td>
                <td>{u.email}</td>
                <td>{u.tipo_usuario}</td>
                <td>{u.endereco}</td>
                <td>{new Date(u.data_cadastro).toLocaleDateString()}</td>
                <td>
                  <Button variant="warning" size="sm" onClick={() => iniciarEdicao(u)} className="me-2">
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => excluirUsuario(u.id_usuario)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
