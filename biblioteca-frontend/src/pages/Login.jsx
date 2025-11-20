import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email || !senha) {
      setError('Preencha e-mail e senha para entrar.');
      return;
    }

    try {
      // Tenta autenticar no backend
      const res = await api.post('/auth/login', { email, senha });
      const token = res.data?.token;
      const user = res.data?.user;
      if (!token) {
        setError('Resposta inválida do servidor ao autenticar');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user || { email }));
      // Após login, ir direto para a lista de livros
      navigate('/livros');
    } catch (err) {
      // Mostrar mensagem do backend quando disponível
      const status = err?.response?.status;
      // Prioriza mostrar 'Senha Incorreta' quando o servidor retornar 401
      if (status === 401) {
        setError('E-mail ou Senha Incorreta');
      } else {
        const serverMsg = err?.response?.data?.error;
        if (serverMsg) {
          setError(serverMsg);
        } else {
          setError('Erro ao conectar com o servidor. Tente novamente.');
        }
      }
      console.error('Login error:', err?.response || err);
    }
  }

  return (
    <div className="container">
      <div className="text-center mt-5 mb-3">
        <h1 className="fw-bold">Bem-vindo ao Sistema de Biblioteca</h1>
      </div>

      <div className="card auth-card mx-auto">
        <h3 className="mb-3">Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label">E-mail</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>

          <div className="mb-2">
            <label className="form-label">Senha</label>
            <input type="password" className="form-control" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Sua senha" required />
          </div>

          <div className="mb-3 text-muted small">
            Já tem cadastro? Faça login com e-mail e senha. <br />
            Ainda não tem cadastro? <Link to="/usuarios/cadastro">Cadastre-se aqui</Link>.
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="d-flex justify-content-end">
            <button className="btn btn-primary">Entrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
