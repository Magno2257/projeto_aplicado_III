import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold text-white" to="/">Biblioteca</Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="#navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/usuarios">Usuários</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/livros">Livros</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/emprestimos">Empréstimos</Link>
            </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/relatorios">Relatórios</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/multas">Multas</Link>
                </li>

            <li className="nav-item">
              {user ? (
                <button className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>Sair</button>
              ) : (
                <Link className="btn btn-light btn-sm ms-2" to="/login">Entrar</Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
