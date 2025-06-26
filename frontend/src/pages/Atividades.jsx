import { useEffect, useState } from "react";
import api from "../services/api";
import "./Atividades.css";

export default function Atividades() {
  const [atividades, setAtividades] = useState([]);
  const [novaAtividade, setNovaAtividade] = useState("");
  const [prazo, setPrazo] = useState(1);
  const [destino, setDestino] = useState("");
  const [marketplace, setMarketplace] = useState("Mercado Livre");
  const [usuarios, setUsuarios] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("em andamento");

  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const schema = payload.schema;
  const usuario = payload.sub;
  const isMaster = payload.is_master === true;


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
    })
      .then((res) => {
        console.log("✅ Atividades recebidas ===>", res.data);
        setAtividades(res.data);
      })
      .catch((err) => {
        console.error("❌ Erro ao buscar atividades:", err);
      });
  };

  const carregarUsuarios = () => {
    api.get("/usuarios", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    }).then((res) => setUsuarios(res.data));
  };

  const delegar = () => {
    if (!novaAtividade.trim()) {
      alert("A descrição da atividade é obrigatória.");
      return;
    }
    if (!destino) {
      alert("Selecione o funcionário.");
      return;
    }
    if (!marketplace) {
      alert("Selecione o marketplace.");
      return;
    }

    api.post("/atividades", {
      descricao: novaAtividade,
      usuario_destino: destino,
      prazo_dias: prazo,
      marketplace: marketplace,
      status: "backlog" // obrigatório!
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    }).then(() => {
      setNovaAtividade("");
      setDestino("");
      setPrazo(1);
      carregarAtividades();
      alert("Atividade delegada com sucesso!");
    }).catch((err) => {
      console.error("❌ Erro ao delegar atividade:", err);
      alert("Erro ao delegar atividade.");
    });
  };

  const excluirAtividade = (id) => {
    if (!window.confirm("Deseja realmente excluir esta atividade?")) return;

    api.delete(`/atividades/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-schema": schema
      }
    })
      .then(() => {
        carregarAtividades(); // atualiza a lista depois da exclusão
      })
      .catch((err) => {
        console.error("Erro ao excluir atividade:", err);
        alert("Erro ao excluir atividade.");
      });
  };

  const abas = [
    "backlog",
    "em andamento",
    "pausada",
    "finalizada",
    "atrasada"
  ];

  console.log("🚀 Atividades recebidas:", atividades);


  return (
    <div className="atividade-container">
      <div className="wrapper">
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Atividades</h1>

        <div className="abas-status">
          {abas.map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={abaAtiva === aba ? "aba ativa" : "aba"}
            >
              {aba.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="tabela-container">
          <table className="tabela-atividades">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Status</th>
                <th>Funcionário</th>
                <th>Prazo</th>
                <th>Marketplace</th>
                {!isMaster && <th>Ações</th>}
                {isMaster && <th></th>}

              </tr>
            </thead>
            <tbody>
              {atividades
                .filter((a) => (a.status || "").toLowerCase().includes(abaAtiva))
                .map((a, index) => (
                  <tr key={a.id || index}>
                    <td><strong>{a.descricao}</strong></td>
                    <td style={{ color: "#a78bfa", fontWeight: "bold" }}>{a.status}</td>
                    <td>{a.usuario_destino}</td>
                    <td>{a.prazo_dias ?? "N/A"} dias</td>
                    <td>{a.marketplace}</td>
                    {isMaster && (
                      <td>
                        <button
                          onClick={() => excluirAtividade(a.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#f87171",
                            fontSize: "16px",
                            cursor: "pointer"
                          }}
                          title="Excluir atividade"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                    {!isMaster && (
                      <td>
                        {a.status === "backlog" && (
                          <button onClick={() => alterarStatus(a.id, "em andamento")}>Iniciar</button>
                        )}
                        {a.status === "em andamento" && (
                          <>
                            <button onClick={() => alterarStatus(a.id, "pausada")}>Pausar</button>
                            <button onClick={() => alterarStatus(a.id, "finalizada")}>Finalizar</button>
                          </>
                        )}
                        {a.status === "pausada" && (
                          <button onClick={() => alterarStatus(a.id, "em andamento")}>Retomar</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {isMaster && (
          <>
            <h2 style={{ textAlign: 'center', marginTop: '20px', marginBottom: '10px' }}>
              Delegar Atividade
            </h2>
            <div className="footer-form">
              <div className="campo">
                <label>Descrição</label>
                <textarea
                  placeholder="Descreva a atividade..."
                  value={novaAtividade}
                  onChange={(e) => setNovaAtividade(e.target.value)}
                />
              </div>
              <div className="campo">
                <label>Prazo (dias)</label>
                <input
                  type="number"
                  min={1}
                  value={prazo}
                  onChange={(e) => setPrazo(Number(e.target.value))}
                />
              </div>
              <div className="campo">
                <label>Marketplace</label>
                <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
                  <option>Mercado Livre</option>
                  <option>Amazon</option>
                  <option>Magalu</option>
                  <option>Shopee</option>
                  <option>Netshoes</option>
                </select>
              </div>
              <div className="campo">
                <label>Funcionário</label>
                <select value={destino} onChange={(e) => setDestino(e.target.value)}>
                  <option value="">Funcionário</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.usuario}>{u.usuario}</option>
                  ))}
                </select>
              </div>
              <button onClick={delegar}>Delegar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
};
