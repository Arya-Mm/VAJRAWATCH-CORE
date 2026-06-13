import { useEffect, useReducer } from "react";
import { lakeService, alertService, reportService } from "../services/api.js";

function asyncReducer(state, action) {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.data, loading: false, error: null };
    case "failure":
      return { data: null, loading: false, error: action.error };
    default:
      return state;
  }
}

function useAsync(asyncFn, deps = []) {
  const [state, dispatch] = useReducer(asyncReducer, {
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "start" });
    asyncFn().then(
      (data) => {
        if (!cancelled) dispatch({ type: "success", data });
      },
      (err) => {
        if (!cancelled)
          dispatch({ type: "failure", error: err.message || "Unknown error" });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export const useLakeData = () => useAsync(() => lakeService.getLakes(), []);
export const useAlerts = () => useAsync(() => alertService.getAlerts(), []);
export const useReports = () => useAsync(() => reportService.getReports(), []);
