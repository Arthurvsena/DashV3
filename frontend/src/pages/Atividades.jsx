// src/pages/Atividades.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Atividades.css";

export default function Atividades() {
  const [atividades, setAtividades] = useState([]);
  const [novaAtividade, setNovaAtividade] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [destino, setDestino] = useState("");
  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const schema = payload.schema;
  const usuario = payload.sub;
  const isMaster = payload.tipo === "master";

  useEffect(() => {
    carregarAtividades();
    if (isMaster) carregarUsuarios();
  }, []);

  const carregarAtividades = () => {
    api.get("/atividades", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    }).then(res => setAtividades(res.data));
  };

  const carregarUsuarios = () => {
    api.get("/usuarios", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    }).then(res => setUsuarios(res.data));
  };

  const delegar = () => {
    if (!novaAtividade || !destino) return;
    api.post("/atividades", {
      descricao: novaAtividade,
      usuario_destino: destino
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    }).then(() => {
      setNovaAtividade("");
      setDestino("");
      carregarAtividades();
    });
  };

  const alterarStatus = (id, status) => {
    api.put(`/atividades/${id}/status`, { status }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    }).then(() => carregarAtividades());
  };

  return (
    <div className="atividade-container">
      <h1>Atividades</h1>

      {isMaster && (
        <div className="delegar-box">
          <textarea
            placeholder="Descreva a atividade..."
            value={novaAtividade}
            onChange={e => setNovaAtividade(e.target.value)}
          />
          <select value={destino} onChange={e => setDestino(e.target.value)}>
            <option value="">Selecione o destinatário</option>
            {usuarios.map(u => <option key={u.id} value={u.usuario}>{u.usuario}</option>)}
          </select>
          <button onClick={delegar}>Delegar</button>
        </div>
      )}

      <div className="lista-atividades">
        {atividades.map((a, i) => (
          <div key={i} className="atividade-card">
            <p><strong>{a.descricao}</strong></p>
            <p>Status: <span className="status-tag">{a.status}</span></p>
            <p>Para: {a.usuario_destino}</p>
            <div className="acoes">
              {!isMaster && (
                <>
                  {a.status === "pendente" && (
                    <button onClick={() => alterarStatus(a.id, "em_execucao")}>Iniciar</button>
                  )}
                  {a.status === "em_execucao" && (
                    <>
                      <button onClick={() => alterarStatus(a.id, "pausada")}>Pausar</button>
                      <button onClick={() => alterarStatus(a.id, "finalizada")}>Finalizar</button>
                    </>
                  )}
                  {a.status === "pausada" && (
                    <button onClick={() => alterarStatus(a.id, "em_execucao")}>Retomar</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}