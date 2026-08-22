import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, AlertCircle, ArchiveRestore, ArrowRight, Check, ChevronRight, GitBranch,
  History, Info, Languages, Network, Pin, Play, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal,
  Split, UserRound, X,
} from "lucide-react";
import type { WorkbenchSnapshot } from "../../src/workbench/types";
import { api } from "./api";
import { GraphBoard, type GraphSelection } from "./components/GraphBoard";
import { formatTime, localizeMessage, localizeSearchStopReason, localizeTerm, readStoredLocale, translate, type Locale, type MessageKey } from "./i18n";
import { ScoreView } from "./components/ScoreView";
import { TimelineChart } from "./components/TimelineChart";

type MobileTab = "timeline" | "board" | "analysis" | "branches";

function uncertaintyLabel(locale: Locale, value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? translate(locale, "notDeclared"));
  const item = value as { level?: string; basis?: string[] };
  return [item.level ? localizeTerm(locale, item.level) : undefined, ...(item.basis ?? [])].filter(Boolean).join(" · ");
}

function projectionDiff(
  current: WorkbenchSnapshot["positions"][number] | undefined,
  previous: WorkbenchSnapshot["positions"][number] | undefined,
) {
  if (!current || !previous) return [];
  const groups = ["active_node_ids", "relation_ids", "flow_ids", "state_ids"] as const;
  const labelKeys: Record<(typeof groups)[number], MessageKey> = {
    active_node_ids: "activeNodeIds",
    relation_ids: "relationIds",
    flow_ids: "flowIds",
    state_ids: "stateIds",
  };
  return groups.map((key) => ({
    labelKey: labelKeys[key],
    added: current.projection[key].filter((id) => !previous.projection[key].includes(id)),
    removed: previous.projection[key].filter((id) => !current.projection[key].includes(id)),
  })).filter((item) => item.added.length || item.removed.length);
}

