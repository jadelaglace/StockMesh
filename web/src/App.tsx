import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, AlertCircle, ArchiveRestore, ArrowRight, Check, ChevronRight, GitBranch,
  History, Info, Network, Pin, Play, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal,
  Split, UserRound, X,
} from "lucide-react";
import type { WorkbenchSnapshot } from "../../src/workbench/types";
import { api } from "./api";
import { GraphBoard, type GraphSelection } from "./components/GraphBoard";
import { ScoreView } from "./components/ScoreView";
import { TimelineChart } from "./components/TimelineChart";

type MobileTab = "timeline" | "board" | "analysis" | "branches";

function shortTime(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(value));
}

function statusLabel(value: string): string {
  return value.replaceAll("-", " ");
}

function uncertaintyLabel(value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? "Not declared");
  const item = value as { level?: string; basis?: string[] };
  return [item.level, ...(item.basis ?? [])].filter(Boolean).join(" · ");
}

function projectionDiff(
  current: WorkbenchSnapshot["positions"][number] | undefined,
  previous: WorkbenchSnapshot["positions"][number] | undefined,
) {
  if (!current || !previous) return [];
  const groups = ["active_node_ids", "relation_ids", "flow_ids", "state_ids"] as const;
  return groups.map((key) => ({
    label: key.replaceAll("_", " "),
    added: current.projection[key].filter((id) => !previous.projection[key].includes(id)),
    removed: previous.projection[key].filter((id) => !current.projection[key].includes(id)),
  })).filter((item) => item.added.length || item.removed.length);
}

