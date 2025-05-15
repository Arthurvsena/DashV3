// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import SelectSchema from "./pages/SelectSchema";
import LayoutPrivate from "./components/layout/LayoutPrivate";
import Produtos from "./pages/Produtos";
import Calculadora from './pages/Calculadora';
import Home from "./pages/Home";
import Config from './pages/Config';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/select-schema"
          element={
            <ProtectedRoute>
              <SelectSchema />
            </ProtectedRoute>
          }
        />
        <Route
          path="/config"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Config />} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>

              <LayoutPrivate showDateFilter={true} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/produtos"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={true} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Produtos />} />
        </Route>

        <Route
          path="/vendas"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={true}>
                <div>💳 Página Vendas (em construção)</div>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificacoes"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <div>🔔 Página Notificações</div>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <div>👤 Página Perfil</div>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LayoutPrivate />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
        </Route>
        <Route
          path="/calculadora"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Calculadora />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