export function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      return readStoredLocale(typeof window === "undefined" ? undefined : window.localStorage);
    } catch {
      return "en";
    }
  });
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
  const t = useCallback((key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values), [locale]);
  const shortTime = useCallback((value: string) => formatTime(locale, value), [locale]);
  const statusLabel = useCallback((value: string) => localizeTerm(locale, value), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem("stockmesh.locale", locale);
    } catch {
      // The language switch remains usable when browser storage is unavailable.
    }
  }, [locale]);

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

  if (loading && !snapshot) return <div className="boot"><RefreshCw className="spin" /> {t("loadingWorkbench")}</div>;
  if (!snapshot) return <div className="boot error"><AlertCircle /> {error ?? t("workbenchUnavailable")}<button onClick={() => void refresh()}>{t("retry")}</button></div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Network size={19} /></div><div><strong>StockMesh</strong><span>{t("strategyWorkbench")}</span></div></div>
        <div className="scope-badge"><ShieldCheck size={14} /> {t("publicSyntheticData")}</div>
        <div className="language-switch" role="group" aria-label={t("language")}><Languages size={15} aria-hidden="true" /><button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>{t("english")}</button><button aria-pressed={locale === "zh-CN"} onClick={() => setLocale("zh-CN")}>{t("simplifiedChinese")}</button></div>
        <button className="icon-button" title={t("refreshWorkbench")} aria-label={t("refreshWorkbench")} disabled={loading || Boolean(busy)} onClick={() => void refresh(snapshot.selectedPositionId)}><RefreshCw className={loading ? "spin" : ""} size={17} /></button>
      </header>

      <section className="context-bar" aria-label={t("analysisContext")}>
        <label><span>{t("playground")}</span><select value={snapshot.context.playgroundId} disabled><option>{snapshot.context.scope}</option></select></label>
        <label><span>{t("perspective")}</span><select value={snapshot.context.perspectiveId} disabled><option>{snapshot.context.perspectiveId.replace("perspective-syn-", "")}</option></select></label>
        <label><span>{t("asOfPosition")}</span><select value={snapshot.selectedPositionId} onChange={(event) => void refresh(event.target.value)}>{snapshot.positions.map((position) => <option value={position.id} key={position.id}>{shortTime(position.asOf)} · {statusLabel(position.mode)}</option>)}</select></label>
        <label><span>{t("compareFrom")}</span><select value={comparePositionId} onChange={(event) => setComparePositionId(event.target.value)}>{snapshot.positions.filter((position) => position.id !== snapshot.selectedPositionId).map((position) => <option value={position.id} key={position.id}>{shortTime(position.asOf)} · {statusLabel(position.mode)}</option>)}</select></label>
        <div className="horizon"><span>{t("horizonEvidenceCutoff")}</span><strong>{shortTime(snapshot.context.horizon)} / {shortTime(snapshot.context.evidenceCutoff)}</strong></div>
      </section>

      <nav className="mobile-tabs" aria-label={t("workbenchViews")}>
        {(["timeline", "board", "analysis", "branches"] as MobileTab[]).map((tab) => <button className={mobileTab === tab ? "active" : ""} onClick={() => setMobileTab(tab)} key={tab}>{t(tab)}</button>)}
      </nav>

      {(error || notice) && <div className={`notice ${error ? "notice-error" : "notice-success"}`} role="status" aria-live="polite">{error ? <AlertCircle size={16} /> : <Check size={16} />}<span>{localizeMessage(locale, error ?? notice ?? "")}</span><button aria-label={t("dismissMessage")} onClick={() => { setError(undefined); setNotice(undefined); }}><X size={15} /></button></div>}

      <main className="workspace">
        <section className={`panel timeline-panel ${mobileTab === "timeline" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><History size={16} /><h2>{t("timeline")}</h2></div><span>{t("eventCount", { count: snapshot.timeline.length })}</span></div>
          <TimelineChart events={snapshot.timeline} locale={locale} />
          <div className="timeline-list">
            {(["available", "hindsight", "variation"] as const).map((group) => {
              const items = snapshot.timeline.filter((event) => event.cutoffStatus === group);
              if (!items.length) return null;
              const title = group === "available" ? t("mainLineAtCutoff") : group === "hindsight" ? t("laterMainLineHindsight") : t("variationOverlay");
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
          <div className="panel-heading"><div><Network size={16} /><h2>{t("position")}</h2></div><span>{t("positionCounts", { pawns: snapshot.graph.nodes.length, relations: snapshot.graph.relations.length, flows: snapshot.graph.flows.length })}</span></div>
          <div className="question"><Search size={15} /><span>{snapshot.context.question}</span></div>
          <div className="node-strip" aria-label={t("visiblePawns")}>{snapshot.graph.nodes.map((node) => <button aria-pressed={selectedNodeId === node.id} className={selectedNodeId === node.id ? "selected" : ""} key={node.id} onClick={() => setSelectedNodeId(node.id)}><UserRound size={12} />{node.label}</button>)}</div>
          <GraphBoard graph={snapshot.graph} locale={locale} selectedNodeId={selectedNodeId} onSelectNode={selectNode} onSelectTrace={selectTrace} />
          <div className="board-legend"><span><i className="legend-node" /> {t("pawnNode")}</span><span><i className="legend-line" /> {t("typedRelation")}</span><span><i className="legend-flow" /> {t("flow")}</span><span><b>?</b> {t("uncertainClaim")}</span></div>
          {selectedTrace && <div className="element-trace" role="status"><div><strong>{statusLabel(selectedTrace.kind)}: {selectedTrace.label || selectedTrace.id}</strong><span>{selectedTrace.id}</span></div><p>{t("claims")}: {selectedTrace.claimRefs.join(", ") || t("none")}<br />{t("evidence")}: {selectedTrace.evidenceRefs.join(", ") || t("none")}</p><button aria-label={t("closeTrace")} onClick={() => setSelectedTrace(undefined)}><X size={13} /></button></div>}
          <section className="comparison-strip">
            <div><SlidersHorizontal size={15} /><strong>{t("positionDelta")}</strong><span>{comparedPosition?.id} <ArrowRight size={12} /> {selectedPosition?.id}</span></div>
            {diff.length === 0 ? <p>{t("noProjectedChanges")}</p> : diff.map((item) => <p key={item.labelKey}><b>{t(item.labelKey)}</b> {item.added.length ? `+${item.added.join(", ")}` : ""} {item.removed.length ? `-${item.removed.join(", ")}` : ""}</p>)}
          </section>
        </section>

        <aside className={`panel analysis-panel ${mobileTab === "analysis" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><Activity size={16} /><h2>{t("analysis")}</h2></div><span>{snapshot.trace.analyses[0]?.model ?? t("notRun")}</span></div>
          <dl className="analysis-boundary"><dt>{t("evidenceCutoff")}</dt><dd>{shortTime(snapshot.context.evidenceCutoff)}</dd><dt>{t("riskPolicy")}</dt><dd>{snapshot.context.riskPolicy}</dd><dt>{t("evaluationProfile")}</dt><dd>{snapshot.context.evaluationProfile}</dd></dl>
          <div className="objectives">
            <h3>{t("multiPartyObjectives")}</h3>
            {snapshot.context.objectives.map((objective) => <div className="objective" key={objective.partyNodeId}><div><strong>{objective.partyLabel}</strong><span>{objective.objective}</span></div><b>{Math.round(objective.weight * 100)}%</b></div>)}
          </div>
          <button className="primary-command" aria-label={t("runPositionAnalysis")} aria-busy={busy === "analysis"} disabled={Boolean(busy)} onClick={() => void command("analysis", () => api.analyze(snapshot.selectedPositionId))}>{busy === "analysis" ? <RefreshCw className="spin" size={16} /> : <Play size={16} />}{busy === "analysis" ? t("analyzing") : snapshot.branches.length ? t("refreshBranchView") : t("analyzePosition")}</button>
          {snapshot.trace.analyses.map((analysis) => <details className="trace-detail" key={analysis.id}><summary><span><Activity size={14} />{analysis.provider} / {analysis.model}</span><b>{statusLabel(analysis.status)}</b></summary><dl><dt>{t("frozenContext")}</dt><dd>{analysis.contextSnapshotId}</dd><dt>{t("configuration")}</dt><dd>{analysis.configurationIdentity}</dd><dt>{t("usage")}</dt><dd>{t("usageValue", { tokens: analysis.tokens, cost: analysis.cost })}</dd></dl></details>)}
          {snapshot.trace.methods.map((method) => <details className="trace-detail" key={method.runId}><summary><span><Info size={14} />{method.methodId}</span><b>{method.version}</b></summary><pre>{JSON.stringify(method.output, null, 2)}</pre><ul>{method.caveats.map((item) => <li key={item}>{item}</li>)}</ul></details>)}
          <form className="evidence-form" onSubmit={(event) => void submitEvidence(event)}>
            <h3><Plus size={15} /> {t("stageSyntheticEvidence")}</h3>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t("evidencePlaceholder")} aria-label={t("syntheticEvidenceText")} />
            <button type="submit" aria-busy={busy === "stage"} disabled={Boolean(busy) || !draft.trim()}>{busy === "stage" ? <RefreshCw className="spin" size={15} /> : <Plus size={15} />} {busy === "stage" ? t("staging") : t("stageForReview")}</button>
          </form>
          <div className="staging-list">
            {!snapshot.staging.some((item) => item.id.startsWith("stage-evidence-web-")) && <p className="empty-inline">{t("noStagedEvidence")}</p>}
            {snapshot.staging.filter((item) => item.id.startsWith("stage-evidence-web-")).map((item) => <div className="staging-row" key={item.id}><div className="staging-copy"><strong>{item.preview ?? item.id.replace("stage-evidence-web-", "note-")}</strong><span className={`status status-${item.status}`}>{statusLabel(item.status)}</span></div>{item.status === "staged" && <div><button title={t("acceptEvidence")} aria-label={t("acceptEvidence")} disabled={Boolean(busy)} onClick={() => void command("accept", () => api.review(item.id, "accept"))}>{busy === "accept" ? <RefreshCw className="spin" size={14} /> : <Check size={14} />}</button><button title={t("rejectEvidence")} aria-label={t("rejectEvidence")} disabled={Boolean(busy)} onClick={() => void command("reject", () => api.review(item.id, "reject"))}>{busy === "reject" ? <RefreshCw className="spin" size={14} /> : <X size={14} />}</button></div>}</div>)}
          </div>
        </aside>

        <section className={`panel branch-panel ${mobileTab === "branches" ? "mobile-active" : ""}`}>
          <div className="panel-heading"><div><GitBranch size={16} /><h2>{t("mainLineVariations")}</h2></div><span>{snapshot.branches.length ? t("materializedCount", { count: snapshot.branches.length }) : t("analysisNotRun")}</span></div>
          {!snapshot.branches.length ? <div className="empty-state"><GitBranch /><strong>{t("noVariations")}</strong><span>{t("noVariationsHelp")}</span></div> : <div className="branch-layout">
            <div className="branch-tree" role="tree">
              <button className="branch-root" aria-label={t("checkoutMainLineRoot")} onClick={() => void refresh()}><span className="branch-marker main" /><div><strong>{t("mainLine")}</strong><small>{t("currentReviewedPosition")}</small></div></button>
              {branchTree.map((branch) => <button role="treeitem" aria-selected={selectedBranchId === branch.id} className={`branch-row ${selectedBranchId === branch.id ? "selected" : ""}`} style={{ paddingLeft: `${18 + branch.depth * 18}px` }} key={branch.id} onClick={() => setSelectedBranchId(branch.id)}><span className={`branch-marker purpose-${branch.purpose}`} /><div><strong>{branch.title}</strong><small>{t("branchMeta", { purpose: statusLabel(branch.purpose), realization: statusLabel(branch.realization), depth: branch.depth, child: branch.parentId ? t("child") : "" })}</small></div>{branch.state === "pinned" && <Pin size={13} />}</button>)}
            </div>
            {selectedBranch && <div className="branch-detail">
              <div className="branch-labels"><span className={`status purpose-${selectedBranch.purpose}`}>{t("purpose")}: {statusLabel(selectedBranch.purpose)}</span><span className="status">{t("realization")}: {statusLabel(selectedBranch.realization)}</span><span className="status">{t("state")}: {statusLabel(selectedBranch.state)}</span></div>
              <h3>{selectedBranch.title}</h3><p><b>{t("move")}:</b> {selectedBranch.action}</p><p><b>{t("modeledResponse")}:</b> {selectedBranch.modeledResponse}</p>
              <dl><dt>{t("assumptions")}</dt><dd>{selectedBranch.assumptions.join(" ")}</dd><dt>{t("uncertainty")}</dt><dd>{uncertaintyLabel(locale, selectedBranch.uncertainty)}</dd><dt>{t("replanTrigger")}</dt><dd>{selectedBranch.replanTrigger}</dd><dt>{t("frozenContext")}</dt><dd>{selectedBranch.contextSnapshotId}</dd><dt>{t("evidenceCutoff")}</dt><dd>{shortTime(selectedBranch.evaluation.evidenceCutoff)}</dd><dt>{t("horizon")}</dt><dd>{shortTime(selectedBranch.evaluation.horizon)}</dd><dt>{t("riskPolicy")}</dt><dd>{selectedBranch.evaluation.riskPolicy}</dd><dt>{t("evaluationProfile")}</dt><dd>{selectedBranch.evaluation.evaluationProfile}</dd><dt>{t("objectiveWeights")}</dt><dd>{snapshot.context.objectives.map((item) => `${item.partyLabel} ${Math.round(item.weight * 100)}%`).join(" · ")}</dd><dt>{t("scoreUncertainty")}</dt><dd>{uncertaintyLabel(locale, selectedBranch.evaluation.uncertainty)}</dd></dl>
              <ScoreView scorecards={selectedBranch.evaluation.partyScorecards} locale={locale} label={t("selectedBranch")} />
              <section className="branch-compare" aria-label={t("branchComparison")}><label><span>{t("compareBranch")}</span><select value={compareBranchId ?? ""} onChange={(event) => setCompareBranchId(event.target.value)}>{snapshot.branches.filter((branch) => branch.id !== selectedBranch.id).map((branch) => <option value={branch.id} key={branch.id}>{branch.title} · {statusLabel(branch.purpose)}</option>)}</select></label>{comparedBranch && <><p><b>{comparedBranch.title}</b> · {statusLabel(comparedBranch.purpose)} · {statusLabel(comparedBranch.realization)}</p>{branchDiff.length === 0 ? <p>{t("noProjectedBranchDifferences")}</p> : branchDiff.map((item) => <p key={item.labelKey}><b>{t(item.labelKey)}</b> {item.added.length ? `+${item.added.join(", ")}` : ""} {item.removed.length ? `-${item.removed.join(", ")}` : ""}</p>)}<ScoreView label={t("comparedBranch")} locale={locale} scorecards={comparedBranch.evaluation.partyScorecards} /></>}</section>
              <div className="branch-actions"><button title={t("checkoutVariation")} disabled={Boolean(busy) || snapshot.selectedPositionId === selectedBranch.positionId} onClick={() => void refresh(selectedBranch.positionId)}><ChevronRight size={15} /> {snapshot.selectedPositionId === selectedBranch.positionId ? t("checkedOut") : t("checkout")}</button><button title={t("pinVariation")} disabled={Boolean(busy)} onClick={() => void command("pin", () => api.pin(selectedBranch.id))}>{busy === "pin" ? <RefreshCw className="spin" size={15} /> : <Pin size={15} />} {busy === "pin" ? t("pinning") : t("pin")}</button><button title={t("replayFrozenContext")} disabled={Boolean(busy)} onClick={() => void command("replay", () => api.replay(selectedBranch.id))}>{busy === "replay" ? <RefreshCw className="spin" size={15} /> : <ArchiveRestore size={15} />} {busy === "replay" ? t("replaying") : t("replay")}</button><button title={t("forkVariation")} disabled={Boolean(busy)} onClick={() => void command("fork", () => api.fork(selectedBranch.id))}>{busy === "fork" ? <RefreshCw className="spin" size={15} /> : <Split size={15} />} {busy === "fork" ? t("forking") : t("fork")}</button></div>
            </div>}
          </div>}
          {snapshot.searchRuns[0] && <div className="search-budget"><div><strong>{statusLabel(snapshot.searchRuns[0].status)}</strong><span>{localizeSearchStopReason(locale, snapshot.searchRuns[0].stopReason, t("policyTerminal"))}</span></div><span>{t("searchUsage", { positions: snapshot.searchRuns[0].usage.materializedPositions ?? 0, calls: snapshot.searchRuns[0].usage.analysisCalls ?? 0, depth: snapshot.searchRuns[0].budgets.maxDepth ?? t("open") })}</span>{["paused-budget", "paused-user", "failed"].includes(snapshot.searchRuns[0].status) && <button disabled={Boolean(busy)} onClick={() => void command("resume", () => api.resume(snapshot.searchRuns[0]!.id))}>{busy === "resume" ? <RefreshCw className="spin" size={14} /> : <Play size={14} />} {busy === "resume" ? t("resuming") : t("resumeBudget")}</button>}</div>}
        </section>
      </main>

      {selectedNode && <aside className="node-drawer" aria-label={t("pawnDetail")}>
        <div className="drawer-heading"><div className="avatar"><UserRound size={20} /></div><div><small>{selectedNode.profileLabel} · {selectedNode.type}</small><h2>{selectedNode.label}</h2></div><button className="icon-button" title={t("closePawnDetail")} aria-label={t("closePawnDetail")} onClick={() => setSelectedNodeId(undefined)}><X size={17} /></button></div>
        <section><h3>{t("identityProfile")}</h3><dl className="drawer-meta"><dt>{t("universalType")}</dt><dd>{selectedNode.type}</dd><dt>{t("profileLabel")}</dt><dd>{selectedNode.profileLabel}</dd><dt>{t("roleSignals")}</dt><dd>{selectedNodeRelations.map((relation) => `${relation.source === selectedNode.id ? t("outgoing") : t("incoming")} ${statusLabel(relation.type)}`).join(" · ") || t("noTypedRole")}</dd><dt>{t("stance")}</dt><dd>{stanceClaims.map((claim) => claim.proposition ?? claim.kind).join(" · ") || t("noStance")}</dd><dt>{t("positionProfile")}</dt><dd>{selectedPosition?.profileSnapshotId}</dd></dl></section>
        <section><h3>{t("stateAtCutoff")}</h3>{selectedNode.states.length ? selectedNode.states.map((state) => <div className="state-row" key={state.id}><strong>{statusLabel(state.type)}</strong><span>{JSON.stringify(state.value)}</span></div>) : <p className="muted">{t("noVisibleState")}</p>}</section>
        <section><h3>{t("claimsAtCutoff")}</h3>{selectedNode.claims.length ? selectedNode.claims.map((claim) => <article className="claim-row" key={claim.id}><div><span className={`status status-${claim.status}`}>{statusLabel(claim.status)}</span><small>{t("revision")} {claim.revision}</small></div><p>{claim.proposition ?? claim.kind}</p><small>{claim.evidenceRefs.join(", ")}</small></article>) : <p className="muted">{t("noProfileClaim")}</p>}</section>
        <section><h3>{t("relationsFlows")}</h3>{selectedNodeRelations.map((relation) => <div className="trace-source" key={relation.id}><Network size={14} /><div><strong>{statusLabel(relation.type)}</strong><span>{relation.source} → {relation.target} · {t("claims")} {relation.claimRefs.join(", ")}</span></div></div>)}{selectedNodeFlows.map((flow) => <div className="trace-source" key={flow.id}><Activity size={14} /><div><strong>{statusLabel(flow.type)} {t("flowSuffix")}</strong><span>{flow.path.join(" → ")} · {t("claims")} {flow.claimRefs.join(", ")}</span></div></div>)}{!selectedNodeRelations.length && !selectedNodeFlows.length && <p className="muted">{t("noVisibleRelationFlow")}</p>}</section>
        <section><h3>{t("timeline")}</h3>{selectedNodeTimeline.length ? selectedNodeTimeline.map((event) => <div className="node-event" key={event.id}><strong>{event.summary}</strong><span>{shortTime(event.occurredAt)} · {statusLabel(event.mode)} · {statusLabel(event.cutoffStatus)}</span></div>) : <p className="muted">{t("noLinkedEvent")}</p>}</section>
        <section><h3>{t("profileHistory")}</h3>{selectedNodeProfileHistory.length ? selectedNodeProfileHistory.map((profile) => <div className="profile-snapshot" key={profile.id}><strong>{profile.id === selectedPosition?.profileSnapshotId ? t("selectedSnapshot") : t("laterSnapshot")}</strong><span>{profile.id} · {shortTime(profile.asOf)} · {profile.version}</span></div>) : <p className="muted">{t("noProfileSnapshot")}</p>}</section>
        <section><h3>{t("reviewedCorrections")}</h3>{snapshot.revisionProposals.filter((proposal) => proposal.subjectNodeId === selectedNode.id).map((proposal) => { const actionable = proposal.reviewStatus === "accepted" && !proposal.applied; return <article className="revision-row" key={proposal.id}><p>{proposal.interpretation}</p><small>{t("evidence")}: {proposal.evidenceRefs.join(", ")}</small><button disabled={!actionable || Boolean(busy)} onClick={() => void command("revision", () => api.applyRevision(proposal.id))}>{proposal.applied ? <Check size={14} /> : busy === "revision" ? <RefreshCw className="spin" size={14} /> : actionable ? <RefreshCw size={14} /> : <Info size={14} />}{proposal.applied ? t("appliedAppendOnly") : busy === "revision" ? t("applying") : actionable ? t("applyRevision") : t("awaitingReview")}</button></article>; })}</section>
        <section><h3>{t("trace")}</h3>{[...new Set(selectedNode.claims.flatMap((claim) => claim.evidenceRefs))].map((id) => { const source = snapshot.trace.evidence.find((item) => item.id === id); return <div className="trace-source" key={id}><ShieldCheck size={14} /><div><strong>{id}</strong><span>{source ? `${source.sourceKind} · ${source.integrity}` : t("sourceUnavailable")}</span></div></div>; })}</section>
      </aside>}
    </div>
  );
}
