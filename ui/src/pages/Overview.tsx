import React, { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "../components/StatCard";

const Overview: React.FC = () => {
  const [data, setData] = useState({
    packets: 0,
    flows: 0,
    sessions: 0,
    alerts: 0,
    alertList: [],
  });

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/overview/stats"),
        axios.get("http://127.0.0.1:8000/alerts"),
      ]);

      setData({
        packets: statsRes.data.packets,
        flows: statsRes.data.flows,
        sessions: statsRes.data.sessions,
        alerts: statsRes.data.alerts,
        alertList: alertsRes.data,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityBadge = (severity: string) => {
    if (severity === "HIGH")
      return "bg-red-600/20 text-red-400 border border-red-500/30";
    if (severity === "MEDIUM")
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30";
    return "bg-green-600/20 text-green-400 border border-green-500/30";
  };

  return (
    <div className="p-6 text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🚀 ShadowSCAN Security Dashboard
        </h1>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-green-500 uppercase tracking-wider">
            LIVE TRAFFIC • {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Packets" value={data.packets} />
        <StatCard title="Flows" value={data.flows} />
        <StatCard title="Sessions" value={data.sessions} />
        <StatCard title="Alerts" value={data.alerts} />
      </div>

      {/* 🚨 LIVE ALERTS */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">🚨 Live Alerts</h2>

        {data.alertList.length === 0 ? (
          <p className="text-neutral-400">No alerts detected</p>
        ) : (
          <table className="w-full text-sm border border-neutral-800">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-neutral-400 text-xs uppercase tracking-wider">
                <th className="p-2">Source</th>
                <th className="p-2">Destination</th>
                <th className="p-2">Protocol</th>
                <th className="p-2">Severity</th>
                <th className="p-2">Confidence</th>
                <th className="p-2">Reason</th>
              </tr>
            </thead>

            <tbody>
              {data.alertList.map((a: any, i: number) => (
                <tr
                  key={i}
                  className="border-b border-neutral-800 hover:bg-neutral-900/40 transition"
                >
                  <td className="p-2 font-mono text-neutral-300">
                    {a.src_ip}
                  </td>

                  <td className="p-2 font-mono text-neutral-300">
                    {a.dst_ip}
                  </td>

                  <td className="p-2 text-neutral-400">
                    {a.protocol}
                  </td>

                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getSeverityBadge(a.severity)}`}>
                      {a.severity}
                    </span>
                  </td>

                  <td className="p-2 font-mono text-cyan-400">
                    {a.confidence || "N/A"}
                  </td>

                  <td className="p-2 text-neutral-400 max-w-xs truncate">
                    {a.reason || "Anomalous traffic detected"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Overview;