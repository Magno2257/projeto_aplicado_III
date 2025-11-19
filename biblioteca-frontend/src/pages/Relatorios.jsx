import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Relatorios() {
  const [dados, setDados] = useState({ emprestimos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/emprestimos-detalhados');
        setDados({ emprestimos: res.data || [] });
      } catch (err) {
        // Se backend não estiver disponível, usa mock vazio
        setDados({ emprestimos: [] });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="container">Carregando relatório...</div>;

  const total = dados.emprestimos.length;

  // Top livros por quantidade
  const counts = {};
  dados.emprestimos.forEach(e => {
    const livro = e.titulo || e.livro?.titulo || e.livroNome || 'Desconhecido';
    counts[livro] = (counts[livro] || 0) + 1;
  });

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="container">
      <h3>Relatórios</h3>
      <div className="card my-3 p-3">
        <p><strong>Total de empréstimos:</strong> {total}</p>
        <div>
          <strong>Livros mais emprestados:</strong>
          <ul>
            {top.map(([titulo, qtd]) => (
              <li key={titulo}>{titulo} — {qtd}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
