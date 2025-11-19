import { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EmprestimoCadastro() {
  const [usuarios, setUsuarios] = useState([]);
  const [livros, setLivros] = useState([]);
  const [form, setForm] = useState({ id_usuario: '', id_livro: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/usuarios').then(res => setUsuarios(res.data));
    api.get('/livros-disponiveis').then(res => setLivros(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emprestimos', form);
      alert('Empréstimo registrado!');
      navigate('/emprestimos');
    } catch (err) {
      alert('Erro ao registrar empréstimo.');
      console.error(err);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Registrar Empréstimo</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Usuário</Form.Label>
          <Form.Select
            name="id_usuario"
            value={form.id_usuario}
            onChange={handleChange}
            required
          >
            <option value="">Selecione o usuário</option>
            {usuarios.map(u => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nome_completo}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Livro</Form.Label>
          <Form.Select
            name="id_livro"
            value={form.id_livro}
            onChange={handleChange}
            required
          >
            <option value="">Selecione o livro</option>
            {livros.map(l => (
              <option key={l.id_livro} value={l.id_livro}>
                {l.titulo} ({l.disponibilidade} disponíveis)
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button type="submit" variant="primary" className="me-2">
          Registrar
        </Button>
        <Button variant="secondary" onClick={() => navigate('/emprestimos')}>
          Cancelar
        </Button>
      </Form>
    </Container>
  );
}
