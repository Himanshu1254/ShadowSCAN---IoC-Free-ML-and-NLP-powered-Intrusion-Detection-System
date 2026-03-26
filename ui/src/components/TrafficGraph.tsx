import { useEffect, useState } from "react";

const TrafficGraph = ({ alerts }: { alerts: any[] }) => {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    setHistory((prev) => {
      const updated = [...prev, alerts.length];
      return updated.slice(-30);
    });
  }, [alerts]);

  const max = Math.max(...history, 1);

  return (
    <div style={{ background: "#0a0a0a", padding: "15px", borderRadius: "8px", marginBottom: "30px" }}>
      <h2>📊 Alert Activity</h2>

      <div style={{ display: "flex", alignItems: "flex-end", height: "120px", gap: "3px" }}>
        {history.map((v, i) => {
          const h = (v / max) * 100;

          return (
            <div
              key={i}
              style={{
                width: "8px",
                height: `${h}%`,
                background:
                  v > max * 0.7 ? "red" :
                  v > max * 0.4 ? "orange" :
                  "cyan",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TrafficGraph;