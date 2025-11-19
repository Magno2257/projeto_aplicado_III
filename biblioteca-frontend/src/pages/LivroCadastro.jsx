import { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function LivroCadastro() {
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    edicao: '',
    tipo_de_material: 'livro',
    numero_exemplares: 1,
    categoria: 'romance',
  });

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      api.get(`/livros/${id}`)
        .then(res => setFormData(res.data))
        .catch(err => console.error('Erro ao carregar livro:', err));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numero_exemplares' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/livros/${id}`, formData);
        alert('Livro atualizado!');
      } else {
        await api.post('/livros', formData);
        alert('Livro cadastrado!');
      }
      navigate('/livros');
    } catch (err) {
      alert('Erro ao salvar livro.');
      console.error(err);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">{id ? 'Editar Livro' : 'Cadastrar Livro'}</h2>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Título</Form.Label>
          <Form.Control
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Autor</Form.Label>
          <Form.Control
            type="text"
            name="autor"
            value={formData.autor}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Edição</Form.Label>
          <Form.Control
            type="text"
            name="edicao"
            value={formData.edicao}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Nº de Exemplares</Form.Label>
          <Form.Control
            type="number"
            name="numero_exemplares"
            min={1}
            value={formData.numero_exemplares}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Tipo de Material</Form.Label>
          <Form.Select
            name="tipo_de_material"
            value={formData.tipo_de_material}
            onChange={handleChange}
          >
            <option value="livro">Livro</option>
            <option value="periódico">Periódico</option>
            <option value="tese">Tese</option>
            <option value="dissertação">Dissertação</option>
            <option value="audiovisual">Audiovisual</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Categoria</Form.Label>
          <Form.Select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
          >
            <option value="romance">Romance</option>
            <option value="poesia">Poesia</option>
            <option value="ciências humanas">Ciências Humanas</option>
          </Form.Select>
        </Form.Group>

        <Button type="submit" variant="primary" className="me-2">
          {id ? 'Salvar Alterações' : 'Cadastrar'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/livros')}>
          Cancelar
        </Button>
      </Form>
    </Container>
  );
}
