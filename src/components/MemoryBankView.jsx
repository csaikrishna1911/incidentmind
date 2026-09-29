"use client";

import React, { useState, useEffect } from "react";

export default function MemoryBankView({ onMemoryRetained }) {
  const [query, setQuery] = useState("database connection pool deployment");
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState("");
  const [newIncidentRootCause, setNewIncidentRootCause] = useState("");
  const [newIncidentResolution, setNewIncidentResolution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchMemories = async (searchQuery) => {
    if (!searchQuery?.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/hindsight/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          tags: ["incident"],
        }),
      });

      if (!res.ok) {
        throw new Error(`Hindsight search returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setMemories(data.memories || []);
    } catch (err) {
      setError(err.message || "Failed to recall memories from Hindsight");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchMemories(query);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchMemories(query);
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newIncidentTitle.trim() || !newIncidentRootCause.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/hindsight/retain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: "manual-" + Date.now(),
          title: newIncidentTitle.trim(),
          rootCause: newIncidentRootCause.trim(),
          resolution: newIncidentResolution.trim(),
          severity: "SEV2",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to retain memory in Hindsight");
      }

      setIsAddOpen(false);
      setNewIncidentTitle("");
      setNewIncidentRootCause("");
      setNewIncidentResolution("");
      if (onMemoryRetained) onMemoryRetained();
      searchMemories(newIncidentTitle || query);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="memories-page-container">
      <div className="memories-controls-card">
        <div className="memories-header-top">
          <div>
            <h2 className="section-title">Hindsight Memory Bank Explorer</h2>
            <p className="section-subtitle">
              Persistent organizational incident memory. Hindsight stores root causes, postmortems, and resolutions to power Groq AI reasoning.
            </p>
          </div>
          <button
            className="action-btn primary-btn"
            id="btn-open-add-memory"
            onClick={() => setIsAddOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Retain New Memory</span>
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="memories-search-row">
          <div className="search-input-wrapper" style={{ flex: 1, display: "flex", gap: "8px" }}>
            <input
              type="text"
              id="memory-search-input"
              className="form-input"
              placeholder="Query Hindsight memory (e.g. database connection pool, API latency, token timeout)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="action-btn secondary-btn" disabled={isLoading}>
              {isLoading ? "Recalling..." : "Search Memory"}
            </button>
          </div>
        </form>

        <div className="memories-stats-bar" style={{ marginTop: "14px", display: "flex", gap: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <span>Recall Query: <strong style={{ color: "var(--text-primary)" }}>{query}</strong></span>
          <span>Recalled Memories: <strong style={{ color: "var(--accent)" }}>{memories.length}</strong></span>
          <span>Engine: <strong style={{ color: "var(--text-primary)" }}>Hindsight Vectorize</strong></span>
        </div>
      </div>

      {/* Grid of Recalled Memories */}
      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Recalling similar memories from Hindsight engine...
        </div>
      ) : error ? (
        <div style={{ padding: "20px", color: "var(--critical-text)", background: "var(--critical-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--critical-border)" }}>
          {error}
        </div>
      ) : memories.length === 0 ? (
        <div className="memories-empty-state" id="memories-empty-state">
          <h3>No matching memories found</h3>
          <p>Try searching for symptoms such as "database connection pool", "deployment", or "API 503".</p>
        </div>
      ) : (
        <div className="memories-grid" id="memories-grid">
          {memories.map((mem, idx) => (
            <div key={mem.id || idx} className="memory-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="inc-severity-badge low" style={{ fontSize: "11px" }}>
                  {mem.type || "observation"}
                </span>
                {mem.scores?.semantic && (
                  <span className="sim-match-pill" style={{ fontSize: "11px" }}>
                    {Math.round(mem.scores.semantic * 100)}% Match
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--accent)", marginBottom: "4px" }}>
                ID: {mem.id}
              </div>

              <p style={{ margin: "6px 0 10px 0", fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                {mem.text}
              </p>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-tertiary)" }}>
                <span>Doc: {mem.documentId || "Incident Record"}</span>
                {mem.scores?.reranker && <span>Rerank: {mem.scores.reranker.toFixed(3)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Retain Memory Modal */}
      {isAddOpen && (
        <div className="modal-overlay" style={{ display: "flex" }}>
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Retain Memory in Hindsight</h3>
              <button className="icon-btn mini" onClick={() => setIsAddOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMemory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Pattern Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Database Connection Pool Exhaustion on v2.4"
                    value={newIncidentTitle}
                    onChange={(e) => setNewIncidentTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Root Cause *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Deployment increased connection concurrency without increasing pool size."
                    value={newIncidentRootCause}
                    onChange={(e) => setNewIncidentRootCause(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Successful Resolution</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Rolled back deployment and scaled connection pool to 50."
                    value={newIncidentResolution}
                    onChange={(e) => setNewIncidentResolution(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn secondary-btn" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Retaining..." : "Retain in Hindsight Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
