"use client";

import React, { useState } from "react";

export default function NewIncidentModal({ isOpen, onClose, onIncidentCreated }) {
  const [title, setTitle] = useState("");
  const [service, setService] = useState("API Gateway");
  const [severity, setSeverity] = useState("P2");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !service.trim()) {
      setError("Please provide an incident title and service.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          service: service.trim(),
          severity,
          description: description.trim() || "No additional description provided.",
          status: "open",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create incident (${res.status})`);
      }

      const createdResponse = await res.json();
      const newIncident = createdResponse.incident || createdResponse;

      // Reset form
      setTitle("");
      setDescription("");
      onIncidentCreated(newIncident);
      onClose();
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: "flex" }}>
      <div className="modal-container" id="modal-new-incident">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">🤖</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--accent)", marginBottom: "2px" }}>
                IncidentMind AI Agent
              </div>
              <h3 className="modal-title">Create Production Incident</h3>
              <p className="modal-subtitle">
                IncidentMind will investigate this incident using historical knowledge from Hindsight and AI reasoning.
              </p>
            </div>
          </div>
          <button
            className="icon-btn mini"
            id="btn-close-new-incident-modal"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} id="form-new-incident">
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

            <div className="form-group">
              <label className="form-label">Incident title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Database connection pool exhausted during checkout"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Service *</label>
                <select
                  className="form-select"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="API Gateway">API Gateway</option>
                  <option value="Payment API">Payment API</option>
                  <option value="Authentication Service">Authentication Service</option>
                  <option value="Order Service">Order Service</option>
                  <option value="Database Cluster">Database Cluster</option>
                  <option value="Notification Service">Notification Service</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity *</label>
                <select
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Symptoms / Evidence</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Describe observed errors, slow response times, recent deployments, or stack traces..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" id="new-incident-footer">
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="action-btn primary-btn"
              id="btn-analyze-incident"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Incident..." : "Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
