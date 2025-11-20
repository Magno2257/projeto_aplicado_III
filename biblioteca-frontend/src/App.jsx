import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Usuarios from "./pages/Usuarios";
import UsuarioCadastro from "./pages/UsuarioCadastro";
import Livros from "./pages/Livros";
import LivroCadastro from "./pages/LivroCadastro";
import Emprestimos from "./pages/Emprestimos";
import EmprestimoCadastro from "./pages/EmprestimoCadastro";
import Login from "./pages/Login";
import Relatorios from "./pages/Relatorios";
import Multas from "./pages/Multas";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/usuarios/cadastro" element={<UsuarioCadastro />} />

        {/* Rotas protegidas - requerem login */}
        <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/usuarios/cadastro/:id" element={<ProtectedRoute><UsuarioCadastro /></ProtectedRoute>} />
        <Route path="/livros" element={<ProtectedRoute><Livros /></ProtectedRoute>} />
        <Route path="/livros/cadastro" element={<ProtectedRoute><LivroCadastro /></ProtectedRoute>} />
        <Route path="/livros/cadastro/:id" element={<ProtectedRoute><LivroCadastro /></ProtectedRoute>} />
        <Route path="/emprestimos" element={<ProtectedRoute><Emprestimos /></ProtectedRoute>} />
        <Route path="/emprestimos/cadastro" element={<ProtectedRoute><EmprestimoCadastro /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
        <Route path="/multas" element={<ProtectedRoute><Multas /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
