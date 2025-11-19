import { useEffect, useState } from 'react';
import api from '../services/api';

const TAXA_DIARIA = 1.5; // valor por dia atrasado

function diasAtraso(dataPrevista, dataDevolucao) {
  const hoje = dataDevolucao ? new Date(dataDevolucao) : new Date();
  const prevista = new Date(dataPrevista);
  const diff = Math.floor((hoje - prevista) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function Multas() {
  const [emprestimos, setEmprestimos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/multas');
        setEmprestimos(res.data || []);
      } catch (err) {
        // Se 401 (não autorizado), tentar buscar dados públicos e calcular multas localmente
        const status = err?.response?.status;
        if (status === 401) {
          try {
            const res2 = await api.get('/emprestimos-detalhados');
            // Mapear para formato esperado pelo componente
            const data = (res2.data || []).map(r => ({
              id_emprestimo: r.id_emprestimo || r.id_emprestimo,
              usuario: r.usuario || { nome_completo: r.nome_completo || r.usuarioNome },
              livro: r.livro || { titulo: r.titulo || r.livroNome },
              data_prevista: r.data_prevista || r.dataPrevista,
              data_devolucao: r.data_devolucao || r.dataDevolucao,
              dias_atraso: r.dias_atraso ?? null,
              valor: null,
              multa_paga: false,
            }));
            setEmprestimos(data);
          } catch (err2) {
            setEmprestimos([]);
          }
        } else {
          setEmprestimos([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function marcarPago(index) {
    const item = emprestimos[index];
    if (!item) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Faça login para marcar a multa como paga.');
      return;
    }

    api.post(`/multas/${item.id_emprestimo}/pagar`).then(() => {
      setEmprestimos(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], multa_paga: true };
        return copy;
      });
    }).catch(() => {
      alert('Erro ao marcar multa como paga.');
    });
  }

  if (loading) return <div className="container">Carregando multas...</div>;

  const multas = emprestimos
    .map((e, idx) => {
      const dias = e.dias_atraso ?? diasAtraso(e.data_prevista || e.dataPrevista, e.data_devolucao || e.dataDevolucao);
      const valor = e.valor ?? (dias * TAXA_DIARIA);
      return { e, idx, dias, valor };
    })
    .filter(item => item.valor > 0);

  return (
    <div className="container">
      <h3>Gestão de Multas</h3>
      <div className="card my-3 p-3">
        {multas.length === 0 && <p>Nenhuma multa encontrada.</p>}
        {multas.map(({ e, idx, dias, valor }) => (
          <div key={idx} className="multas-item d-flex justify-content-between align-items-center mb-2">
            <div>
              <div><strong>Usuário:</strong> {e.usuario?.nome_completo || e.nome_completo || e.usuarioNome || 'Desconhecido'}</div>
              <div><strong>Livro:</strong> {e.livro?.titulo || e.titulo || e.livroNome || 'Desconhecido'}</div>
              <div><strong>Dias atrasados:</strong> {Math.round(dias)}</div>
            </div>
            <div className="text-end">
              <div className="mb-2"><strong>Valor:</strong> R$ {valor.toFixed(2)}</div>
              {e.multa_paga || e.multaPaga || e.multaPago ? (
                <span className="badge bg-success">Paga</span>
              ) : (
                <button className="btn btn-sm btn-primary" onClick={() => marcarPago(idx)}>Marcar como paga</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
