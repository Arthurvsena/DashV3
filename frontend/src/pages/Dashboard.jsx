// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import KpiCard from "../components/dashboard/KpiCard";
import CategoryChart from "../components/charts/CategoryChart";
import SubCategoryChart from "../components/charts/SubCategoryChart";
import MonthlyRevenueChart from "../components/charts/MonthlyRevenueChart";
import Loader from "../components/shared/Loader";
import "./Dashboard.css";

export default function Dashboard({ startDate, endDate }) {
  const navigate = useNavigate();

  const [faturamento, setFaturamento] = useState(null);
  const [frete, setFrete] = useState(null);
  const [devolucao, setDevolucao] = useState(null);
  const [produtosSemVenda, setProdutosSemVenda] = useState(0);
  const [notificacoes] = useState(3);
  const [graficoCategoria, setGraficoCategoria] = useState(null);
  const [graficoSubcategoria, setGraficoSubcategoria] = useState(null);
  const [graficoMarketplace, setGraficoMarketplace] = useState(null);
  const [graficoMensal, setGraficoMensal] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const schema = localStorage.getItem("selectedSchema");

  useEffect(() => {
  const token = localStorage.getItem('token');
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  console.log("📊 DASHBOARD PAYLOAD:", payload);
}, []);

  const fetchData = async () => {
    try {
      setLoading(true);
  
      const headers = {
        Authorization: `Bearer ${token}`,
        "x-schema": schema,
      };
  
      const params = {};
      if (startDate) params.start_date = startDate.toISOString().split("T")[0];
      if (endDate) params.end_date = endDate.toISOString().split("T")[0];
  
      const [dashRes, catRes] = await Promise.all([
        api.get("/dashboard", { headers, params }),
        api.get("/grafico-categorias", { headers, params }),
      ]);
  
      console.log("📦 Dados do Dashboard:", dashRes.data);
  
      setFaturamento(dashRes.data.faturamento);
      setFrete(dashRes.data.frete);
      setDevolucao(dashRes.data.devolucao);
      setProdutosSemVenda(dashRes.data.produtosSemVenda);
      setGraficoCategoria(catRes.data);
      setGraficoMarketplace(dashRes.data.grafico_marketplace);
  
      const graficoMensalData = dashRes.data.grafico_mensal;
      if (graficoMensalData && graficoMensalData.labels?.length > 0) {
        setGraficoMensal({
          labels: graficoMensalData.labels,
          faturamento: graficoMensalData.faturamento,
          ticket_medio: graficoMensalData.ticket_medio,
        });
      } else {
        setGraficoMensal(null);
      }

  
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (token && schema) {
      fetchData();
    } else {
      navigate("/login");
    }
  }, [startDate, endDate, token, schema]);

  const handleCategoriaClick = async (params) => {
    const categoria = params.name;
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "x-schema": schema,
      };

      const queryParams = { categoria };
      if (startDate) queryParams.start_date = startDate.toISOString().split("T")[0];
      if (endDate) queryParams.end_date = endDate.toISOString().split("T")[0];

      const res = await api.get("/grafico-subcategorias", {
        headers,
        params: queryParams,
      });

      setGraficoSubcategoria(res.data);
    } catch (err) {
      console.error("Erro ao carregar subcategorias", err);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-row">
        <KpiCard title="💰 Faturamento" value={faturamento?.valor_atual} sub={`↑ ${faturamento?.indicador || 0}`} color={faturamento?.cor || "text-white"} />
        <KpiCard
          title="🚚 Frete"
          value={frete?.valor_atual || 0}
          sub=""
          color="text-green-500"
          prefix="R$ "
        />
        <KpiCard
          title="🔁 Devoluções"
          value={devolucao?.valor_atual || 0}
          sub={`📦 ${devolucao?.qtd || 0} devoluções`}
          color="text-red-500"
          prefix="R$ "
        />
        <KpiCard title="📦 Produtos Sem Vendas" value={produtosSemVenda} sub="Com estoque > 0" color="text-yellow-400" />
        <KpiCard title="🔔 Notificações" value={notificacoes} sub="Gerencie tarefas" color="text-white" isButton />

      </div>

      <div className="dashboard-graphs">
        <div className="dashboard-column">
          <h3 className="graph-title">📊 Categorias</h3>
          {graficoCategoria && <CategoryChart data={graficoCategoria} onClick={handleCategoriaClick} />}
        </div>

        <div className="dashboard-column">
          <h3 className="graph-title">📁 Subcategorias</h3>
          <SubCategoryChart data={graficoSubcategoria} />
        </div>
      </div>

      <div className="dashboard-full">
        {graficoMensal && <MonthlyRevenueChart data={graficoMensal} marketplaceData={graficoMarketplace} />}
      </div>
    </div>
  );
}
