// src/components/shared/NotificationBell.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";


export default function NotificationBell() {
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const schema = payload.schema;

    api.get("/notificacoes/nao-lidas", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    })
    .then((res) => setNotificacoes(res.data))
    .catch((err) => console.error("Erro ao buscar notificações:", err));
  }, []);

  return (
    <div
      className="notification-wrapper"
      title="Notificações"
      onClick={() => navigate("/atividades")}
    >
      <i className="fas fa-bell notification-icon"></i>
      {notificacoes.length > 0 && (
        <span className="notification-badge">{notificacoes.length}</span>
      )}
      <div className="notification-popup">
        {notificacoes.length === 0 ? (
          <p className="notification-item">Nenhuma notificação</p>
        ) : (
          notificacoes.slice(0, 5).map((n, i) => (
            <div key={i} className="notification-item">
              {n.descricao}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
