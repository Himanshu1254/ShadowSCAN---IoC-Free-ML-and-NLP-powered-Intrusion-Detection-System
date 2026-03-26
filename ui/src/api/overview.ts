import api from "./client";

/* ---------- Types (compile-time only) ---------- */
export interface OverviewStats {
  packets: number;
  flows: number;
  sessions: number;
  alerts_24h: number;
}

export interface SystemStatus {
  ingestion: string;
  flow_builder: string;
  session_builder: string;
  detectors: string;
}

/* ---------- API Calls ---------- */
export const fetchOverviewStats = async (): Promise<OverviewStats> => {
  const res = await api.get("/overview/stats");
  return res.data;
};

export const fetchSystemStatus = async (): Promise<SystemStatus> => {
  const res = await api.get("/overview/status");
  return res.data;
};
