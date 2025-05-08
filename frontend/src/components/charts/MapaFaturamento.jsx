import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import brazilGeo from "../../data/brazil-states.json";

export default function MapaFaturamento({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    echarts.registerMap("brazil", brazilGeo);
    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: "item",
        formatter: "{b}: R$ {c}",
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((e) => e.value), 100),
        left: "left",
        bottom: "0",
        text: ["Alto", "Baixo"],
        inRange: {
          color: ["#e0f3f8", "#0077b6"],
        },
        calculable: true,
        textStyle: {
          color: "#fff",
        },
      },
      series: [
        {
          name: "Faturamento por Estado",
          type: "map",
          map: "brazil",
          roam: true,
          emphasis: {
            label: { show: true },
            itemStyle: { areaColor: "#f2d5ad" },
          },
          data,
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
