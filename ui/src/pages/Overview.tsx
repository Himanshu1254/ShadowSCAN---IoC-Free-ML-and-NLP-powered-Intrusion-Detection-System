import React, { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "../components/StatCard";
import { Activity, Cpu, HardDrive, ShieldAlert, Package, Zap } from "lucide-react";
import type { OverviewStats, BackendHealth, CpuRamTelemetry } from "../types";

const Overview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats>({ packets: 0, flows: 0, sessions: 0, alerts: 0 });
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [hardware, setHardware] = useState<CpuRamTelemetry | null>(null);

  const fetchAll = async () => {
    try {
      const [statsRes, healthRes, hwRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/overview/stats"),
        axios.get("http://127.0.0.1:8000/health"),
        axios.get("http://127.0.0.1:8000/hids/hardware/cpu_ram"),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
      setHardware(hwRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === 'online';

  return (
    <div className="animate-fade-in space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Overview</h1>
        <p className="text-zinc-500 font-mono text-sm">Real-time NIDS/HIDS telemetry and active threat stream.</p>
      </div>

      {/* Backend Health Banner */}
      <div className={`glass-panel px-5 py-4 flex flex-wrap items-center gap-6 border ${isOnline ? 'border-emerald-500/20' : 'border-red-500/30'}`}>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse-slow shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`}></span>
          <span className={`text-xs font-mono font-semibold uppercase tracking-widest ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
            ShadowSCAN {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {[
          { label: 'Pipeline', value: health?.pipeline ?? '—', ok: health?.pipeline === 'running' },
          { label: 'ML Model', value: health?.ml_model ?? '—', ok: health?.ml_model === 'loaded' },
          { label: 'Logging', value: health?.logging ?? '—', ok: health?.logging === 'active' },
          { label: 'Alerts Active', value: health?.alerts_active ? 'YES' : 'NO', ok: !health?.alerts_active },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono uppercase">{item.label}:</span>
            <span className={`text-[10px] font-mono font-bold uppercase ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* NIDS Stats */}
      <div>
        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-semibold mb-4">NIDS Telemetry</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Packets" value={stats.packets.toLocaleString()} icon={<Package size={14} />} subtitle="Cumulative session" />
          <StatCard title="Active Flows" value={stats.flows} icon={<Zap size={14} />} subtitle="Current window" />
          <StatCard title="Open Sessions" value={stats.sessions} icon={<Activity size={14} />} subtitle="L4 sessions" />
          <StatCard title="Active Alerts" value={stats.alerts} icon={<ShieldAlert size={14} />} alert={stats.alerts > 0} subtitle="Threats detected" />
        </div>
      </div>

      {/* Host Hardware Stats */}
      {hardware && (
        <div>
          <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-semibold mb-4">Host Resource Telemetry</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StatCard
              title="CPU Utilization"
              value={`${hardware.total_cpu}%`}
              icon={<Cpu size={14} />}
              progress={hardware.total_cpu}
              progressColor="bg-cyan-500"
              subtitle="Real-time host CPU load"
              alert={hardware.total_cpu > 85}
            />
            <StatCard
              title="RAM Utilization"
              value={`${hardware.total_ram}%`}
              icon={<HardDrive size={14} />}
              progress={hardware.total_ram}
              progressColor="bg-violet-500"
              subtitle="System memory pressure"
              alert={hardware.total_ram > 85}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Overview;