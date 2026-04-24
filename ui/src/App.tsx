import { useEffect, useState } from "react";
import Login from "./Login";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [systemOn, setSystemOn] = useState(false);

  const [stats, setStats] = useState({
    packets: 0,
    flows: 0,
    sessions: 0,
    alerts: 0,
  });

  const [alerts, setAlerts] = useState<any[]>([]);

  const severityColors: any = {
    LOW: "#00ffcc",
    MEDIUM: "#ffaa00",
    HIGH: "#ff4d4d"
  };

  const fetchData = async () => {
    if (!systemOn) return;

    const statsRes = await fetch("http://127.0.0.1:8000/overview/stats");
    const statsData = await statsRes.json();
    setStats(statsData);

    const alertsRes = await fetch("http://127.0.0.1:8000/alerts");
    const alertsData = await alertsRes.json();
    setAlerts(alertsData);
  };

  useEffect(() => {
    if (!systemOn) {
      setStats({ packets: 0, flows: 0, sessions: 0, alerts: 0 });
      setAlerts([]);
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [systemOn]);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  /* ANALYTICS */

  const protocolData = Object.values(
    alerts.reduce((acc: any, a: any) => {
      const key = a.protocol;
      acc[key] = acc[key] || { name: `Proto ${key}`, value: 0 };
      acc[key].value++;
      return acc;
    }, {})
  );

  const severityData = Object.values(
    alerts.reduce((acc: any, a: any) => {
      const key = a.severity;
      acc[key] = acc[key] || { name: key, value: 0 };
      acc[key].value++;
      return acc;
    }, {})
  );

  const topIPs = Object.values(
    alerts.reduce((acc: any, a: any) => {
      const key = a.src_ip;
      acc[key] = acc[key] || { ip: key, count: 0 };
      acc[key].count++;
      return acc;
    }, {})
  ).slice(0, 6);

  return (
    <div style={container}>

      {/* HEADER */}
      <div style={header}>
        <h1>🚀 ShadowSCAN</h1>

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <div style={profile}>👤 Himanshu</div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: systemOn ? "#00ff00" : "#ff4d4d",
              animation: systemOn ? "blink 1s infinite" : "none"
            }} />
            {systemOn ? "LIVE" : "OFFLINE"}
          </div>

          <button
            onClick={() => setSystemOn(!systemOn)}
            style={{
              padding: "6px 12px",
              background: systemOn ? "#ff4d4d" : "#00ffcc",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {systemOn ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={statsRow}>
        <Card title="Packets" value={stats.packets} />
        <Card title="Flows" value={stats.flows} />
        <Card title="Sessions" value={stats.sessions} />
        <Card title="Alerts" value={alerts.length} />
      </div>

      {/* GRAPHS */}
      <div style={graphRow}>

        {/* PROTOCOL PIE */}
        <div style={box}>
          <h3>🌐 Protocol Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={protocolData}
                dataKey="value"
                outerRadius={80}
                animationDuration={800}
              >
                {protocolData.map((_, i) => (
                  <Cell key={i} fill={["#00ffcc", "#ff4d4d", "#ffaa00"][i % 3]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* SEVERITY BAR */}
        <div style={box}>
          <h3>⚠️ Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData}>
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
                {severityData.map((entry: any, index: number) => (
                  <Cell key={index} fill={severityColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TOP TALKERS */}
        <div style={box}>
          <h3>📡 Top Talkers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topIPs}>
              <XAxis dataKey="ip" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar
                dataKey="count"
                fill="#00ffcc"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TABLE */}
      <div style={box}>
        <h2>🚨 Live Alerts</h2>

        <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
          <table style={{ minWidth: "1600px", width: "100%" }}>
            <thead>
              <tr>
                <th>Src IP</th>
                <th>Src Domain</th>
                <th>Dst IP</th>
                <th>Dst Domain</th>
                <th>Country</th>
                <th>Protocol</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Attack</th>
                <th>Explanation</th>
              </tr>
            </thead>

            <tbody>
              {alerts.map((a, i) => (
                <tr key={i}>
                  <td>{a.src_ip}</td>
                  <td>{a.src_domain}</td>
                  <td>{a.dst_ip}</td>
                  <td>{a.dst_domain}</td>
                  <td>{a.country}</td>
                  <td>{a.protocol}</td>
                  <td style={{
                    color: severityColors[a.severity],
                    fontWeight: "bold",
                    textShadow: `0 0 8px ${severityColors[a.severity]}`
                  }}>
                    {a.severity}
                  </td>
                  <td>{a.confidence}</td>
                  <td>{a.attack_type}</td>
                  <td style={{ maxWidth: "300px" }}>{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>
        {`
          @keyframes blink {
            0% { opacity: 1 }
            50% { opacity: 0.2 }
            100% { opacity: 1 }
          }
        `}
      </style>

    </div>
  );
}

/* STYLES */

const tooltipStyle = {
  backgroundColor: "#111",
  border: "1px solid #333",
  color: "#fff",
  borderRadius: "6px"
};

const container = {
  padding: "20px",
  background: "#050505",
  color: "#fff",
  minHeight: "100vh",
  fontFamily: "monospace"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "20px"
};

const profile = {
  padding: "5px 10px",
  background: "#111",
  borderRadius: "6px"
};

const statsRow = {
  display: "flex",
  gap: "20px",
  marginBottom: "20px"
};

const graphRow = {
  display: "flex",
  gap: "20px",
  marginBottom: "20px"
};

const box = {
  flex: 1,
  background: "#0a0a0a",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #111",
  transition: "all 0.3s ease",
  cursor: "pointer"
};

function Card({ title, value }: any) {
  return (
    <div style={{
      flex: 1,
      background: "#0a0a0a",
      padding: "15px",
      borderRadius: "10px",
      border: "1px solid #111",
      transition: "all 0.3s ease"
    }}>
      <div style={{ fontSize: "12px", color: "#888" }}>{title}</div>
      <div style={{ fontSize: "20px" }}>{value}</div>
    </div>
  );
}

export default App; 