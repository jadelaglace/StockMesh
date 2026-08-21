import { echarts } from "../charts";
import { useEffect, useRef } from "react";
import type { WorkbenchPartyScorecard } from "../../../src/workbench/types";

export function ScoreView({ scorecards, label = "Selected branch" }: { scorecards: WorkbenchPartyScorecard[]; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || scorecards.length === 0) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    const dimensions = scorecards[0]?.dimensions.map((item) => item.label) ?? [];
    chart.setOption({
      animation: false,
      legend: { bottom: 0, textStyle: { color: "#5d6961", fontSize: 10 } },
      grid: { top: 8, right: 14, bottom: 42, left: 96 },
      xAxis: { type: "value", min: 0, max: 1, axisLabel: { color: "#677269" }, splitLine: { lineStyle: { color: "#e5e8e5" } } },
      yAxis: { type: "category", data: dimensions, axisLabel: { color: "#334239" } },
      series: scorecards.map((card, index) => ({ name: card.partyNodeId.replace("node-syn-", ""), type: "bar", data: card.dimensions.map((item) => item.value), itemStyle: { color: index === 0 ? "#16784a" : "#a2632d" } })),
    });
    const resize = new ResizeObserver(() => chart.resize()); resize.observe(ref.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [scorecards]);
  return <section className="score-view" aria-label={`${label} multi-party vector scorecard`}>
    <div className="score-chart" ref={ref} role="img" aria-label={`${label} score chart`} />
    <div className="score-values">
      {scorecards.flatMap((card) => card.dimensions.map((dimension) => <div key={`${card.partyNodeId}-${dimension.id}`}>
        <span>{card.partyNodeId.replace("node-syn-", "")} · {dimension.label}</span><strong>{dimension.value.toFixed(2)}</strong>
      </div>))}
    </div>
  </section>;
}
