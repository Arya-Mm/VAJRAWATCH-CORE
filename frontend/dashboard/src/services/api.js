import { MOCK_LAKES, MOCK_ALERTS, MOCK_REPORTS } from "../data/mockData.js";

export const lakeService = {
  getLakes:      async () => MOCK_LAKES,
  getLake:       async (id) => MOCK_LAKES.find(l=>l.id===id) ?? null,
  getDrivers:    async (id) => MOCK_LAKES.find(l=>l.id===id)?.drivers ?? [],
  getPropagation:async (id) => MOCK_LAKES.find(l=>l.id===id)?.propagation ?? null,
};

export const alertService = {
  getAlerts: async () => MOCK_ALERTS,
  updateAlertStatus: async (id, s) => ({ id, s }),
};

export const reportService = {
  getReports: async () => MOCK_REPORTS,
};
