import React from "react";
import ReactECharts from "echarts-for-react";

export default function CurvaABC({ data, tipo }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-white">⚠️ Nenhum dado para exibir no gráfico.</p>;
  }

  const nomes = data.map((item) => item.nome || "Desconhecido");
  const acumulado = data.map((item) => item.percentual_acumulado || 0);

  const coresPorClasse = {
    A: "#3b82f6", // azul
    B: "#facc15", // amarelo
    C: "#ef4444", // vermelho
  };

  const faturamentoData = data.map((item) => ({
    name: item.nome || "Desconhecido",
    value: item.faturamento || 0,
    itemStyle: {
      color: coresPorClasse[item.classe_abc] || "#999",
    },
  }));

  const option = {
    backgroundColor: "#1e1e2f",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      backgroundColor: "#2a2a3c",
      textStyle: { color: "#fff" },
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
      bottom: "20%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        data: nomes,
        axisLabel: {
          interval: 0,
          rotate: nomes.length > 10 ? 45 : 0,
          color: "#fff",
          fontSize: 10,
          formatter: (value) =>
            value.length > 20 ? value.slice(0, 20) + "..." : value,
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
    dataZoom:
      tipo === "sku"
        ? [
            {
              type: "slider",
              startValue: 0,
              endValue: 19, // mostra no máximo 20 SKUs
              bottom: 0,
              textStyle: { color: "#fff" },
            },
          ]
        : [],
    series: [
      {
        name: "Faturamento",
        type: "bar",
        data: faturamentoData,
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

  return (
    <ReactECharts
      option={option}
      style={{ height: "400px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