export function App() {
  const [snapshot, setSnapshot] = useState<WorkbenchSnapshot>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedTrace, setSelectedTrace] = useState<GraphSelection>();
  const [selectedBranchId, setSelectedBranchId] = useState<string>();
  const [compareBranchId, setCompareBranchId] = useState<string>();
  const [comparePositionId, setComparePositionId] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("board");
  const [draft, setDraft] = useState("");

  const refresh = useCallback(async (positionId?: string) => {
    setLoading(true); setError(undefined);
    try {
      const next = await api.snapshot(positionId);
      setSnapshot(next);
      setSelectedNodeId((current) => current && next.graph.nodes.some((node) => node.id === current) ? current : undefined);
      setSelectedBranchId((current) => current && next.branches.some((branch) => branch.id === current) ? current : next.branches[0]?.id);
      setComparePositionId((current) => current !== next.selectedPositionId && next.positions.some((item) => item.id === current)
        ? current
        : next.positions.find((item) => item.id !== next.selectedPositionId)?.id ?? "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const command = useCallback(async (name: string, work: () => Promise<{ message: string; snapshot: WorkbenchSnapshot }>): Promise<boolean> => {
    setBusy(name); setError(undefined); setNotice(undefined);
    try {
      const result = await work(); setSnapshot(result.snapshot); setNotice(result.message);
      setSelectedBranchId((current) => current && result.snapshot.branches.some((branch) => branch.id === current) ? current : result.snapshot.branches[0]?.id);
      setComparePositionId((current) => current !== result.snapshot.selectedPositionId && result.snapshot.positions.some((item) => item.id === current)
        ? current
        : result.snapshot.positions.find((item) => item.id !== result.snapshot.selectedPositionId)?.id ?? "");
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); return false; }
    finally { setBusy(undefined); }
  }, []);

  const selectedNode = snapshot?.graph.nodes.find((node) => node.id === selectedNodeId);
  const selectedBranch = snapshot?.branches.find((branch) => branch.id === selectedBranchId);
  const selectedPosition = snapshot?.positions.find((position) => position.id === snapshot.selectedPositionId);
  const comparedPosition = snapshot?.positions.find((position) => position.id === comparePositionId);
  const diff = useMemo(() => projectionDiff(selectedPosition, comparedPosition), [selectedPosition, comparedPosition]);
  const comparedBranch = snapshot?.branches.find((branch) => branch.id === compareBranchId);
  const branchDiff = useMemo(() => projectionDiff(
    snapshot?.positions.find((position) => position.id === selectedBranch?.positionId),
    snapshot?.positions.find((position) => position.id === comparedBranch?.positionId),
  ), [snapshot, selectedBranch, comparedBranch]);
  const branchTree = useMemo(() => {
    if (!snapshot) return [];
    const ordered: typeof snapshot.branches = [];
    const visit = (parentId?: string) => snapshot.branches.filter((branch) => branch.parentId === parentId).forEach((branch) => { ordered.push(branch); visit(branch.id); });
    visit();
    return ordered;
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot || !selectedBranch) return;
    if (compareBranchId && compareBranchId !== selectedBranch.id && snapshot.branches.some((branch) => branch.id === compareBranchId)) return;
    setCompareBranchId(snapshot.branches.find((branch) => branch.id !== selectedBranch.id)?.id);
  }, [snapshot, selectedBranch, compareBranchId]);

  const selectNode = useCallback((id: string) => setSelectedNodeId(id), []);
  const selectTrace = useCallback((selection?: GraphSelection) => setSelectedTrace(selection), []);
  const selectedNodeRelations = snapshot?.graph.relations.filter((relation) => relation.source === selectedNodeId || relation.target === selectedNodeId) ?? [];
  const selectedNodeFlows = snapshot?.graph.flows.filter((flow) => selectedNodeId ? flow.path.includes(selectedNodeId) : false) ?? [];
  const selectedNodeTimeline = snapshot?.timeline.filter((event) => selectedNodeId ? event.participantNodeIds.includes(selectedNodeId) : false) ?? [];
  const stanceClaims = selectedNode?.claims.filter((claim) => claim.kind.includes("stance")) ?? [];
  const relatedProfileClaimIds = new Set([
    ...(selectedNode?.claims.map((claim) => claim.id) ?? []),
    ...(snapshot?.revisionProposals.filter((proposal) => proposal.subjectNodeId === selectedNodeId).flatMap((proposal) => [...proposal.priorClaimRefs, proposal.proposedClaimId]) ?? []),
  ]);
  const selectedNodeProfileHistory = snapshot?.profileHistory.filter((profile) => profile.claimRefs.some((claimId) => relatedProfileClaimIds.has(claimId))) ?? [];

  const submitEvidence = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim(); if (!text) return;
    if (await command("stage", () => api.stage({ text, observedAt: new Date().toISOString() }))) setDraft("");
  };

  if (loading && !snapshot) return <div className="boot"><RefreshCw className="spin" /> Loading synthetic workbench...</div>;
  if (!snapshot) return <div className="boot error"><AlertCircle /> {error ?? "Workbench unavailable"}<button onClick={() => void refresh()}>Retry</button></div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Network size={19} /></div><div><strong>StockMesh</strong><span>Strategy workbench</span></div></div>
        <div className="scope-badge"><ShieldCheck size={14} /> Public synthetic data</div>
        <button className="icon-button" title="Refresh workbench" aria-label="Refresh workbench" disabled={loading || Boolean(busy)} onClick={() => void refresh(snapshot.selectedPositionId)}><RefreshCw className={loading ? "spin" : ""} size={17} /></button>
      </header>

      <section className="context-bar" aria-label="Analysis context">
        <label><span>Playground</span><select value={snapshot.context.playgroundId} disabled><option>{snapshot.context.scope}</option></select></label>
        <label><span>Perspective</span><select value={snapshot.context.perspectiveId} disabled><option>{snapshot.context.perspectiveId.replace("perspective-syn-", "")}</option></select></label>
        <label><span>As-of position</span><select value={snapshot.selectedPositionId} onChange={(event) => void refresh(event.target.value)}>{snapshot.positions.map((position) => <option value={position.id} key={position.id}>{shortTime(position.asOf)} · {position.mode}</option>)}</select></label>
        <label><span>Compare from</span><select value={comparePositionId} onChange={(event) => setComparePositionId(event.target.value)}>{snapshot.positions.filter((position) => position.id !== snapshot.selectedPositionId).map((position) => <option value={position.id} key={position.id}>{shortTime(position.asOf)} · {position.mode}</option>)}</select></label>
        <div className="horizon"><span>Horizon / evidence cutoff</span><strong>{shortTime(snapshot.context.horizon)} / {shortTime(snapshot.context.evidenceCutoff)}</strong></div>
      </section>

      <nav className="mobile-tabs" aria-label="Workbench views">
        {(["timeline", "board", "analysis", "branches"] as MobileTab[]).map((tab) => <button className={mobileTab === tab ? "active" : ""} onClick={() => setMobileTab(tab)} key={tab}>{tab}</button>)}
      </nav>

      {(error || notice) && <div className={`notice ${error ? "notice-error" : "notice-success"}`} role="status" aria-live="polite">{error ? <AlertCircle size={16} /> : <Check size={16} />}<span>{error ?? notice}</span><button aria-label="Dismiss message" onClick={() => { setError(undefined); setNotice(undefined); }}><X size={15} /></button></div>}

      <main className="workspace">
        <section className={`panel timeline-panel ${mobileTab === "timeline" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><History size={16} /><h2>Timeline</h2></div><span>{snapshot.timeline.length} events</span></div>
          <TimelineChart events={snapshot.timeline} />
          <div className="timeline-list">
            {(["available", "hindsight", "variation"] as const).map((group) => {
              const items = snapshot.timeline.filter((event) => event.cutoffStatus === group);
              if (!items.length) return null;
              const title = group === "available" ? "Main Line at cutoff" : group === "hindsight" ? "Later Main Line · hindsight" : "Variation overlay";
              return <section className="timeline-group" key={group}><h3>{title}</h3>{items.map((event) => <button className="timeline-event" key={event.id} disabled={!event.resultingPositionId || !snapshot.positions.some((position) => position.id === event.resultingPositionId)} onClick={() => {
                const exact = event.resultingPositionId ? snapshot.positions.find((position) => position.id === event.resultingPositionId) : undefined;
                if (exact) void refresh(exact.id);
              }}>
                <span className={`event-dot mode-${event.mode} cutoff-${event.cutoffStatus}`} />
                <span className="event-body"><strong>{event.summary}</strong><small>{shortTime(event.occurredAt)} · {statusLabel(event.mode)} · {statusLabel(event.cutoffStatus)}</small></span>
                <ChevronRight size={14} />
              </button>)}</section>;
            })}
          </div>
        </section>

        <section className={`panel board-panel ${mobileTab === "board" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><Network size={16} /><h2>Position</h2></div><span>{snapshot.graph.nodes.length} Pawns · {snapshot.graph.relations.length} relations · {snapshot.graph.flows.length} flows</span></div>
          <div className="question"><Search size={15} /><span>{snapshot.context.question}</span></div>
          <div className="node-strip" aria-label="Visible Pawns">{snapshot.graph.nodes.map((node) => <button aria-pressed={selectedNodeId === node.id} className={selectedNodeId === node.id ? "selected" : ""} key={node.id} onClick={() => setSelectedNodeId(node.id)}><UserRound size={12} />{node.label}</button>)}</div>
          <GraphBoard graph={snapshot.graph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} onSelectTrace={selectTrace} />
          <div className="board-legend"><span><i className="legend-node" /> Pawn / Node</span><span><i className="legend-line" /> typed relation</span><span><i className="legend-flow" /> Flow</span><span><b>?</b> uncertain Claim</span></div>
          {selectedTrace && <div className="element-trace" role="status"><div><strong>{selectedTrace.kind}: {selectedTrace.label || selectedTrace.id}</strong><span>{selectedTrace.id}</span></div><p>Claims: {selectedTrace.claimRefs.join(", ") || "none"}<br />Evidence: {selectedTrace.evidenceRefs.join(", ") || "none"}</p><button aria-label="Close relation or flow trace" onClick={() => setSelectedTrace(undefined)}><X size={13} /></button></div>}
          <section className="comparison-strip">
            <div><SlidersHorizontal size={15} /><strong>Position delta</strong><span>{comparedPosition?.id} <ArrowRight size={12} /> {selectedPosition?.id}</span></div>
            {diff.length === 0 ? <p>No projected identifier changes at this question boundary.</p> : diff.map((item) => <p key={item.label}><b>{item.label}</b> {item.added.length ? `+${item.added.join(", ")}` : ""} {item.removed.length ? `-${item.removed.join(", ")}` : ""}</p>)}
          </section>
        </section>

        <aside className={`panel analysis-panel ${mobileTab === "analysis" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><Activity size={16} /><h2>Analysis</h2></div><span>{snapshot.trace.analyses[0]?.model ?? "not run"}</span></div>
          <dl className="analysis-boundary"><dt>Evidence cutoff</dt><dd>{shortTime(snapshot.context.evidenceCutoff)}</dd><dt>Risk policy</dt><dd>{snapshot.context.riskPolicy}</dd><dt>Evaluation profile</dt><dd>{snapshot.context.evaluationProfile}</dd></dl>
          <div className="objectives">
            <h3>Multi-party objectives</h3>
            {snapshot.context.objectives.map((objective) => <div className="objective" key={objective.partyNodeId}><div><strong>{objective.partyLabel}</strong><span>{objective.objective}</span></div><b>{Math.round(objective.weight * 100)}%</b></div>)}
          </div>
          <button className="primary-command" aria-label="Run position analysis" aria-busy={busy === "analysis"} disabled={Boolean(busy)} onClick={() => void command("analysis", () => api.analyze(snapshot.selectedPositionId))}>{busy === "analysis" ? <RefreshCw className="spin" size={16} /> : <Play size={16} />}{busy === "analysis" ? "Analyzing..." : snapshot.branches.length ? "Refresh branch view" : "Analyze position"}</button>
          {snapshot.trace.analyses.map((analysis) => <details className="trace-detail" key={analysis.id}><summary><span><Activity size={14} />{analysis.provider} / {analysis.model}</span><b>{analysis.status}</b></summary><dl><dt>Frozen context</dt><dd>{analysis.contextSnapshotId}</dd><dt>Configuration</dt><dd>{analysis.configurationIdentity}</dd><dt>Usage</dt><dd>{analysis.tokens} tokens · {analysis.cost} cost</dd></dl></details>)}
          {snapshot.trace.methods.map((method) => <details className="trace-detail" key={method.runId}><summary><span><Info size={14} />{method.methodId}</span><b>{method.version}</b></summary><pre>{JSON.stringify(method.output, null, 2)}</pre><ul>{method.caveats.map((item) => <li key={item}>{item}</li>)}</ul></details>)}
          <form className="evidence-form" onSubmit={(event) => void submitEvidence(event)}>
            <h3><Plus size={15} /> Stage synthetic evidence</h3>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Record what happened next..." aria-label="Synthetic evidence text" />
            <button type="submit" aria-busy={busy === "stage"} disabled={Boolean(busy) || !draft.trim()}>{busy === "stage" ? <RefreshCw className="spin" size={15} /> : <Plus size={15} />} {busy === "stage" ? "Staging..." : "Stage for review"}</button>
          </form>
          <div className="staging-list">
            {!snapshot.staging.some((item) => item.id.startsWith("stage-evidence-web-")) && <p className="empty-inline">No staged Web evidence.</p>}
            {snapshot.staging.filter((item) => item.id.startsWith("stage-evidence-web-")).map((item) => <div className="staging-row" key={item.id}><div className="staging-copy"><strong>{item.preview ?? item.id.replace("stage-evidence-web-", "note-")}</strong><span className={`status status-${item.status}`}>{item.status}</span></div>{item.status === "staged" && <div><button title="Accept evidence" aria-label="Accept evidence" disabled={Boolean(busy)} onClick={() => void command("accept", () => api.review(item.id, "accept"))}>{busy === "accept" ? <RefreshCw className="spin" size={14} /> : <Check size={14} />}</button><button title="Reject evidence" aria-label="Reject evidence" disabled={Boolean(busy)} onClick={() => void command("reject", () => api.review(item.id, "reject"))}>{busy === "reject" ? <RefreshCw className="spin" size={14} /> : <X size={14} />}</button></div>}</div>)}
          </div>
        </aside>

        <section className={`panel branch-panel ${mobileTab === "branches" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><GitBranch size={16} /><h2>Main Line + Variations</h2></div><span>{snapshot.branches.length ? `${snapshot.branches.length} materialized` : "analysis not run"}</span></div>
          {!snapshot.branches.length ? <div className="empty-state"><GitBranch /><strong>No Variations yet</strong><span>Run analysis to create forecast, counterfactual, and exploratory branches.</span></div> : <div className="branch-layout">
            <div className="branch-tree" role="tree">
              <button className="branch-root" aria-label="Checkout Main Line root" onClick={() => void refresh()}><span className="branch-marker main" /><div><strong>Main Line</strong><small>current reviewed Position</small></div></button>
              {branchTree.map((branch) => <button role="treeitem" aria-selected={selectedBranchId === branch.id} className={`branch-row ${selectedBranchId === branch.id ? "selected" : ""}`} style={{ paddingLeft: `${18 + branch.depth * 18}px` }} key={branch.id} onClick={() => setSelectedBranchId(branch.id)}><span className={`branch-marker purpose-${branch.purpose}`} /><div><strong>{branch.title}</strong><small>{branch.purpose} · {branch.realization} · depth {branch.depth}{branch.parentId ? " · child" : ""}</small></div>{branch.state === "pinned" && <Pin size={13} />}</button>)}
            </div>
            {selectedBranch && <div className="branch-detail">
              <div className="branch-labels"><span className={`status purpose-${selectedBranch.purpose}`}>purpose: {selectedBranch.purpose}</span><span className="status">realization: {selectedBranch.realization}</span><span className="status">state: {selectedBranch.state}</span></div>
              <h3>{selectedBranch.title}</h3><p><b>Move:</b> {selectedBranch.action}</p><p><b>Modeled response:</b> {selectedBranch.modeledResponse}</p>
              <dl><dt>Assumptions</dt><dd>{selectedBranch.assumptions.join(" ")}</dd><dt>Uncertainty</dt><dd>{uncertaintyLabel(selectedBranch.uncertainty)}</dd><dt>Replan trigger</dt><dd>{selectedBranch.replanTrigger}</dd><dt>Frozen context</dt><dd>{selectedBranch.contextSnapshotId}</dd><dt>Evidence cutoff</dt><dd>{shortTime(selectedBranch.evaluation.evidenceCutoff)}</dd><dt>Horizon</dt><dd>{shortTime(selectedBranch.evaluation.horizon)}</dd><dt>Risk policy</dt><dd>{selectedBranch.evaluation.riskPolicy}</dd><dt>Evaluation profile</dt><dd>{selectedBranch.evaluation.evaluationProfile}</dd><dt>Objective weights</dt><dd>{snapshot.context.objectives.map((item) => `${item.partyLabel} ${Math.round(item.weight * 100)}%`).join(" · ")}</dd><dt>Score uncertainty</dt><dd>{uncertaintyLabel(selectedBranch.evaluation.uncertainty)}</dd></dl>
              <ScoreView scorecards={selectedBranch.evaluation.partyScorecards} />
              <section className="branch-compare" aria-label="Branch comparison"><label><span>Compare branch</span><select value={compareBranchId ?? ""} onChange={(event) => setCompareBranchId(event.target.value)}>{snapshot.branches.filter((branch) => branch.id !== selectedBranch.id).map((branch) => <option value={branch.id} key={branch.id}>{branch.title} · {branch.purpose}</option>)}</select></label>{comparedBranch && <><p><b>{comparedBranch.title}</b> · {comparedBranch.purpose} · {comparedBranch.realization}</p>{branchDiff.length === 0 ? <p>No projected identifier differences; score vectors and assumptions still differ.</p> : branchDiff.map((item) => <p key={item.label}><b>{item.label}</b> {item.added.length ? `+${item.added.join(", ")}` : ""} {item.removed.length ? `-${item.removed.join(", ")}` : ""}</p>)}<ScoreView label="Compared branch" scorecards={comparedBranch.evaluation.partyScorecards} /></>}</section>
              <div className="branch-actions"><button title="Checkout variation Position" disabled={Boolean(busy) || snapshot.selectedPositionId === selectedBranch.positionId} onClick={() => void refresh(selectedBranch.positionId)}><ChevronRight size={15} /> {snapshot.selectedPositionId === selectedBranch.positionId ? "Checked out" : "Checkout"}</button><button title="Pin variation" disabled={Boolean(busy)} onClick={() => void command("pin", () => api.pin(selectedBranch.id))}>{busy === "pin" ? <RefreshCw className="spin" size={15} /> : <Pin size={15} />} {busy === "pin" ? "Pinning..." : "Pin"}</button><button title="Replay frozen context" disabled={Boolean(busy)} onClick={() => void command("replay", () => api.replay(selectedBranch.id))}>{busy === "replay" ? <RefreshCw className="spin" size={15} /> : <ArchiveRestore size={15} />} {busy === "replay" ? "Replaying..." : "Replay"}</button><button title="Fork from variation" disabled={Boolean(busy)} onClick={() => void command("fork", () => api.fork(selectedBranch.id))}>{busy === "fork" ? <RefreshCw className="spin" size={15} /> : <Split size={15} />} {busy === "fork" ? "Forking..." : "Fork"}</button></div>
            </div>}
          </div>}
          {snapshot.searchRuns[0] && <div className="search-budget"><div><strong>{snapshot.searchRuns[0].status}</strong><span>{snapshot.searchRuns[0].stopReason ?? "policy terminal"}</span></div><span>{snapshot.searchRuns[0].usage.materializedPositions ?? 0} materialized · {snapshot.searchRuns[0].usage.analysisCalls ?? 0} calls · max depth {snapshot.searchRuns[0].budgets.maxDepth ?? "open"}</span>{["paused-budget", "paused-user", "failed"].includes(snapshot.searchRuns[0].status) && <button disabled={Boolean(busy)} onClick={() => void command("resume", () => api.resume(snapshot.searchRuns[0]!.id))}>{busy === "resume" ? <RefreshCw className="spin" size={14} /> : <Play size={14} />} {busy === "resume" ? "Resuming..." : "Resume + budget"}</button>}</div>}
        </section>
      </main>

      {selectedNode && <aside className="node-drawer" aria-label="Pawn detail">
        <div className="drawer-heading"><div className="avatar"><UserRound size={20} /></div><div><small>{selectedNode.profileLabel} · {selectedNode.type}</small><h2>{selectedNode.label}</h2></div><button className="icon-button" title="Close Pawn detail" onClick={() => setSelectedNodeId(undefined)}><X size={17} /></button></div>
        <section><h3>Identity & organizational profile</h3><dl className="drawer-meta"><dt>Universal type</dt><dd>{selectedNode.type}</dd><dt>Profile label</dt><dd>{selectedNode.profileLabel}</dd><dt>Role signals</dt><dd>{selectedNodeRelations.map((relation) => `${relation.source === selectedNode.id ? "outgoing" : "incoming"} ${statusLabel(relation.type)}`).join(" · ") || "No typed role relation at this cutoff"}</dd><dt>Stance</dt><dd>{stanceClaims.map((claim) => claim.proposition ?? claim.kind).join(" · ") || "No stance Claim at this cutoff"}</dd><dt>Position profile</dt><dd>{selectedPosition?.profileSnapshotId}</dd></dl></section>
        <section><h3>State at selected cutoff</h3>{selectedNode.states.length ? selectedNode.states.map((state) => <div className="state-row" key={state.id}><strong>{statusLabel(state.type)}</strong><span>{JSON.stringify(state.value)}</span></div>) : <p className="muted">No visible state at this cutoff.</p>}</section>
        <section><h3>Claims at selected cutoff</h3>{selectedNode.claims.length ? selectedNode.claims.map((claim) => <article className="claim-row" key={claim.id}><div><span className={`status status-${claim.status}`}>{claim.status}</span><small>revision {claim.revision}</small></div><p>{claim.proposition ?? claim.kind}</p><small>{claim.evidenceRefs.join(", ")}</small></article>) : <p className="muted">No profile Claim in this frozen snapshot.</p>}</section>
        <section><h3>Relations & flows</h3>{selectedNodeRelations.map((relation) => <div className="trace-source" key={relation.id}><Network size={14} /><div><strong>{statusLabel(relation.type)}</strong><span>{relation.source} → {relation.target} · Claims {relation.claimRefs.join(", ")}</span></div></div>)}{selectedNodeFlows.map((flow) => <div className="trace-source" key={flow.id}><Activity size={14} /><div><strong>{statusLabel(flow.type)} flow</strong><span>{flow.path.join(" → ")} · Claims {flow.claimRefs.join(", ")}</span></div></div>)}{!selectedNodeRelations.length && !selectedNodeFlows.length && <p className="muted">No visible Relation or Flow at this cutoff.</p>}</section>
        <section><h3>Timeline</h3>{selectedNodeTimeline.length ? selectedNodeTimeline.map((event) => <div className="node-event" key={event.id}><strong>{event.summary}</strong><span>{shortTime(event.occurredAt)} · {statusLabel(event.mode)} · {statusLabel(event.cutoffStatus)}</span></div>) : <p className="muted">No linked Event in the visible Timeline.</p>}</section>
        <section><h3>Profile history</h3>{selectedNodeProfileHistory.length ? selectedNodeProfileHistory.map((profile) => <div className="profile-snapshot" key={profile.id}><strong>{profile.id === selectedPosition?.profileSnapshotId ? "Selected snapshot" : "Later or alternate snapshot"}</strong><span>{profile.id} · {shortTime(profile.asOf)} · {profile.version}</span></div>) : <p className="muted">No profile snapshot references this Pawn.</p>}</section>
        <section><h3>Reviewed corrections</h3>{snapshot.revisionProposals.filter((proposal) => proposal.subjectNodeId === selectedNode.id).map((proposal) => { const actionable = proposal.reviewStatus === "accepted" && !proposal.applied; return <article className="revision-row" key={proposal.id}><p>{proposal.interpretation}</p><small>Evidence: {proposal.evidenceRefs.join(", ")}</small><button disabled={!actionable || Boolean(busy)} onClick={() => void command("revision", () => api.applyRevision(proposal.id))}>{proposal.applied ? <Check size={14} /> : busy === "revision" ? <RefreshCw className="spin" size={14} /> : actionable ? <RefreshCw size={14} /> : <Info size={14} />}{proposal.applied ? "Applied append-only" : busy === "revision" ? "Applying..." : actionable ? "Apply reviewed revision" : "Awaiting review"}</button></article>; })}</section>
        <section><h3>Trace</h3>{[...new Set(selectedNode.claims.flatMap((claim) => claim.evidenceRefs))].map((id) => { const source = snapshot.trace.evidence.find((item) => item.id === id); return <div className="trace-source" key={id}><ShieldCheck size={14} /><div><strong>{id}</strong><span>{source ? `${source.sourceKind} · ${source.integrity}` : "Source metadata unavailable"}</span></div></div>; })}</section>
      </aside>}
    </div>
  );
}
