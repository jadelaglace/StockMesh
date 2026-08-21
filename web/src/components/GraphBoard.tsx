import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef } from "react";
import type { WorkbenchSnapshot } from "../../../src/workbench/types";

interface Props {
  graph: WorkbenchSnapshot["graph"];
  selectedNodeId?: string;
  onSelectNode(id: string): void;
  onSelectTrace(selection?: GraphSelection): void;
}

export interface GraphSelection {
  id: string;
  kind: "relation" | "flow";
  label: string;
  claimRefs: string[];
  evidenceRefs: string[];
}

export function GraphBoard({ graph, selectedNodeId, onSelectNode, onSelectTrace }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<Core | undefined>(undefined);

  useEffect(() => {
    if (!container.current) return;
    instance.current?.destroy();
    const nodes = graph.nodes.map((node) => ({ data: { id: node.id, label: node.label, type: node.type, warning: node.claims.some((claim) => claim.status === "inference" || claim.status === "unknown") ? "?" : "" } }));
    const relations = graph.relations.map((edge) => ({ data: { id: edge.id, source: edge.source, target: edge.target, label: edge.type, kind: "relation", traceId: edge.id, claimRefs: edge.claimRefs, evidenceRefs: edge.evidenceRefs } }));
    const flows = graph.flows.flatMap((flow) => flow.path.slice(0, -1).map((source, index) => ({
      data: {
        id: `flow-segment-${flow.id}-${index}`,
        source,
        target: flow.path[index + 1],
        label: index === 0 ? flow.type : "",
        kind: "flow",
        traceId: flow.id,
        claimRefs: flow.claimRefs,
        evidenceRefs: flow.evidenceRefs,
      },
    })));
    instance.current = cytoscape({
      container: container.current,
      elements: [...nodes, ...relations, ...flows],
      layout: { name: "cose", animate: false, fit: true, padding: 36, nodeRepulsion: () => 7000, idealEdgeLength: () => 110 },
      style: [
        { selector: "node", style: { "background-color": "#ffffff", "border-color": "#28352d", "border-width": 2, color: "#1c2720", label: "data(label)", "font-size": "12px", "text-valign": "bottom", "text-margin-y": 9, width: 42, height: 42 } },
        { selector: "node:selected", style: { "background-color": "#dceee2", "border-color": "#16784a", "border-width": 4 } },
        { selector: "edge", style: { width: 2, "line-color": "#9ea8a1", "target-arrow-color": "#9ea8a1", "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(label)", "font-size": "9px", color: "#606d65", "text-background-color": "#f4f5f2", "text-background-opacity": 1, "text-background-padding": "2px" } },
        { selector: "edge[kind = 'flow']", style: { width: 3, "line-style": "dashed", "line-color": "#2d6683", "target-arrow-color": "#2d6683" } },
      ],
    });
    instance.current.on("tap", "node", (event) => { onSelectTrace(undefined); onSelectNode(event.target.id()); });
    instance.current.on("tap", "edge", (event) => {
      const data = event.target.data() as { traceId: string; kind: "relation" | "flow"; label: string; claimRefs: string[]; evidenceRefs: string[] };
      onSelectTrace({ id: data.traceId, kind: data.kind, label: data.label, claimRefs: data.claimRefs, evidenceRefs: data.evidenceRefs });
    });
    return () => instance.current?.destroy();
  }, [graph, onSelectNode, onSelectTrace]);

  useEffect(() => {
    if (!instance.current || !selectedNodeId) return;
    instance.current.$(":selected").unselect();
    instance.current.$id(selectedNodeId).select();
  }, [selectedNodeId]);

  return <div className="graph-board" ref={container} role="img" aria-label="Question-bounded Position network" data-testid="graph-board" />;
}
