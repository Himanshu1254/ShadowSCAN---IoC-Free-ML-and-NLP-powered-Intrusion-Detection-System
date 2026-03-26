// Shared type definitions for ShadowSCAN UI

export interface Flow {
  src_ip: string;
  dst_ip: string;
  src_port?: number;
  dst_port?: number;
  protocol: number | string;
  packet_count?: number;
  byte_count?: number;
}

export interface Session {
  key: [string, string, number | string];
  flow_count: number;
  flows: Flow[];
}

export interface Alert {
  type: string;
  src_ip: string;
  dst_ip: string;
  protocol: string | number;
  severity: string;
  description: string;
}

export interface OverviewStats {
  packets: number;
  flows: number;
  sessions: number;
  alerts_24h: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}
