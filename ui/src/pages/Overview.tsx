import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useDemoContext } from "../context/DemoContext";
import { usePolling } from "../hooks/usePolling";
import type { OverviewStats, BackendHealth, CpuRamTelemetry } from "../types";

const Overview: React.FC = () => {
  const { modeKey } = useDemoContext();
  const [, setHealth] = useState<BackendHealth | null>(null);
  
  // We'll store a unified history of both hardware and pipeline stats
  const [telemetryHistory, setTelemetryHistory] = useState<(CpuRamTelemetry & OverviewStats & { time: string })[]>([]);

  const { data: stats } = usePolling<OverviewStats>({
    endpoint: '/overview/stats',
    intervalMs: 3000,
    initialValue: { packets: 0, flows: 0, sessions: 0, alerts: 0 },
  });

  useEffect(() => {
    setTimeout(() => {
      setTelemetryHistory([]);
      setHealth(null);
    }, 0);

    let active = true;

    const fetchTelemetry = async () => {
      try {
        const [healthRes, hwRes] = await Promise.all([
          apiClient.get("/health"),
          apiClient.get("/hids/hardware/cpu_ram"),
        ]);
        if (!active) return;
        setHealth(healthRes.data);
        
        // Use the current stats state at the time of the interval
        setTelemetryHistory(prev => {
          const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newHistory = [...prev, {
            ...hwRes.data,
            packets: stats?.packets ?? 0,
            flows: stats?.flows ?? 0,
            sessions: stats?.sessions ?? 0,
            alerts: stats?.alerts ?? 0,
            time: timeStr
          }];
          if (newHistory.length > 30) newHistory.shift();
          return newHistory;
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [modeKey, stats]); // Added stats as dependency so the interval captures latest stats

  return (
    <div className="animate-fade-in space-y-4">
      {/* ROW 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cyber-panel p-4">
          <div className="cyber-title">// OVERVIEW</div>
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Total Packets Processed</div>
          <div className="mt-1">
            <div className="text-2xl font-mono text-zinc-100">{(stats?.packets ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="cyber-title opacity-0">//</div>
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Total Flows Tracked</div>
          <div className="mt-1">
            <div className="text-2xl font-mono text-zinc-100">{(stats?.flows ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="cyber-title opacity-0">//</div>
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Active Sessions</div>
          <div className="mt-1">
            <div className="text-2xl font-mono text-zinc-100">{(stats?.sessions ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="cyber-title opacity-0">//</div>
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Threat Detections</div>
          <div className="mt-1">
            <div className="text-2xl font-mono text-zinc-100">{(stats?.alerts ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ROW 2: Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hardware Telemetry */}
        <div className="cyber-panel p-4 h-64 flex flex-col">
          <div className="cyber-title">// HARDWARE TELEMETRY</div>
          <span className="text-[10px] text-zinc-500 font-mono mb-2">Host CPU & Memory (%)</span>
          <div className="flex-1 w-full relative">
            {(!telemetryHistory || telemetryHistory.length === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-[10px] tracking-widest animate-pulse">AWAITING TELEMETRY...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="#475569" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #1e293b' }} itemStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="total_cpu" name="CPU %" stroke="#0ea5e9" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="total_ram" name="RAM %" stroke="#c084fc" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pipeline Telemetry */}
        <div className="cyber-panel p-4 h-64 flex flex-col">
          <div className="cyber-title">// PIPELINE TELEMETRY</div>
          <span className="text-[10px] text-zinc-500 font-mono mb-2">Live Throughput (Cumulative)</span>
          <div className="flex-1 w-full relative">
            {(!telemetryHistory || telemetryHistory.length === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-[10px] tracking-widest animate-pulse">AWAITING TELEMETRY...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #1e293b' }} itemStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="packets" name="Packets" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="flows" name="Flows" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* Network Appears Normal Message */}
      {(stats?.alerts ?? 0) === 0 && (
        <div className="cyber-panel p-6 flex flex-col items-center justify-center border-emerald-500/20 bg-emerald-500/5 mt-4">
          <div className="text-emerald-500 font-mono font-bold text-lg">No Active Threats Detected</div>
          <div className="text-emerald-500/60 font-mono text-xs mt-1">Network traffic appears normal.</div>
        </div>
      )}
    </div>
  );
};

export default Overview;