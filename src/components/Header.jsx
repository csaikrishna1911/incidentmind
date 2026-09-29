"use client";

import React from "react";

export default function Header({
  pageTitle = "Incidents",
  onOpenMobileMenu,
  onOpenNewIncident,
  criticalCount = 0,
  activeCount = 0,
  resolvedCount = 0,
  currentView = "incidents",
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-toggle-btn icon-btn"
          id="mobile-menu-btn"
          aria-label="Open Navigation"
          onClick={onOpenMobileMenu}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="header-title-group">
          <h1 className="header-title" id="page-title">
            {pageTitle}
          </h1>
          <span className="header-badge" id="memory-status-badge" title="Hindsight persistent memory bank is online">
            <span className="status-dot"></span>
            <span className="badge-text">🧠 Hindsight Active</span>
          </span>
        </div>
      </div>
      <div className="header-right">
        {currentView === "incidents" && (
          <>
            <div className="incident-summary-header" id="incident-summary-header">
              {criticalCount > 0 && (
                <span className="inc-sum-pill critical">
                  {criticalCount} Critical
                </span>
              )}
              <span className="inc-sum-pill active">{activeCount} Active</span>
              <span className="inc-sum-pill resolved">
                {resolvedCount} Resolved
              </span>
            </div>
            <button
              className="action-btn primary-btn"
              id="btn-new-incident"
              onClick={onOpenNewIncident}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="btn-icon"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span className="btn-text">New Incident</span>
            </button>
          </>
        )}
        <div
          className="api-mode-pill"
          id="api-mode-indicator"
          title="IncidentMind AI Reasoning Layer"
        >
          <span className="pill-dot"></span>
          <span className="pill-text">Groq + Hindsight Live</span>
        </div>
      </div>
    </header>
  );
}
