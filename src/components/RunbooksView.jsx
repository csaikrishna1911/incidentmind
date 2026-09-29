"use client";

import React, { useState } from "react";

const RUNBOOKS_DATA = [
  {
    id: "rb_1",
    title: "Database Connection Pool Exhaustion",
    service: "Payment API, Database Cluster",
    usedTimes: 18,
    successRate: 94,
    summary: "Resolve database connection pool exhaustion causing downstream service timeouts.",
    symptoms: [
      "High rate of connection timeout errors (HTTP 503 or 500)",
      "psycopg2.OperationalError / pool exhaustion in logs",
      "Error rate correlated with recent deployments or traffic peaks",
      "Database connection pool metrics reaching 99% capacity",
    ],
    diagnosis: [
      "Check connection pool metrics in Prometheus: db_pool_utilization_ratio > 80%",
      "Inspect long-running idle in transaction queries holding connections",
      "Verify whether recent deployment changed pool size or request concurrency",
      "Query pg_stat_activity to determine connection source services",
    ],
    resolution: [
      "Increase connection pool size environment variable (e.g. 10 → 50)",
      "Deploy configuration change with rolling restart",
      "If leak or regression introduced by deployment: initiate safe rollback",
      "Confirm error rate normalizes and connection pool usage drops below 70%",
      "Retain incident learning and update postmortem in Hindsight",
    ],
    relatedIncidents: ["44c27a21", "INC-0871", "TEST-001"],
  },
  {
    id: "rb_2",
    title: "API Gateway Latency Spike",
    service: "API Gateway, Microservices",
    usedTimes: 12,
    successRate: 91,
    summary: "Diagnose and resolve unexpected API response time degradation after deployment.",
    symptoms: [
      "P99 latency exceeding 2x baseline",
      "Downstream services reporting request queue saturation",
      "Upstream timeouts observed by mobile and web clients",
    ],
    diagnosis: [
      "Check API Gateway latency per endpoint in OpenTelemetry traces",
      "Inspect database slow query logs and cache hit ratio",
      "Verify downstream dependency response times (Auth, Payment)",
      "Review git diff of recent deployment for performance regressions",
    ],
    resolution: [
      "If downstream DB pool saturated: apply connection pool mitigation",
      "If sudden traffic spike: enable rate limiting or scale gateway horizontally",
      "If code regression: rollback deployment to last known stable tag",
      "Enable distributed tracing to isolate bottleneck service",
    ],
    relatedIncidents: ["44c27a21", "INC-1039", "INC-0998"],
  },
  {
    id: "rb_3",
    title: "Authentication Token Timeout",
    service: "Authentication Service",
    usedTimes: 9,
    successRate: 96,
    summary: "Resolve widespread JWT or token validation failures and timeouts across services.",
    symptoms: [
      "High rate of 401 Unauthorized or login timeout after 30 seconds",
      "Token refresh rate spike",
      "Users unable to authenticate across services",
    ],
    diagnosis: [
      "Check if signing key rotation was recently performed",
      "Check database connection pool for Auth Service (historical pattern)",
      "Compare JWK endpoint output across service instances",
    ],
    resolution: [
      "Verify Auth Service database connection health",
      "If key rotation mismatch: rollback to previous signing key",
      "Force key propagation across all services simultaneously",
    ],
    relatedIncidents: ["673dadea", "INC-0903", "INC-0715"],
  },
];

export default function RunbooksView() {
  const [selectedRunbook, setSelectedRunbook] = useState(null);

  if (selectedRunbook) {
    return (
      <div className="runbooks-page-container">
        <button
          className="action-btn secondary-btn"
          onClick={() => setSelectedRunbook(null)}
          style={{ marginBottom: "16px" }}
        >
          ← Back to Runbooks
        </button>

        <div className="runbook-detail-panel" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span className="inc-severity-badge critical" style={{ fontSize: "11px", marginBottom: "6px", display: "inline-block" }}>
                {selectedRunbook.service}
              </span>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                {selectedRunbook.title}
              </h2>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Used {selectedRunbook.usedTimes} times · <strong style={{ color: "var(--success-text)" }}>{selectedRunbook.successRate}% Success</strong>
            </div>
          </div>

          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            {selectedRunbook.summary}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="rb-detail-section">
              <h4 className="rb-sec-title">1. Observed Symptoms</h4>
              <ul style={{ margin: "8px 0 0 20px", fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.6" }}>
                {selectedRunbook.symptoms.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rb-detail-section">
              <h4 className="rb-sec-title">2. Diagnosis Steps</h4>
              <ul style={{ margin: "8px 0 0 20px", fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.6" }}>
                {selectedRunbook.diagnosis.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="rb-detail-section">
              <h4 className="rb-sec-title">3. Verified Resolution Steps</h4>
              <ol style={{ margin: "8px 0 0 20px", fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.6" }}>
                {selectedRunbook.resolution.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </div>

            <div className="rb-detail-section" style={{ background: "rgba(0, 113, 227, 0.06)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <h4 className="rb-sec-title" style={{ color: "var(--accent)" }}>
                🧠 Correlated Historical Incidents in Hindsight
              </h4>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                This runbook was synthesized from lessons learned in incidents:{" "}
                {selectedRunbook.relatedIncidents.map((incId, idx) => (
                  <strong key={idx} style={{ color: "var(--text-primary)" }}>
                    #{incId}{idx < selectedRunbook.relatedIncidents.length - 1 ? ", " : ""}
                  </strong>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="runbooks-page-container">
      <div style={{ marginBottom: "20px" }}>
        <h2 className="section-title">Operational Runbooks</h2>
        <p className="section-subtitle">
          Verified mitigation procedures synthesized from past incident postmortems in Hindsight memory.
        </p>
      </div>

      <div className="runbooks-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {RUNBOOKS_DATA.map((rb) => (
          <div
            key={rb.id}
            className="runbook-card"
            onClick={() => setSelectedRunbook(rb)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="inc-card-service">{rb.service}</span>
              <span className="sim-match-pill" style={{ color: "var(--success-text)", borderColor: "var(--success-border)" }}>
                {rb.successRate}% Success
              </span>
            </div>

            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              {rb.title}
            </h3>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "14px" }}>
              {rb.summary}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
              <span>Executed {rb.usedTimes} times</span>
              <span style={{ color: "var(--accent)", fontWeight: 500 }}>View Procedure →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
