import { echarts } from "../charts";
import { useEffect, useRef } from "react";
import type { WorkbenchSnapshot } from "../../../src/workbench/types";
import { localizeTerm, translate, type Locale } from "../i18n";

export function TimelineChart({ events, locale }: { events: WorkbenchSnapshot["timeline"]; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    const seriesFor = (name: string, predicate: (event: WorkbenchSnapshot["timeline"][number]) => boolean, color: string, symbol: string) => ({
      name,
      type: "scatter",
      symbol,
      symbolSize: 11,
      itemStyle: { color, borderColor: "#ffffff", borderWidth: 2 },
      data: events.filter(predicate).map((event, index) => ({ name: event.summary, value: [Date.parse(event.occurredAt), 0.44 + (index % 2) * 0.18], mode: event.mode, cutoffStatus: event.cutoffStatus })),
    });
    chart.setOption({
      animation: false,
      legend: { bottom: 0, textStyle: { color: "#68736b", fontSize: 9 } },
      grid: { top: 12, right: 12, bottom: 48, left: 34 },
      tooltip: { trigger: "item", formatter: (item: { data: { name: string; mode: string; cutoffStatus: string } }) => `${item.data.name}<br/>${localizeTerm(locale, item.data.mode)} · ${localizeTerm(locale, item.data.cutoffStatus)}` },
      xAxis: { type: "time", axisLabel: { color: "#677269", hideOverlap: true }, axisLine: { lineStyle: { color: "#c8cec9" } } },
      yAxis: { type: "value", min: 0, max: 1, show: false },
      series: [
        seriesFor(translate(locale, "mainLine"), (event) => event.cutoffStatus === "available", "#16784a", "circle"),
        seriesFor(localizeTerm(locale, "hindsight"), (event) => event.cutoffStatus === "hindsight", "#7a857d", "emptyCircle"),
        seriesFor(localizeTerm(locale, "variation"), (event) => event.cutoffStatus === "variation", "#2d6683", "diamond"),
      ],
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(ref.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [events, locale]);
  return <div className="timeline-chart" ref={ref} role="img" aria-label={translate(locale, "evidenceTimeline")} />;
}
