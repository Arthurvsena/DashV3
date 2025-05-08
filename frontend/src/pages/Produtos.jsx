import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useOutletContext } from "react-router-dom";
import "./Produtos.css";
import CurvaABC from "../components/charts/CurvaAbc";
import ReactECharts from "echarts-for-react";
import geoJson from "../data/brazil-states.json";
import MapaFaturamento from "../components/charts/MapaFaturamento";
import * as echarts from "echarts";

echarts.registerMap("brazil", geoJson);

const Produtos = () => {
  const { startDate, endDate } = useOutletContext();
  const [produtos, setProdutos] = useState([]);
  const [produtoCampeao, setProdutoCampeao] = useState("-");
  const [faturamentoProduto, setFaturamentoProduto] = useState(0);
  const [maisDevolvido, setMaisDevolvido] = useState("-");
  const [qtdDevolucao, setQtdDevolucao] = useState(0);
  const [totalVendidos, setTotalVendidos] = useState(0);
  const [produtosSemVenda, setProdutosSemVenda] = useState(0);
  const [capitalInvestido, setCapitalInvestido] = useState(0);
  const [potencialRetorno, setPotencialRetorno] = useState(0);
  const [mapaData, setMapaData] = useState([]);
  const [dadosAbc, setDadosAbc] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [tipoCurva, setTipoCurva] = useState("sku");
  const [marcaSelecionada, setMarcaSelecionada] = useState("Todas");
  const [marcasDisponiveis, setMarcasDisponiveis] = useState([]);

  const token = localStorage.getItem("token");
  const schema = localStorage.getItem("selectedSchema");

  const headers = {
    Authorization: `Bearer ${token}`,
    "x-schema": schema,
  };

  const carregarCurvaAbc = async () => {
    if (!startDate || !endDate) return;
  
    const start_date = startDate.toISOString().split("T")[0];
    const end_date = endDate.toISOString().split("T")[0];
  
    try {
      const response = await api.get(
        `/api/curva-abc?start_date=${start_date}&end_date=${end_date}&tipo=${tipoCurva}&marca=${marcaSelecionada === "Todas" ? "" : marcaSelecionada}`,
        { headers }
      );
      setDadosAbc(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Erro ao carregar Curva ABC:", err);
      setDadosAbc([]);
    }
  };

  const carregarDados = async () => {
    if (!startDate || !endDate) {
      console.warn("⛔ Datas ainda não definidas.");
      return;
    }

    const start_date = startDate.toISOString().split("T")[0];
    const end_date = endDate.toISOString().split("T")[0];

    try {
      setLoading(true);

      const [
        campeao,
        abc,
        devolvido,
        vendidos,
        semVenda,
        listaProdutos,
        estados,
      ] = await Promise.all([
        api.get(`/api/produto-campeao?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(
          `/api/curva-abc?start_date=${start_date}&end_date=${end_date}&tipo=${tipoCurva}&marca=${marcaSelecionada === "Todas" ? "" : marcaSelecionada}`,
          { headers }
        ),
        api.get(`/api/produto-mais-devolvido?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/total-vendidos?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/sem-venda?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/produtos?status=${statusFiltro}&start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/faturamento-por-estado?start_date=${start_date}&end_date=${end_date}`, { headers }),
      ]);

      setProdutoCampeao(campeao.data?.nome || "-");
      setFaturamentoProduto(campeao.data?.total || 0);
      setMaisDevolvido(devolvido.data?.nome || "-");
      setQtdDevolucao(devolvido.data?.qtd || 0);
      setTotalVendidos(vendidos.data?.total || 0);
      setProdutosSemVenda(semVenda.data?.total || 0);
      setProdutos(listaProdutos.data || []);
      const estadosMap = {
        AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas",
        BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
        GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
        MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
        PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
        RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
        SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
      };
      
      setMapaData(
        (estados.data || []).map((e) => ({
          name: estadosMap[e.estado] || e.estado,
          value: Number(e.valor) || 0
        }))
      );
      setDadosAbc(Array.isArray(abc.data) ? abc.data : []);
      

      let capital = 0;
      let retorno = 0;
      (listaProdutos.data || []).forEach((p) => {
        capital += p.estoque * (p.preco_custo_medio || 0);
        retorno += p.estoque * p.preco;
      });

      setCapitalInvestido(capital);
      setPotencialRetorno(retorno);
    } catch (err) {
      console.error("🔥 Erro ao buscar dados dos produtos:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [statusFiltro, startDate, endDate]);

  useEffect(() => {
    api.get("/api/marcas", { headers }).then((res) => {
      setMarcasDisponiveis(["Todas", ...res.data]);
    });
  }, []);

  useEffect(() => {
  carregarCurvaAbc();
}, [tipoCurva, marcaSelecionada, startDate, endDate]);

  if (loading) return <div className="text-white">🔄 Carregando dados...</div>;

  const mapaOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: R$ {c}"
    },
    visualMap: {
      min: 0,
      max: Math.max(...mapaData.map(e => e.valor || 0), 100),
      left: "left",
      bottom: "0",
      text: ["Alto", "Baixo"],
      inRange: {
        color: ["#e0f3f8", "#0077b6"]
      },
      calculable: true,
      textStyle: { color: "#fff" }
    },
    series: [
      {
        name: "Faturamento",
        type: "map",
        map: "brazil",
        roam: true,
        emphasis: {
          label: { show: true },
          itemStyle: { areaColor: "#f2d5ad" }
        },
        data: mapaData
      }
    ]
  };

  return (
    <div className="dashboard-container">
      <h1 className="text-3xl">📦 Produtos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="🏆 Produto Campeão de Vendas" value={produtoCampeao} extra={`R$ ${faturamentoProduto.toFixed(2)}`} />
        <Card title="📥 Produto Mais Devolvido" value={maisDevolvido} extra={`${qtdDevolucao} devoluções`} />
        <Card title="📦 Produtos Vendidos" value={`${totalVendidos} vendidos`} />
        <Card title="⛔ Produtos Sem Venda" value={`${produtosSemVenda} produtos`} />
        <Card title="🏦 Capital Investido" value={`R$ ${capitalInvestido.toFixed(2)}`} />
        <Card title="📈 Potencial de Retorno" value={`R$ ${potencialRetorno.toFixed(2)}`} />
      </div>

      <div className="graficos-container">
      <div className="grafico-curva">
      <div className="flex gap-4 mb-4">
      <h1>Curva ABC</h1>
      <h4>Filtre o grafico através das opções abaixo:</h4>
      <select value={tipoCurva} onChange={(e) => setTipoCurva(e.target.value)}>
        <option value="sku">Por SKU</option>
        <option value="pai">Por Produto Pai</option>
        <option value="marca">Por Marca</option>
      </select>

      {tipoCurva === "marca" && (
        <select value={marcaSelecionada} onChange={(e) => setMarcaSelecionada(e.target.value)}>
          {marcasDisponiveis.map((m, idx) => (
            <option key={idx} value={m}>{m}</option>
          ))}
        </select>
      )}
    </div>
        <CurvaABC data={dadosAbc} />
      </div>
      <div className="grafico-mapa">
        <h2 className="graph-title">🗺️ Faturamento por Estado</h2>
        {mapaData.length > 0 ? (
          <MapaFaturamento data={mapaData} />
        ) : (
          <p className="text-white mt-4">⏳ Carregando mapa ou sem dados para exibir.</p>
        )}
      </div>
    </div>

      <div className="table-container">
        <h2 className="graph-title">📄 Lista de Produtos</h2>
        <div className="flex gap-4 mb-4">
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Vendidos">Vendidos</option>
            <option value="Sem Venda">Sem Venda</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nome</th>
              <th>Estoque</th>
              <th>Preço</th>
              <th>CMV</th>
              <th>Lucro</th>
              <th>Sugestão</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p, i) => (
              <tr key={i}>
                <td>{p.codigo}</td>
                <td>{p.nome}</td>
                <td>{p.estoque}</td>
                <td>R$ {p.preco}</td>
                <td>{p.preco_custo_medio ? `R$ ${p.preco_custo_medio}` : "-"}</td>
                <td>-</td>
                <td>{p.preco_custo_medio ? `R$ ${(p.preco_custo_medio * 2.6).toFixed(2)}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Card = ({ title, value, extra }) => (
  <div className="card">
    <h2>{title}</h2>
    <h3>{value}</h3>
    {extra && <p>{extra}</p>}
  </div>
);

export default Produtos;
