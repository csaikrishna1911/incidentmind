"use client";

import React, { useState, useEffect } from "react";
import PostmortemModal from "./PostmortemModal";

export default function PostmortemsView({ incidents = [], onPostmortemSaved }) {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postmortemsMap, setPostmortemsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch postmortems for all incidents
  useEffect(() => {
    const loadAllPostmortems = async () => {
      if (!incidents || incidents.length === 0) return;
      setIsLoading(true);
      const newMap = {};
      for (const inc of incidents) {
        try {
          const res = await fetch(`/api/incidents/${inc.id}/postmortem`);
          if (res.ok) {
            const data = await res.json();
            newMap[inc.id] = data;
          }
        } catch {
          // ignore individual 404s
        }
      }
      setPostmortemsMap(newMap);
      setIsLoading(false);
    };

    loadAllPostmortems();
  }, [incidents]);

  const handleOpenModal = (inc) => {
    setSelectedIncident(inc);
    setIsModalOpen(true);
  };

  const handleSaved = (pm) => {
    setPostmortemsMap((prev) => ({
      ...prev,
      [pm.incidentId]: pm,
    }));
    if (onPostmortemSaved) onPostmortemSaved(pm);
  };

  return (
    <div className="postmortems-page-container">
      <div style={{ marginBottom: "20px" }}>
        <h2 className="section-title">Incident Post-Mortems & Learning Loop</h2>
        <p className="section-subtitle">
          Document root causes, effective resolutions, and lessons learned. Postmortems are retained in Hindsight to power future incident recall.
        </p>
      </div>

      {isLoading && Object.keys(postmortemsMap).length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
          Checking postmortem records in Supabase...
        </div>
      ) : incidents.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
          No incidents recorded in Supabase yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {incidents.map((inc) => {
            const pm = postmortemsMap[inc.id];
            const hasPm = Boolean(pm && pm.root_cause);

            return (
              <div
                key={inc.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className="inc-id-label">#{inc.id.slice(0, 8)}</span>
                      <span className="inc-card-service">{inc.service}</span>
                      <span className={`inc-severity-badge ${inc.status === "resolved" ? "low" : "critical"}`}>
                        {inc.status || "open"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {inc.title}
                    </h3>
                  </div>

                  <button
                    className={`action-btn ${hasPm ? "secondary-btn" : "primary-btn"}`}
                    onClick={() => handleOpenModal(inc)}
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                  >
                    {hasPm ? "Edit Postmortem" : "+ Write Postmortem"}
                  </button>
                </div>

                {hasPm ? (
                  <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong style={{ fontSize: "12px", color: "var(--critical-text)", textTransform: "uppercase" }}>
                        Root Cause:
                      </strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-primary)" }}>
                        {pm.root_cause}
                      </p>
                    </div>

                    {pm.what_worked && (
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ fontSize: "12px", color: "var(--success-text)", textTransform: "uppercase" }}>
                          What Worked:
                        </strong>
                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-primary)" }}>
                          {pm.what_worked}
                        </p>
                      </div>
                    )}

                    {pm.lessons_learned && (
                      <div>
                        <strong style={{ fontSize: "12px", color: "var(--accent)", textTransform: "uppercase" }}>
                          Lessons Learned:
                        </strong>
                        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-primary)" }}>
                          {pm.lessons_learned}
                        </p>
                      </div>
                    )}

                    <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-tertiary)", display: "flex", gap: "10px" }}>
                      <span>✓ Retained in Hindsight memory bank</span>
                      <span>Author: {pm.created_by || "SRE"}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px", background: "var(--bg-canvas)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                    No postmortem filed yet. Complete the incident investigation to retain its lessons in Hindsight.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedIncident && (
        <PostmortemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          incident={selectedIncident}
          onPostmortemSaved={handleSaved}
        />
      )}
    </div>
  );
}
