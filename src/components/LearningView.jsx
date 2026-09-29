"use client";

import React from "react";

export default function LearningView() {
  return (
    <div className="learning-page-container" style={{ padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 className="section-title">The Continuous Learning Loop</h2>
        <p className="section-subtitle">
          How IncidentMind uses persistent Hindsight memory and Groq AI reasoning to turn every resolved incident into future operational speed.
        </p>
      </div>

      {/* Comparison Cards: Without vs With Hindsight */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "28px" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "18px" }}>❌</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              Traditional SRE (Cold Start)
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "16px" }}>
            Engineers troubleshoot in isolation. Postmortems sit unread in Google Docs or Confluence. When a similar deployment or DB exhaustion occurs, the on-call team re-discovers the root cause from scratch.
          </p>
          <div style={{ background: "rgba(255, 59, 48, 0.08)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid rgba(255, 59, 48, 0.2)" }}>
            <div style={{ fontSize: "12px", color: "var(--critical-text)", fontWeight: 600 }}>Benchmark MTTR: ~52 min</div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>Cold-start response · Multiple false leads & manual query digging</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>Illustrative benchmark — not calculated from current incident data.</div>
          </div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "2px solid var(--accent)", borderRadius: "var(--radius-lg)", padding: "24px", position: "relative" }}>
          <div style={{ position: "absolute", top: "-10px", right: "16px", background: "var(--accent)", color: "#fff", padding: "2px 10px", borderRadius: "var(--radius-full)", fontSize: "11px", fontWeight: 700 }}>
            INCIDENTMIND
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "18px" }}>🧠</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              With Hindsight Persistent Memory + Groq
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "16px" }}>
            Past postmortems and observations are retained in Hindsight. When a new incident occurs, Hindsight immediately recalls historical evidence. Groq reasons across historical patterns to recommend safe, prioritized remediations.
          </p>
          <div style={{ background: "rgba(52, 199, 89, 0.1)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid rgba(52, 199, 89, 0.25)" }}>
            <div style={{ fontSize: "12px", color: "var(--success-text)", fontWeight: 600 }}>Benchmark MTTR: ~11 min (-78%)</div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>Hindsight-assisted response · Targeted diagnosis & memory-verified mitigations</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>Illustrative benchmark — not calculated from current incident data.</div>
          </div>
        </div>
      </div>

      {/* Architectural Flow Diagram */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
          System Architecture & Data Flow
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>1. 🗄️</div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>Supabase DB</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Operational source of truth for incidents, severity, and team investigation logs.
            </div>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>2. 🧠</div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>Hindsight Memory</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Long-term semantic memory bank. Recalls similar historical incidents and postmortem lessons.
            </div>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>3. ⚡</div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>Groq AI Reasoning</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Fast SRE reasoning layer (openai/gpt-oss-120b) producing structured root-cause hypotheses.
            </div>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>4. 🛡️</div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>IncidentMind UI</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Next.js engineer console displaying telemetry, Hindsight evidence, and actionable steps.
            </div>
          </div>
        </div>
      </div>

      {/* Primary Product Narrative Lifecycle */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          The IncidentMind Operational Lifecycle
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
          IncidentMind is an AI incident-response agent that remembers previous incidents, reasons from that memory, guides investigation, and learns from resolutions.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>Stage 1 · Investigation</span>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginTop: "4px" }}>Incident Ingest & Memory Recall</div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              IncidentMind receives incident telemetry and immediately queries Hindsight persistent memory for matching past failures and resolutions.
            </p>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#5856d6", textTransform: "uppercase" }}>Stage 2 · Correlation</span>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginTop: "4px" }}>Groq AI Evidence-Based Reasoning</div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Groq reasoning engine correlates observed symptoms with recalled memories, producing ranked root-cause hypotheses with confidence levels.
            </p>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--high-text)", textTransform: "uppercase" }}>Stage 3 · Human Action</span>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginTop: "4px" }}>Engineer Guided Mitigation</div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              The on-call SRE reviews prioritized diagnostic steps and mitigation procedures. Human operators stay firmly in control of production actions.
            </p>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-md)", border: "1.5px solid rgba(52, 199, 89, 0.4)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--success-text)", textTransform: "uppercase" }}>Stage 4 · Continuous Learning</span>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", marginTop: "4px" }}>Postmortem Retained in Hindsight</div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Upon resolution, postmortem findings are stored in Supabase and permanently retained in Hindsight memory for future recall.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
