"use client";

import React from "react";

export function getSeverityMeta(severity) {
  const s = String(severity || "").toUpperCase();
  if (s === "P1" || s === "CRITICAL") {
    return { label: "🔴 Critical", className: "critical" };
  }
  if (s === "P2" || s === "HIGH") {
    return { label: "🟠 High", className: "high" };
  }
  if (s === "P3" || s === "MEDIUM") {
    return { label: "🟡 Medium", className: "medium" };
  }
  return { label: "🟢 Low", className: "low" };
}

export function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

export default function IncidentList({
  incidents = [],
  selectedIncidentId,
  onSelectIncident,
  isLoading,
}) {
  const activeIncidents = incidents.filter(
    (inc) => inc.status !== "resolved"
  );
  const resolvedIncidents = incidents.filter(
    (inc) => inc.status === "resolved"
  );

  if (isLoading && incidents.length === 0) {
    return (
      <div className="incident-list-column" id="incident-list-column">
        <div className="incident-list-header">
          <span className="list-section-label">Loading Incidents...</span>
        </div>
        <div style={{ padding: "16px", color: "var(--text-tertiary)" }}>
          Connecting to Supabase...
        </div>
      </div>
    );
  }

  const renderCard = (inc) => {
    const isSelected = inc.id === selectedIncidentId;
    const sev = getSeverityMeta(inc.severity);
    const shortId = inc.id ? (inc.id.length > 8 ? inc.id.slice(0, 8) : inc.id) : "INC";

    return (
      <div
        key={inc.id}
        className={`incident-card ${isSelected ? "active" : ""}`}
        onClick={() => onSelectIncident(inc)}
        style={{ cursor: "pointer" }}
      >
        <div className="inc-card-header">
          <span className="inc-card-service">{inc.service || "System Service"}</span>
          <span className={`inc-card-severity ${sev.className}`}>
            {sev.label}
          </span>
        </div>
        <div className="inc-card-title">{inc.title || "Untitled Incident"}</div>
        <div className="inc-card-footer">
          <span className="inc-card-time">{formatRelativeTime(inc.created_at)}</span>
          <span className="inc-card-status">
            #{shortId} · {inc.status || "open"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="incident-list-column" id="incident-list-column">
      <div className="incident-list-header">
        <span className="list-section-label">
          Active Incidents ({activeIncidents.length})
        </span>
      </div>
      <div id="incident-list-container">
        {activeIncidents.length > 0 ? (
          activeIncidents.map(renderCard)
        ) : (
          <div style={{ padding: "16px", color: "var(--text-tertiary)", fontSize: "13px" }}>
            No active incidents. System is healthy.
          </div>
        )}
      </div>

      <div className="incident-list-divider">
        <span>Resolved ({resolvedIncidents.length})</span>
      </div>
      <div id="resolved-list-container">
        {resolvedIncidents.length > 0 ? (
          resolvedIncidents.map(renderCard)
        ) : (
          <div style={{ padding: "16px", color: "var(--text-tertiary)", fontSize: "13px" }}>
            No resolved incidents yet.
          </div>
        )}
      </div>
    </div>
  );
}
