"use client";

import React, { useState } from "react";
import IncidentChat from "./IncidentChat";
import { getSeverityMeta } from "./IncidentList";

function getHistoricalInsights(memories) {
  if (!memories || memories.length === 0) {
    return { title: null, resolution: null };
  }
  for (const m of memories) {
    const text = m.text || "";
    const incidentMatch = text.match(/Incident:\s*([^\n]+)/i);
    const resolutionMatch = text.match(/(?:What Worked|Resolution|Resolution Steps):\s*([^\n]+)/i);
    if (incidentMatch || resolutionMatch) {
      return {
        title: incidentMatch ? incidentMatch[1].trim() : (m.documentId ? `Document #${m.documentId}` : null),
        resolution: resolutionMatch ? resolutionMatch[1].trim() : null,
      };
    }
  }
  const first = memories[0];
  return {
    title: first?.documentId ? `Historical Incident (${first.documentId})` : (first?.text ? first.text.slice(0, 80) + "..." : null),
    resolution: null,
  };
}

export default function IncidentDetail({
  incident,
  analysisData,
  postmortemData,
  isAnalyzing,
  onRunAnalysis,
  onStatusChange,
  onOpenPostmortem,
  analysisError,
}) {
  const [showMemoriesPopup, setShowMemoriesPopup] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  if (!incident) {
    return (
      <div className="incident-empty-state" id="incident-empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="empty-icon"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h3>Select an incident</h3>
        <p>Choose an incident from the list to view AI recommendations powered by Hindsight memory and Groq reasoning.</p>
      </div>
    );
  }

  const sev = getSeverityMeta(incident.severity);
  const isResolved = incident.status === "resolved";
  const analysis = analysisData?.analysis;
  const hindsightMemories = analysisData?.hindsight?.memories || [];
  const memoriesCount = analysisData?.hindsight?.memoriesFound ?? hindsightMemories.length;
  const correlatedMemoriesCount = analysis?.historicalEvidence?.length || 0;
  const historicalInsight = getHistoricalInsights(hindsightMemories);

  return (
    <div className="incident-detail-content" id="incident-detail-content">
      {/* 1. Detail Header */}
      <div className="inc-detail-header">
        <div className="inc-detail-meta">
          <div className="inc-id-row">
            <span className="inc-id-label" id="detail-inc-id">
              #{incident.id.slice(0, 8)}
            </span>
            <span className={`inc-severity-badge ${sev.className}`}>
              {sev.label}
            </span>
            <span className="inc-status-badge">
              {incident.status ? incident.status.toUpperCase() : "OPEN"}
            </span>
          </div>
          <div className="inc-service-name" id="detail-service">
            {incident.service || "Core Service"}
          </div>
          <div className="inc-title-main" id="detail-title">
            {incident.title}
          </div>
        </div>

        <div className="inc-detail-actions" style={{ display: "flex", gap: "8px" }}>
          <button
            className="action-btn secondary-btn"
            onClick={() => onOpenPostmortem(incident)}
            title="Write or view incident postmortem"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="btn-icon"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>{postmortemData ? "View Postmortem" : "Postmortem"}</span>
          </button>

          <button
            className={`action-btn ${isResolved ? "secondary-btn" : "primary-btn"}`}
            id="btn-resolve-incident"
            onClick={() => onStatusChange(incident.id, isResolved ? "investigating" : "resolved")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="btn-icon"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{isResolved ? "Reopen Incident" : "Resolve Incident"}</span>
          </button>
        </div>
      </div>

      {/* 2. THE LEARNING LOOP CONFIRMATION (P0 - When Resolved with Postmortem) */}
      {isResolved && postmortemData && (postmortemData.root_cause || postmortemData.what_worked) && (
        <div className="learning-loop-card" id="learning-loop-card">
          <div className="learning-loop-header">
            <div className="learning-loop-title">
              <span>✓ Incident Resolved</span>
              <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>·</span>
              <span>🧠 Learning Retained in Hindsight</span>
            </div>
            <span className="learning-loop-badge">Operational Memory Active</span>
          </div>
          <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "var(--text-primary)" }}>
            This resolution is now preserved as operational memory in Hindsight and will automatically guide future incident investigations.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "10px" }}>
            {postmortemData.root_cause && (
              <div className="hindsight-aha-item">
                <strong style={{ color: "var(--critical-text)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Root Cause</strong>
                <span>{postmortemData.root_cause}</span>
              </div>
            )}
            {postmortemData.what_worked && (
              <div className="hindsight-aha-item">
                <strong style={{ color: "var(--success-text)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Resolution</strong>
                <span>{postmortemData.what_worked}</span>
              </div>
            )}
            {postmortemData.lessons_learned && (
              <div className="hindsight-aha-item">
                <strong style={{ color: "var(--accent)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Lesson Learned</strong>
                <span>{postmortemData.lessons_learned}</span>
              </div>
            )}
          </div>
          <div className="learning-loop-cycle-diagram">
            <span className="cycle-step">Past Memory</span>
            <span className="cycle-arrow">→</span>
            <span className="cycle-step">Current Investigation</span>
            <span className="cycle-arrow">→</span>
            <span className="cycle-step">Resolution</span>
            <span className="cycle-arrow">→</span>
            <span className="cycle-step" style={{ color: "var(--accent)" }}>New Hindsight Memory</span>
            <span className="cycle-arrow">→</span>
            <span className="cycle-step" style={{ color: "var(--success-text)" }}>Future Incident Recall</span>
          </div>
        </div>
      )}

      {/* 3. Incident Telemetry & Facts */}
      <div className="inc-section-card">
        <div className="inc-section-title">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="sec-icon"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Incident Context & Facts
        </div>
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "14px" }}>
          {incident.description || "No description provided for this incident."}
        </p>

        <div className="inc-metrics-row">
          <div className="metric-box">
            <span className="metric-box-label">Service</span>
            <span className="metric-box-val">{incident.service || "N/A"}</span>
          </div>
          <div className="metric-box">
            <span className="metric-box-label">Severity</span>
            <span className="metric-box-val">{incident.severity || "P2"}</span>
          </div>
          <div className="metric-box">
            <span className="metric-box-label">Reported</span>
            <span className="metric-box-val">
              {incident.created_at ? new Date(incident.created_at).toLocaleDateString() : "Live"}
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-box-label">Author</span>
            <span className="metric-box-val">{incident.created_by || "System Alert"}</span>
          </div>
        </div>

        <details className="logs-expander" open={showLogs} onToggle={(e) => setShowLogs(e.target.open)}>
          <summary className="logs-summary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mini-icon"
            >
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            System Context & Raw Details
          </summary>
          <div className="logs-content" style={{ marginTop: "10px" }}>
            <pre className="log-pre">
              {JSON.stringify(
                {
                  id: incident.id,
                  title: incident.title,
                  service: incident.service,
                  severity: incident.severity,
                  status: incident.status,
                  created_at: incident.created_at,
                  resolved_at: incident.resolved_at,
                },
                null,
                2
              )}
            </pre>
          </div>
        </details>
      </div>

      {/* 4. INCIDENTMIND AGENT CONSOLE (P0 - Centerpiece of Investigation) */}
      <div className="agent-console-card" id="agent-console-card">
        <div className="agent-header-row">
          <div className="agent-identity-group">
            <span className="agent-robot-icon">🤖</span>
            <div>
              <div className="agent-title-text">
                IncidentMind Agent
              </div>
              <div className="agent-subtitle-text">
                AI-powered incident investigation using persistent operational memory
              </div>
              <div className="agent-architecture-badges">
                <span className="agent-arch-pill memory" title="Long-term semantic memory storage">
                  🧠 Persistent Memory: Hindsight
                </span>
                <span className="agent-arch-pill engine" title="Fast structured reasoning model">
                  ⚡ Reasoning Engine: Groq ({analysisData?.model || "openai/gpt-oss-120b"})
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {analysis?.likelyCauses?.[0]?.confidence && (
              <div className="ai-confidence-row">
                <span className="confidence-label">Confidence</span>
                <span className="confidence-value" id="ai-confidence">
                  {analysis.likelyCauses[0].confidence.toUpperCase()}
                </span>
              </div>
            )}
            <button
              className="action-btn primary-btn"
              id="btn-investigate-incidentmind"
              onClick={() => onRunAnalysis(incident.id)}
              disabled={isAnalyzing}
              style={{ fontSize: "12.5px", padding: "7px 14px", fontWeight: 600 }}
            >
              {isAnalyzing
                ? "Investigating with IncidentMind..."
                : analysis
                ? "Re-investigate with IncidentMind"
                : "Investigate with IncidentMind"}
            </button>
          </div>
        </div>

        {/* 4A. AGENT INVESTIGATION TRACE DURING EXECUTION (P0) */}
        {isAnalyzing && (
          <div className="investigation-trace-box" id="agent-investigation-trace-active">
            <div className="trace-header">
              <span style={{ color: "var(--accent)" }}>● Agent is investigating...</span>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Autonomous Pipeline</span>
            </div>
            <div className="trace-steps-list">
              <div className="trace-step-item completed">
                <span className="trace-step-icon done">✓</span>
                <span>Incident received</span>
              </div>
              <div className="trace-step-item active">
                <span className="trace-step-icon pulsing">●</span>
                <span>Recalling historical incidents from Hindsight persistent memory...</span>
              </div>
              <div className="trace-step-item pending">
                <span className="trace-step-icon">○</span>
                <span>Correlating historical evidence with observed symptoms</span>
              </div>
              <div className="trace-step-item pending">
                <span className="trace-step-icon">○</span>
                <span>Reasoning with Groq engine</span>
              </div>
              <div className="trace-step-item pending">
                <span className="trace-step-icon">○</span>
                <span>Generating root-cause hypotheses</span>
              </div>
              <div className="trace-step-item pending">
                <span className="trace-step-icon">○</span>
                <span>Preparing recommended actions</span>
              </div>
            </div>
          </div>
        )}

        {/* 4B. AGENT ERROR STATE */}
        {!isAnalyzing && analysisError && (
          <div style={{ padding: "14px", background: "var(--critical-bg)", border: "1px solid var(--critical-border)", borderRadius: "var(--radius-md)", color: "var(--critical-text)", fontSize: "13px", marginTop: "12px" }}>
            <strong>Investigation Error:</strong> {analysisError}
          </div>
        )}

        {/* 4C. AGENT INVESTIGATION COMPLETE & TRACE (P0) */}
        {!isAnalyzing && analysis && (
          <>
            <div className="investigation-trace-box" id="agent-investigation-trace-complete">
              <div className="trace-header">
                <span style={{ color: "var(--success-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: 700 }}>✓</span> IncidentMind Agent — Investigation Complete
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  Trace Verified
                </span>
              </div>
              <div className="trace-steps-list">
                <div className="trace-step-item completed">
                  <span className="trace-step-icon done">✓</span>
                  <span>Incident received</span>
                </div>
                <div className="trace-step-item completed">
                  <span className="trace-step-icon done">✓</span>
                  <span>Recalled <strong>{memoriesCount}</strong> historical memories from Hindsight</span>
                </div>
                <div className="trace-step-item completed">
                  <span className="trace-step-icon done">✓</span>
                  <span>Correlated historical evidence with observed symptoms</span>
                </div>
                <div className="trace-step-item completed">
                  <span className="trace-step-icon done">✓</span>
                  <span>Generated root-cause hypotheses</span>
                </div>
                <div className="trace-step-item completed">
                  <span className="trace-step-icon done">✓</span>
                  <span>Generated recommended actions</span>
                </div>
                {analysis.evidenceGaps && analysis.evidenceGaps.length > 0 && (
                  <div className="trace-step-item completed">
                    <span className="trace-step-icon done">✓</span>
                    <span>Identified evidence gaps</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4D. HINDSIGHT "AHA" MOMENT (P0 - Section 7) */}
            {memoriesCount > 0 && (
              <div className="hindsight-aha-card" id="hindsight-aha-moment">
                <div className="hindsight-aha-header">
                  <div className="hindsight-aha-title">
                    <span>🧠 Hindsight Memory</span>
                    <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>·</span>
                    <span style={{ color: "var(--success-text)", fontWeight: 600 }}>Historical evidence found</span>
                  </div>
                  <span className="hindsight-recalled-pill">
                    {memoriesCount} {memoriesCount === 1 ? "memory" : "memories"} recalled
                  </span>
                </div>
                <div className="hindsight-aha-content">
                  {historicalInsight.title && (
                    <div style={{ marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                        Previous related incident:
                      </span>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "1px" }}>
                        {historicalInsight.title}
                      </div>
                    </div>
                  )}
                  {historicalInsight.resolution && (
                    <div style={{ marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                        Relevant resolution:
                      </span>
                      <div style={{ color: "var(--text-primary)", marginTop: "1px" }}>
                        {historicalInsight.resolution}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: "8px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                    The agent correlated these operational memories to bypass cold-start diagnostics and propose verified mitigations.
                  </div>
                </div>
              </div>
            )}

            {/* 4E. EVIDENCE-BASED CONFIDENCE (P0 - Section 9) */}
            {analysis?.likelyCauses?.[0]?.confidence && (
              <div style={{ marginTop: "12px", background: "var(--bg-subtle)", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ fontWeight: 600, fontSize: "12.5px", color: "var(--text-primary)" }}>
                    Confidence: {analysis.likelyCauses[0].confidence.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>
                  Supporting evidence:
                </div>
                <ul style={{ margin: "0 0 8px 16px", color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.5" }}>
                  {memoriesCount > 0 && (
                    <li>• <strong>{memoriesCount}</strong> Hindsight operational memories recalled</li>
                  )}
                  {correlatedMemoriesCount > 0 && (
                    <li>• <strong>{correlatedMemoriesCount}</strong> historical evidence records referenced in reasoning</li>
                  )}
                  <li>• Current incident context: <strong>{incident.service || "Core Service"}</strong> / <strong>{incident.severity || "P2"}</strong></li>
                </ul>
                <div style={{ color: "var(--text-tertiary)", fontSize: "11px", fontStyle: "italic" }}>
                  Confidence is based on historical evidence and current incident context.
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "12.5px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "6px" }}>
                Agent Executive Summary
              </div>
              <div className="ai-rec-text" id="ai-rec-text">
                {analysis.summary}
              </div>
            </div>

            {/* Likely Root Causes */}
            {analysis.likelyCauses && analysis.likelyCauses.length > 0 && (
              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  Hypothesized Root Causes (Ordered by Evidence):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {analysis.likelyCauses.map((lc, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--bg-subtle)",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                          {idx + 1}. {lc.cause}
                        </span>
                        <span
                          className={`inc-severity-badge ${
                            lc.confidence === "high"
                              ? "critical"
                              : lc.confidence === "medium"
                              ? "high"
                              : "low"
                          }`}
                          style={{ fontSize: "10px", padding: "2px 8px" }}
                        >
                          {lc.confidence} confidence
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {lc.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {analysis.recommendedActions && analysis.recommendedActions.length > 0 && (
              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  Prioritized Remediation & Diagnostic Actions:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {analysis.recommendedActions.map((ra, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span
                          style={{
                            background: "var(--accent)",
                            color: "#fff",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {ra.priority || idx + 1}
                        </span>
                        <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                          {ra.action}
                        </strong>
                      </div>
                      <p style={{ margin: "4px 0 0 28px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {ra.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prevention Suggestions */}
            {analysis.preventionSuggestions && analysis.preventionSuggestions.length > 0 && (
              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  Systemic Prevention & Hardening Recommendations:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {analysis.preventionSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        padding: "8px 12px",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <span style={{ color: "var(--success-text)", fontWeight: 700 }}>🛡️</span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Gaps */}
            {analysis.evidenceGaps && analysis.evidenceGaps.length > 0 && (
              <div style={{ marginTop: "14px", background: "rgba(255, 149, 0, 0.08)", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(255, 149, 0, 0.2)" }}>
                <strong style={{ fontSize: "12px", color: "var(--high-text)" }}>
                  ⚠ Evidence Gaps (Missing Information):
                </strong>
                <ul style={{ margin: "6px 0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {analysis.evidenceGaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* 4F. Initial State Before Analysis */}
        {!isAnalyzing && !analysis && !analysisError && (
          <div style={{ padding: "16px 0", borderTop: "1px solid var(--border-subtle)", marginTop: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="status-indicator-dot online"></span>
              <strong style={{ color: "var(--text-primary)", fontSize: "13.5px" }}>Ready to investigate</strong>
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5" }}>
              Historical memory will be recalled when investigation starts.
            </p>
          </div>
        )}
      </div>

      {/* 5. HISTORICAL EVIDENCE FROM HINDSIGHT (P0 - Section 8: Memory -> Reasoning Explicit) */}
      <div className="inc-section-card" id="hindsight-evidence-section">
        <div className="inc-section-title">
          <span>🧠</span>
          Hindsight Evidence & Memory Correlation
          <span className="sim-count-badge" id="similar-count-badge">
            {memoriesCount} recalled
          </span>
        </div>

        {hindsightMemories.length > 0 ? (
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              Operational memories recalled from Hindsight memory bank. The agent correlates these historical records to generate evidence-based hypotheses.
            </div>

            <table className="evidence-correlation-table">
              <thead>
                <tr>
                  <th style={{ width: "55%" }}>Memory / Evidence</th>
                  <th style={{ width: "25%" }}>Relevance</th>
                  <th style={{ width: "20%" }}>Used by Agent</th>
                </tr>
              </thead>
              <tbody>
                {hindsightMemories.map((mem, idx) => {
                  const matchedEvidence = analysis?.historicalEvidence?.find(
                    (he) => he.memoryId === mem.id
                  );
                  const isUsed = Boolean(matchedEvidence);
                  const semanticMatch = mem.scores?.semantic
                    ? Math.round(mem.scores.semantic * 100) + "% match"
                    : null;

                  return (
                    <tr key={mem.id || idx}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)" }}>
                            #{mem.id?.slice(0, 8) || "mem"}
                          </span>
                          {mem.documentId && (
                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                              Doc: {mem.documentId}
                            </span>
                          )}
                          {semanticMatch && (
                            <span className="sim-match-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              {semanticMatch}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12.5px", lineHeight: "1.45", color: "var(--text-primary)" }}>
                          {mem.text}
                        </div>
                      </td>
                      <td style={{ fontSize: "12px" }}>
                        {matchedEvidence?.relevance ? (
                          <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                            {matchedEvidence.relevance}
                          </span>
                        ) : semanticMatch ? (
                          <span style={{ color: "var(--text-secondary)" }}>
                            Semantic index match ({semanticMatch})
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>Retrieved context</span>
                        )}
                      </td>
                      <td>
                        {isUsed ? (
                          <span className="evidence-used-badge">
                            ✓ Used in reasoning
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                            Context pool
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Agent conclusion: Historical evidence contributing to this hypothesis */}
            {analysis?.likelyCauses?.[0]?.reasoning && (
              <div style={{ marginTop: "14px", background: "rgba(0, 113, 227, 0.05)", border: "1px solid rgba(0, 113, 227, 0.2)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", marginBottom: "4px" }}>
                  Agent conclusion: Historical evidence contributing to this hypothesis
                </div>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                  {analysis.likelyCauses[0].reasoning}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "14px 0", color: "var(--text-tertiary)", fontSize: "13px" }}>
            {analysis
              ? "No relevant historical incidents were recalled from Hindsight for this specific pattern."
              : "Click 'Investigate with IncidentMind' above to search Hindsight persistent memory for similar past incidents."}
          </div>
        )}
      </div>

      {/* 6. Team Discussion & Chat (Real Supabase API) */}
      <IncidentChat incidentId={incident.id} />
    </div>
  );
}
