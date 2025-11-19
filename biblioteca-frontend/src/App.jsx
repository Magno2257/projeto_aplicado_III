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
        <Route path="/" element={<Login />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/usuarios/cadastro" element={<UsuarioCadastro />} />
        <Route path="/usuarios/cadastro/:id" element={<UsuarioCadastro />} />
        <Route path="/livros" element={<Livros />} />
        <Route path="/livros/cadastro" element={<LivroCadastro />} />
        <Route path="/livros/cadastro/:id" element={<LivroCadastro />} />
        <Route path="/emprestimos" element={<Emprestimos />} />
        <Route path="/emprestimos/cadastro" element={<EmprestimoCadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/multas" element={<Multas />} />
      </Routes>
    </Router>
  );
}

export default App;
