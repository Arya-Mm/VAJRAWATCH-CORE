import React, { useReducer, useMemo, lazy, Suspense } from "react";
import { T, ui, flex, GLOBAL_CSS } from "../utils/theme.js";
import { dashboardReducer, initialState } from "../store/reducer.js";
import { useLakeData, useAlerts, useReports } from "../hooks/useData.js";
import Header from "../components/Header.jsx";
import PageTitle from "../components/PageTitle.jsx";
import DetailsModal from "../components/DetailsModal.jsx";
import { LoadingSpinner, ErrorState } from "../components/UI.jsx";
import { ErrorBoundary } from "../components/ErrorBoundary.jsx";

// Lazy-load tab views for code splitting
const OverviewView     = lazy(() => import("../views/OverviewView.jsx"));
const RiskDriversView  = lazy(() => import("../views/RiskDriversView.jsx"));
const PropagationView  = lazy(() => import("../views/PropagationView.jsx"));
const DigitalTwinView  = lazy(() => import("../views/DigitalTwinView.jsx"));
const ReportsView      = lazy(() => import("../views/ReportsView.jsx"));

export default function VajraWatchPage() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { data: lakes,   loading: lakesLoading,   error: lakesError   } = useLakeData();
  const { data: alerts  } = useAlerts();
  const { data: reports, loading: reportsLoading, error: reportsError  } = useReports();

  const lake = useMemo(
    () => (lakes || []).find(l => l.id === state.selectedLakeId) ?? (lakes || [])[0] ?? null,
    [lakes, state.selectedLakeId]
  );

  const renderTab = () => {
    if (!lake) return null;
    const tabProps = { lake, lakes: lakes || [], state, dispatch };
    switch (state.activeTab) {
      case "Overview":     return <OverviewView {...tabProps} alerts={alerts || []} />;
      case "Risk Drivers": return <RiskDriversView lake={lake} />;
      case "Propagation":  return <PropagationView lake={lake} />;
      case "Digital Twin": return <DigitalTwinView lake={lake} state={state} dispatch={dispatch} />;
      case "Reports":      return <ReportsView reports={reports || []} loading={reportsLoading} error={reportsError} />;
      default:             return null;
    }
  };

  if (lakesLoading) return (
    <div style={{ background: T.bg, minHeight: "100vh", ...flex({ alignItems: "center", justifyContent: "center" }) }}>
      <style>{GLOBAL_CSS}</style>
      <LoadingSpinner label="Loading VajraWatch…" />
    </div>
  );

  if (lakesError) return (
    <div style={{ background: T.bg, minHeight: "100vh", ...flex({ alignItems: "center", justifyContent: "center" }) }}>
      <style>{GLOBAL_CSS}</style>
      <ErrorState message={`Failed to load lake data: ${lakesError}`} onRetry={() => window.location.reload()} />
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", ...ui, color: T.text }}>
      <style>{GLOBAL_CSS}</style>
      <Header state={state} dispatch={dispatch} lakes={lakes || []} alerts={alerts || []} />
      {lake && <PageTitle lake={lake} totalLakes={(lakes || []).length} />}
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner label="Loading view…" />}>
          {lake && renderTab()}
        </Suspense>
      </ErrorBoundary>
      {state.showDetails && lake && (
        <DetailsModal lake={lake} onClose={() => dispatch({ type: "TOGGLE_DETAILS" })} />
      )}
    </div>
  );
}
