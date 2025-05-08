import React from "react";
import ReactECharts from "echarts-for-react";

export default function CurvaABC({ data }) {
  console.log("📊 Dados recebidos na Curva ABC:", data);
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠️ Dados inválidos para Curva ABC:", data);
    return <p className="text-white">⚠️ Nenhum dado para exibir no gráfico.</p>;
  }

  const nomes = data.map((item) => item.nome || item.descricao ||"Desconhecido");
  const faturamento = data.map((item) => item.faturamento || 0);
  const acumulado = data.map((item) => item.percentual_acumulado || 0);

  const option = {
    backgroundColor: "#1e1e2f",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      backgroundColor: "#2a2a3c",
      formatter: (params) => {
        const nome = params[0].name;
        const valor = params[0].value;
        const perc = params[1].value;
        return `${nome}<br/>Faturamento: R$ ${valor.toLocaleString("pt-BR")}<br/>% Acumulado: ${perc.toFixed(2)}%`;
      },
    },
    legend: {
      data: ["Faturamento", "% Acumulado"],
      textStyle: { color: "#fff" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        data: nomes,
        axisLabel: {
          rotate: 45,
          color: "#fff",
          fontSize: 10,
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "Faturamento",
        position: "left",
        axisLabel: { color: "#fff" },
      },
      {
        type: "value",
        name: "% Acumulado",
        position: "right",
        axisLabel: { color: "#fff" },
        max: 100,
      },
    ],
    series: [
      {
        name: "Faturamento",
        type: "bar",
        data: faturamento,
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "% Acumulado",
        type: "line",
        yAxisIndex: 1,
        data: acumulado,
        smooth: true,
        itemStyle: { color: "#22c55e" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "400px", width: "100%" }} />;
}
