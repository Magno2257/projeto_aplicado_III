import { useState, useEffect } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function UsuarioCadastro() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    tipo_usuario: 'aluno',
  });

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      api.get(`/usuarios/${id}`)
        .then(res => setFormData(res.data))
        .catch(err => console.error('Erro ao carregar usuário:', err));
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // limpar erros ao digitar
    if (e.target.name === 'cpf') setCpfError('');
    if (e.target.name === 'email') setEmailError('');
  };

  // Função para validar CPF (versão robusta)
  const validarCPF = (cpf) => {
    if (cpf === null || cpf === undefined) return false;
    cpf = String(cpf).replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += Number(cpf[i]) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += Number(cpf[i]) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === Number(cpf[10]);
  };

  // Estado para mensagens de erro de validação
  const [cpfError, setCpfError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validarEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasError = false;
    if (!validarCPF(formData.cpf)) {
      setCpfError('CPF inválido. Verifique os dígitos e a formatação.');
      hasError = true;
    }
    if (!validarEmail(formData.email)) {
      setEmailError('E-mail inválido');
      hasError = true;
    }
    if (hasError) return;

    try {
      if (id) {
        await api.put(`/usuarios/${id}`, formData);
        alert('Usuário atualizado com sucesso!');
      } else {
        await api.post('/usuarios', formData);
        alert('Usuário cadastrado com sucesso!');
      }
      navigate('/usuarios');
    } catch (err) {
      alert('Erro ao salvar usuário');
      console.error(err);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">{id ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</h2>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nome completo</Form.Label>
          <Form.Control
            type="text"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>CPF</Form.Label>
          <Form.Control
            type="text"
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            isInvalid={!!cpfError}
            placeholder="Digite somente números ou formatado (ex: 000.000.000-00)"
            required
          />
          <Form.Control.Feedback type="invalid">{cpfError}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>E-mail</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            isInvalid={!!emailError}
            required
          />
          <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Endereço</Form.Label>
          <Form.Control
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Tipo de Usuário</Form.Label>
          <Form.Select
            name="tipo_usuario"
            value={formData.tipo_usuario}
            onChange={handleChange}
          >
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
            <option value="técnico">Técnico</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit" className="me-2">
          {id ? 'Salvar Alterações' : 'Cadastrar'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/usuarios')}>
          Cancelar
        </Button>
      </Form>
    </Container>
  );
}
