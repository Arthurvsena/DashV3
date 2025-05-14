import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      console.log("🟢 TOKEN:", token);

      if (!token) {
        console.warn("❌ Nenhum token encontrado");
        setAutenticado(false);
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("🔍 PAYLOAD DECODIFICADO:", payload);

      const rotaAtual = location.pathname;

      // ❗ Para rotas que exigem schema
      const rotaPrecisaDeSchema = [
        "/dashboard", "/produtos", "/calculadora"
      ].some((rota) => rotaAtual.startsWith(rota));

      if (payload?.sub && (!rotaPrecisaDeSchema || payload?.schema)) {
        setAutenticado(true);
      } else {
        console.warn("⚠️ Token sem sub ou schema necessário para esta rota");
        setAutenticado(false);
      }
    } catch (err) {
      console.error("💥 Erro ao verificar token:", err);
      setAutenticado(false);
    } finally {
      setLoading(false);
    }
  }, [location.pathname]);

  if (loading) return null;
  if (!autenticado) return <Navigate to="/login" replace />;
  return children;
}
