"use client";

import React from "react";

export default function Sidebar({
  currentView,
  onViewChange,
  activeIncidentsCount = 0,
  memoryCount = 0,
  onRefresh,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  return (
    <aside
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
        isMobileOpen ? "mobile-open" : ""
      }`}
      id="sidebar"
    >
      <div className="sidebar-header">
        <div className="brand" onClick={() => onViewChange("incidents")} style={{ cursor: "pointer" }}>
          <div className="brand-icon-wrapper">
            <svg
              className="brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M17 12a5 5 0 0 1-5 5" strokeDasharray="2 2" />
            </svg>
            <span className="pulse-ring"></span>
          </div>
          <div className="brand-text">
            <div className="brand-name">
              Incident<span className="gradient-text">Mind</span>
            </div>
            <div className="brand-subtitle">Hindsight + Groq AI</div>
          </div>
        </div>
        <button
          className="icon-btn sidebar-toggle-btn"
          id="sidebar-toggle-btn"
          title="Toggle Sidebar"
          onClick={onToggleCollapse}
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
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === "incidents" ? "active" : ""}`}
          onClick={() => onViewChange("incidents")}
          id="nav-incidents"
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span className="nav-label">Incidents</span>
          {activeIncidentsCount > 0 && (
            <span className="nav-badge" id="nav-incidents-badge">
              {activeIncidentsCount} Active
            </span>
          )}
        </button>

        <button
          className={`nav-item ${currentView === "memory" ? "active" : ""}`}
          onClick={() => onViewChange("memory")}
          id="nav-memory"
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
          </svg>
          <span className="nav-label">Memory</span>
          <span className="nav-pill" id="nav-memory-count">
            {memoryCount > 0 ? memoryCount : "Live"}
          </span>
        </button>

        <button
          className={`nav-item ${currentView === "runbooks" ? "active" : ""}`}
          onClick={() => onViewChange("runbooks")}
          id="nav-runbooks"
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <line x1="9" y1="7" x2="15" y2="7"></line>
            <line x1="9" y1="11" x2="15" y2="11"></line>
          </svg>
          <span className="nav-label">Runbooks</span>
        </button>

        <button
          className={`nav-item ${currentView === "postmortems" ? "active" : ""}`}
          onClick={() => onViewChange("postmortems")}
          id="nav-postmortems"
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
          <span className="nav-label">Post-Mortems</span>
        </button>

        <button
          className={`nav-item ${currentView === "learning" ? "active" : ""}`}
          onClick={() => onViewChange("learning")}
          id="nav-learning"
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span className="nav-label">Learning</span>
          <span className="nav-tag">Live</span>
        </button>
      </nav>

      {/* Sidebar Status Card */}
      <div className="sidebar-status-card">
        <div className="status-card-header">
          <span className="status-indicator-dot online"></span>
          <span className="status-card-title">Hindsight Memory Engine</span>
        </div>
        <div className="status-metric-row">
          <span className="metric-label">Operational Memory</span>
          <span className="metric-value">Active</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: "100%" }}></div>
        </div>
        <div className="status-card-footer">
          <span>
            Hindsight: <strong>Connected</strong>
          </span>
          <span className="latency-pill">Semantic Recall</span>
        </div>
      </div>

      {/* User Profile / Session */}
      <div className="sidebar-user">
        <div className="user-avatar">SRE</div>
        <div className="user-info">
          <div className="user-name">On-Call Engineer</div>
          <div className="user-role">Platform Team · Supabase Live</div>
        </div>
        <button
          className="icon-btn mini"
          id="btn-quick-reset"
          title="Refresh Incidents"
          onClick={onRefresh}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
        </button>
      </div>
    </aside>
  );
}
