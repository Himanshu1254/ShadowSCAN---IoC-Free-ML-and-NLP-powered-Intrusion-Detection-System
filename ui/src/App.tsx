import { useEffect, useState } from "react";

function App() {
  const [stats, setStats] = useState({
    packets: 0,
    flows: 0,
    sessions: 0,
    alerts_24h: 0,
  });

  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const statsRes = await fetch("http://127.0.0.1:8000/overview/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      const alertsRes = await fetch("http://127.0.0.1:8000/alerts");
      const alertsData = await alertsRes.json();
      setAlerts(alertsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "30px", background: "#050505", color: "#fff", minHeight: "100vh", fontFamily: "monospace" }}>
      
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        🚀 ShadowSCAN Security Dashboard
      </h1>

      {/* Stats */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <Card title="Packets" value={stats.packets} />
        <Card title="Flows" value={stats.flows} />
        <Card title="Sessions" value={stats.sessions} />
        <Card title="Alerts" value={stats.alerts_24h} />
      </div>

      {/* Alerts Table */}
      <h2 style={{ marginBottom: "10px" }}>🚨 Live Alerts</h2>

      <div style={{ background: "#0a0a0a", padding: "15px", borderRadius: "8px" }}>
        {alerts.length === 0 ? (
          <p>No alerts detected</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
                <th>Type</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                  <td>{a.type}</td>
                  <td>{a.src_ip}</td>
                  <td>{a.dst_ip}</td>
                  <td>{a.protocol}</td>
                  <td style={{ color: a.severity === "high" ? "red" : "orange" }}>
                    {a.severity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div style={{
      background: "#0a0a0a",
      padding: "20px",
      borderRadius: "8px",
      width: "150px",
      border: "1px solid #222"
    }}>
      <div style={{ fontSize: "12px", color: "#888" }}>{title}</div>
      <div style={{ fontSize: "20px" }}>{value}</div>
    </div>
  );
}

export default App;