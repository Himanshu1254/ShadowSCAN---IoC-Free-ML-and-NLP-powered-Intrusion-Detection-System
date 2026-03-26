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

      console.log("🔥 ALERT DATA FROM BACKEND:", alertsRes.data);

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

  return (
    <div className="p-6 text-white">

      {/* 🚨 DEBUG HEADER */}
      <h1 className="text-3xl text-red-500 font-bold mb-4">
        🔥 DEBUG MODE ACTIVE — OVERVIEW FILE LOADED 🔥
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Packets" value={data.packets} />
        <StatCard title="Flows" value={data.flows} />
        <StatCard title="Sessions" value={data.sessions} />
        <StatCard title="Alerts" value={data.alerts} />
      </div>

      {/* RAW JSON DEBUG */}
      <div className="bg-black p-4 border border-red-500 text-xs font-mono overflow-auto max-h-96">
        <h2 className="text-red-400 mb-2">🚨 RAW ALERT DATA:</h2>
        <pre>{JSON.stringify(data.alertList, null, 2)}</pre>
      </div>

    </div>
  );
};

export default Overview;