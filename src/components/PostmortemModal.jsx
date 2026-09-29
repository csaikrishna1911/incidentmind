"use client";

import React, { useState, useEffect } from "react";

export default function PostmortemModal({
  isOpen,
  onClose,
  incident,
  onPostmortemSaved,
}) {
  const [rootCause, setRootCause] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [whatFailed, setWhatFailed] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [existingId, setExistingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!incident || !isOpen) return;

    const loadPostmortem = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/incidents/${incident.id}/postmortem`);
        if (res.status === 404) {
          // No postmortem yet
          setExistingId(null);
          setRootCause("");
          setWhatWorked("");
          setWhatFailed("");
          setLessonsLearned("");
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load postmortem (${res.status})`);
        }
        const data = await res.json();
        setExistingId(data.id || data.incident_id);
        setRootCause(data.root_cause || "");
        setWhatWorked(data.what_worked || "");
        setWhatFailed(data.what_failed || "");
        setLessonsLearned(data.lessons_learned || "");
      } catch (err) {
        console.warn("Postmortem fetch info:", err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPostmortem();
  }, [incident, isOpen]);

  if (!isOpen || !incident) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rootCause.trim()) {
      setError("Please describe the root cause of the incident.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        root_cause: rootCause.trim(),
        what_worked: whatWorked.trim() || null,
        what_failed: whatFailed.trim() || null,
        lessons_learned: lessonsLearned.trim() || null,
        created_by: "SRE Operator",
      };

      const method = existingId ? "PATCH" : "POST";
      const res = await fetch(`/api/incidents/${incident.id}/postmortem`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save postmortem (${res.status})`);
      }

      const result = await res.json();
      onPostmortemSaved({
        ...result,
        incidentId: incident.id,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save postmortem");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: "flex" }}>
      <div className="modal-container" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📋</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--accent)", marginBottom: "2px" }}>
                Continuous Operational Learning
              </div>
              <h3 className="modal-title">Incident Post-Mortem & Memory Retention</h3>
              <p className="modal-subtitle">
                Incident #{incident.id.slice(0, 8)}: {incident.title}
              </p>
            </div>
          </div>
          <button className="icon-btn mini" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: "var(--critical-bg)",
                  color: "var(--critical-text)",
                  border: "1px solid var(--critical-border)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                {error}
              </div>
            )}

            {isLoading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                Loading postmortem record...
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Root Cause (Why it happened) *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Deployment v2.4 misconfigured database connection pool size, exhausting active connections under peak load."
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">What Worked (Successful Resolution Steps)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Rolled back deployment and increased pool size from 10 to 50, restoring normal latency in 11 minutes."
                    value={whatWorked}
                    onChange={(e) => setWhatWorked(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">What Failed (Ineffective actions or false leads)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Restarting the API gateway alone did not clear backend connection saturation."
                    value={whatFailed}
                    onChange={(e) => setWhatFailed(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lessons Learned & Prevention Actions</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Added Prometheus alert for connection pool > 80%; added smoke test for DB pool config."
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                  />
                </div>

                <div style={{ background: "rgba(52, 199, 89, 0.08)", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(52, 199, 89, 0.22)", fontSize: "12px", color: "var(--success-text)" }}>
                  💡 <strong>Hindsight Learning Loop:</strong> Saving this postmortem automatically stores its root cause, resolution, and lessons in Hindsight persistent memory to guide future similar incident resolutions.
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="action-btn primary-btn"
              disabled={isSaving || isLoading}
            >
              {isSaving ? "Saving & Retaining in Hindsight..." : "Save Postmortem & Retain in Memory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
