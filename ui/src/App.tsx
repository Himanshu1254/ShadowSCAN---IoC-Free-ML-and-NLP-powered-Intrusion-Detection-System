import { useEffect, useState } from "react";
import TrafficGraph from "./components/TrafficGraph";

function App() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    packets: 0,
    flows: 0,
    sessions: 0,
    alerts: 0,
  });

  const fetchData = async () => {
    const statsRes = await fetch("http://127.0.0.1:8000/overview/stats");
    const alertsRes = await fetch("http://127.0.0.1:8000/alerts");

    setStats(await statsRes.json());
    setAlerts(await alertsRes.json());
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 2000);
    return () => clearInterval(i);
  }, []);

  const color = (s: string) =>
    s === "HIGH" ? "red" : s === "MEDIUM" ? "orange" : "lime";

  return (
    <div
      style={{
        padding: "20px",
        background: "#050505",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "monospace",
      }}
    >
      {/* 🔥 HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>🚀 ShadowSCAN Advanced IDS</h1>

        {/* 🔴 LIVE BLINK */}
        <div style={{ color: "red", fontWeight: "bold", animation: "blink 1s infinite" }}>
          ● LIVE
        </div>
      </div>

      {/* 🔥 STATUS BUTTONS */}
      <div style={{ display: "flex", gap: "10px", margin: "10px 0 20px 0" }}>
        <StatusButton label="System Online" color="#007bff" />
        <StatusButton label="System Offline" color="#ff3b3b" />
        <StatusButton label="Poor Network" color="#ffc107" />
      </div>

      {/* 🔥 STATS CARDS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <Card title="Packets" value={stats.packets} />
        <Card title="Flows" value={stats.flows} />
        <Card title="Sessions" value={stats.sessions} />
        <Card title="Alerts" value={stats.alerts} />
      </div>

      {/* GRAPH */}
      <TrafficGraph alerts={alerts} />

      <h2>🚨 Live Alerts</h2>

      {/* TABLE */}
      <div
        style={{
          maxHeight: "400px",
          overflow: "auto",
          border: "1px solid #222",
          borderRadius: "8px",
          background: "#0a0a0a",
        }}
      >
        <table
          style={{
            minWidth: "900px",
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ position: "sticky", top: 0, background: "#111" }}>
            <tr>
              <th style={th}>Source</th>
              <th style={th}>Destination</th>
              <th style={th}>Protocol</th>
              <th style={th}>Severity</th>
              <th style={th}>Confidence</th>
              <th style={th}>Attack</th>
              <th style={th}>Explanation</th>
            </tr>
          </thead>

          <tbody>
            {alerts.map((a, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                <td style={td}>{a.src_ip}</td>
                <td style={td}>{a.dst_ip}</td>
                <td style={td}>{a.protocol}</td>

                <td style={{ ...td, color: color(a.severity) }}>
                  {a.severity}
                </td>

                <td style={{ ...td, color: "#00ffff" }}>
                  {a.confidence}
                </td>

                <td style={td}>{a.attack_type}</td>

                <td style={{ ...td, maxWidth: "400px" }}>
                  {a.explanation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 BLINK CSS */}
      <style>
        {`
          @keyframes blink {
            0% { opacity: 1 }
            50% { opacity: 0 }
            100% { opacity: 1 }
          }
        `}
      </style>
    </div>
  );
}

/* 🔥 COMPONENTS */

function Card({ title, value }: any) {
  return (
    <div
      style={{
        background: "#0a0a0a",
        padding: "15px",
        borderRadius: "6px",
        width: "150px",
        border: "1px solid #222",
      }}
    >
      <div style={{ color: "#888", fontSize: "12px" }}>{title}</div>
      <div style={{ fontSize: "20px" }}>{value}</div>
    </div>
  );
}

function StatusButton({ label, color }: any) {
  return (
    <button
      style={{
        background: color,
        color: "#000",
        border: "none",
        padding: "6px 12px",
        fontSize: "12px",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const th = {
  padding: "10px",
  borderBottom: "1px solid #333",
  color: "#aaa",
  textAlign: "left" as const,
};

const td = {
  padding: "8px",
  fontSize: "12px",
};

export default App;