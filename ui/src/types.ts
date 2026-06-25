// Shared type definitions for ShadowSCAN UI

// ------------------------------------------------
// NIDS Types
// ------------------------------------------------
export interface Flow {
  src_ip: string;
  dst_ip: string;
  src_port?: number;
  dst_port?: number;
  protocol: number | string;
  packet_count?: number;
  byte_count?: number;
  timestamp?: string;
  src_country?: string;
  dst_country?: string;
}

export interface Session {
  key: [string, string, number | string];
  session_key?: string;
  start_time?: string;
  duration?: string | number;
  status?: string;
  flow_count: number;
  flows: Flow[];
}

export type AlertTier = 'enterprise' | 'personal' | 'student';

export interface Alert {
  id?: string;
  type?: string;
  title?: string;
  src_ip: string;
  dst_ip: string;
  protocol: string | number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  description?: string;
  reason?: string;
  confidence?: string;
  attack_type?: string;
  detected_by?: string;
  timestamp?: string;
  packet_length?: number;
  anomaly_score?: number;
  country?: string;
  dst_country?: string;
  src_domain?: string;
  dst_domain?: string;
  action?: string;
}

export interface OverviewStats {
  packets: number;
  flows: number;
  sessions: number;
  alerts: number;
}

// ------------------------------------------------
// Health & System
// ------------------------------------------------
export interface BackendHealth {
  status: string;
  pipeline: string;
  ml_model: string;
  logging: string;
  alerts_active: boolean;
}

// ------------------------------------------------
// HIDS Types
// ------------------------------------------------
export interface ProcessEntry {
  pid: number;
  name: string;
  path: string;
  user: string;
  is_admin: boolean;
  cpu_usage: number;
  mem_usage: number;
  status: string;
}

export interface ProcessSnapshot {
  processes: ProcessEntry[];
  system_stats: {
    total_cpu: number;
    total_ram: number;
  };
}

export interface FimAlert {
  timestamp: string;
  event_type: 'created' | 'modified' | 'deleted' | string;
  file_path: string;
  hash: string;
}

export interface WindowsService {
  service_name: string;
  display_name: string;
  status: string;
  executable_path: string;
  start_type: string;
}

// ------------------------------------------------
// Hardware Telemetry
// ------------------------------------------------
export interface CpuRamTelemetry {
  total_cpu: number;
  total_ram: number;
}

export interface DiskDrive {
  device: string;
  mountpoint: string;
  file_system: string;
  size_gb: number;
  used_gb: number;
  free_gb: number;
  percent_used: number;
}

export interface DiskTelemetry {
  total_aggregate: {
    total_size_gb: number;
    total_used_gb: number;
    total_free_gb: number;
    global_percent_used: number;
  };
  individual_drives: DiskDrive[];
}

export interface GpuEntry {
  id: number;
  name: string;
  load_percent: number;
  memory_total_mb: number;
  memory_used_mb: number;
  memory_free_mb: number;
  temperature_c: number;
}

// ------------------------------------------------
// Ingestion / Analysis
// ------------------------------------------------
export interface LogAnalysisResult {
  summary?: {
    total_alerts: number;
    attack_distribution: Record<string, number>;
    severity_distribution: Record<string, number>;
  };
  report?: string;
  anomalies?: Alert[];
  educational_insight?: string;
  status?: string;
  rows_analyzed?: number;
}

// ------------------------------------------------
// Stat Card
// ------------------------------------------------
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  progress?: number;
  progressColor?: string;
}
