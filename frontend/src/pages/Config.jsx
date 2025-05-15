// src/pages/Config.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Config.css";

export default function Config() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [schema, setSchema] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tokenTiny, setTokenTiny] = useState("");
  const [novoUsuario, setNovoUsuario] = useState({ nome: "", email: "", usuario: "", senha: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const activeSchema = payload?.schema;
    setSchema(activeSchema);

    if (activeSchema) {
      api.get("/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-schema": activeSchema,
        },
      })
        .then((res) => setUsuarios(res.data))
        .catch((err) => console.error("Erro ao buscar usuarios:", err));
    }
  }, []);

  const handleTokenSubmit = () => {
    localStorage.setItem("tokenTiny", tokenTiny);
    setShowModal(false);
  };

  const handleCreateUser = () => {
    const token = localStorage.getItem("token");
    api.post("/usuarios", novoUsuario, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema,
      },
    })
      .then(() => {
        setShowCreateModal(false);
        setNovoUsuario({ nome: "", email: "", usuario: "", senha: "" });
        return api.get("/usuarios", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-schema": schema,
          },
        });
      })
      .then((res) => setUsuarios(res.data))
      .catch((err) => console.error("Erro ao criar usuario:", err));
  };

  return (
    <div className="config-container">
      <h1>Configurações</h1>

      <div className="config-grid">
        <div className="config-card plano">
          <h2>Seu Plano:</h2>
          <h3>Help Dash +</h3>
          <p className="preco">R$ 389,90 <span>Mensal</span></p>
          <p><span className="verde">Otimize</span> o seu negocio!<br />Conheça todos os planos</p>
          <button className="btn-upgrade">Fazer UpGrade!</button>
        </div>

        <div className="config-card usuarios">
          <h2>Usuarios:</h2>
          <table className="user-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Senha</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.usuario}</td>
                  <td>{u.email}</td>
                  <td>*****</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-cadastrar" onClick={() => setShowCreateModal(true)}>Cadastrar +</button>
        </div>

        <div className="config-card empresa">
          <h2>Dados da empresa</h2>
          <p>Altere aqui suas despesas, custos fixos e +!</p>
        </div>

        <div className="config-card">
          <div className="button-row">
            <h1>Mais utilidades</h1>
            <button className="btn-upgrade" onClick={() => navigate("/select-schema")}>🔁 Alterar empresa</button>
            <button className="btn-upgrade" onClick={() => setShowModal(true)}>🧬 Token de acesso</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Token Tiny</h3>
            <input
              type="text"
              placeholder="Cole seu token aqui"
              value={tokenTiny}
              onChange={(e) => setTokenTiny(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleTokenSubmit}>Salvar</button>
              <button className="btn-danger" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Novo Usuário</h3>
            <input type="text" placeholder="Nome" value={novoUsuario.nome} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} />
            <input type="email" placeholder="Email" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} />
            <input type="text" placeholder="Usuário" value={novoUsuario.usuario} onChange={(e) => setNovoUsuario({ ...novoUsuario, usuario: e.target.value })} />
            <input type="password" placeholder="Senha" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })} />
            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleCreateUser}>Salvar</button>
              <button className="btn-danger" onClick={() => setShowCreateModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}