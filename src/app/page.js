"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import IncidentList from "@/components/IncidentList";
import IncidentDetail from "@/components/IncidentDetail";
import MemoryBankView from "@/components/MemoryBankView";
import RunbooksView from "@/components/RunbooksView";
import PostmortemsView from "@/components/PostmortemsView";
import LearningView from "@/components/LearningView";
import NewIncidentModal from "@/components/NewIncidentModal";
import PostmortemModal from "@/components/PostmortemModal";
import Toast from "@/components/Toast";

export default function Home() {
  const [currentView, setCurrentView] = useState("incidents");
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [analyses, setAnalyses] = useState({});
  const [postmortems, setPostmortems] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  // Modals & responsive state
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isPostmortemOpen, setIsPostmortemOpen] = useState(false);
  const [postmortemTargetIncident, setPostmortemTargetIncident] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Load real incidents from Supabase
  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoadingIncidents(true);
      const res = await fetch("/api/incidents");
      if (!res.ok) {
        throw new Error(`Failed to load incidents (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setIncidents(list);

      // Default select the first incident if none selected
      setSelectedIncident((prev) => {
        if (prev && list.some((i) => i.id === prev.id)) {
          return list.find((i) => i.id === prev.id);
        }
        return list[0] || null;
      });
    } catch (err) {
      console.error("Error fetching incidents:", err);
      addToast(err.message || "Failed to load incidents from Supabase", "error");
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Load postmortem for selected incident if exists
  useEffect(() => {
    if (!selectedIncident?.id) return;
    const incId = selectedIncident.id;
    let isCurrent = true;

    fetch(`/api/incidents/${incId}/postmortem`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && isCurrent) {
          setPostmortems((prev) => ({ ...prev, [incId]: data }));
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [selectedIncident?.id]);

  // 2. Trigger real Groq AI Analysis with Hindsight recall
  const runAnalysis = async (incidentId) => {
    if (!incidentId || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      addToast("IncidentMind Agent: Recalling historical evidence from Hindsight & reasoning with Groq...", "info");

      const res = await fetch(`/api/incidents/${incidentId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Analysis failed with HTTP ${res.status}`);
      }

      const result = await res.json();
      setAnalyses((prev) => ({
        ...prev,
        [incidentId]: result,
      }));

      const memoriesFound = result?.hindsight?.memoriesFound ?? 0;
      addToast(
        `Investigation Complete: ${memoriesFound} Hindsight historical memories recalled and correlated.`,
        "success"
      );
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAnalysisError(err.message);
      addToast(`Analysis error: ${err.message}`, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Update Incident Status in Supabase
  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update status (${res.status})`);
      }

      const updated = await res.json();
      setIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, ...updated } : i))
      );
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident((prev) => ({ ...prev, ...updated }));
      }
      addToast(
        `Incident #${incidentId.slice(0, 8)} status updated to ${newStatus.toUpperCase()}`,
        "success"
      );
    } catch (err) {
      addToast(`Status update failed: ${err.message}`, "error");
    }
  };

  // 4. Handle New Incident Creation
  const handleIncidentCreated = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
    setCurrentView("incidents");
    addToast(
      `Incident created: "${newIncident.title}". IncidentMind Agent is ready to investigate.`,
      "success"
    );
  };

  // 5. Handle Postmortem Saved
  const handlePostmortemSaved = (pm) => {
    const incId = pm.incidentId || pm.incident_id || postmortemTargetIncident?.id || selectedIncident?.id;
    if (incId) {
      setPostmortems((prev) => ({
        ...prev,
        [incId]: pm,
      }));
    }
    addToast(
      "Postmortem saved in Supabase & retained in Hindsight memory for future investigations!",
      "success"
    );
  };

  const handleOpenPostmortem = (inc) => {
    setPostmortemTargetIncident(inc || selectedIncident);
    setIsPostmortemOpen(true);
  };

  // Metric counts
  const activeCount = incidents.filter((i) => i.status !== "resolved").length;
  const criticalCount = incidents.filter(
    (i) =>
      i.status !== "resolved" &&
      (i.severity === "P1" || String(i.severity).toUpperCase() === "CRITICAL")
  ).length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  const pageTitles = {
    incidents: "Incidents",
    memory: "Incident Memory Bank",
    runbooks: "Operational Runbooks",
    postmortems: "Incident Post-Mortems",
    learning: "The Agent Learns",
  };

  return (
    <div className="app-layout" id="app-layout">
      {/* Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        activeIncidentsCount={activeCount}
        memoryCount={18}
        onRefresh={fetchIncidents}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <Header
          pageTitle={pageTitles[currentView] || "Incidents"}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          criticalCount={criticalCount}
          activeCount={activeCount}
          resolvedCount={resolvedCount}
          currentView={currentView}
        />

        {/* VIEW 1: INCIDENTS WORKSPACE */}
        {currentView === "incidents" && (
          <section className="view-panel active-view" id="view-incidents">
            <div className="incidents-workspace">
              {/* Left Column: Incidents list */}
              <IncidentList
                incidents={incidents}
                selectedIncidentId={selectedIncident?.id}
                onSelectIncident={(inc) => {
                  setSelectedIncident(inc);
                  setAnalysisError(null);
                }}
                isLoading={isLoadingIncidents}
              />

              {/* Right Column: Incident Detail */}
              <div className="incident-detail-column" id="incident-detail-column">
                <IncidentDetail
                  incident={selectedIncident}
                  analysisData={selectedIncident ? analyses[selectedIncident.id] : null}
                  postmortemData={selectedIncident ? postmortems[selectedIncident.id] : null}
                  isAnalyzing={isAnalyzing}
                  onRunAnalysis={runAnalysis}
                  onStatusChange={handleStatusChange}
                  onOpenPostmortem={handleOpenPostmortem}
                  analysisError={analysisError}
                />
              </div>
            </div>
          </section>
        )}

        {/* VIEW 2: HINDSIGHT MEMORY BANK */}
        {currentView === "memory" && (
          <section className="view-panel active-view" id="view-memory">
            <MemoryBankView
              onMemoryRetained={() => {
                addToast("New incident memory retained in Hindsight bank!", "success");
              }}
            />
          </section>
        )}

        {/* VIEW 3: RUNBOOKS */}
        {currentView === "runbooks" && (
          <section className="view-panel active-view" id="view-runbooks">
            <RunbooksView />
          </section>
        )}

        {/* VIEW 4: POSTMORTEMS */}
        {currentView === "postmortems" && (
          <section className="view-panel active-view" id="view-postmortems">
            <PostmortemsView
              incidents={incidents}
              onPostmortemSaved={handlePostmortemSaved}
            />
          </section>
        )}

        {/* VIEW 5: LEARNING LOOP */}
        {currentView === "learning" && (
          <section className="view-panel active-view" id="view-learning">
            <LearningView />
          </section>
        )}
      </main>

      {/* Modals */}
      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />

      <PostmortemModal
        isOpen={isPostmortemOpen}
        onClose={() => setIsPostmortemOpen(false)}
        incident={postmortemTargetIncident || selectedIncident}
        onPostmortemSaved={handlePostmortemSaved}
      />
    </div>
  );
}
