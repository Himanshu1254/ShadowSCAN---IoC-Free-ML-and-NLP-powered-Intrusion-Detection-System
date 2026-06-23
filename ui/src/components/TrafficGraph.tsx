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
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider font-mono">Alert Activity</h2>
        <div className="flex-1 h-px bg-white/[0.05]"></div>
      </div>

      <div className="flex items-end h-32 gap-1 relative overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full h-px bg-white/10"></div>
            <div className="w-full h-px bg-white/10"></div>
            <div className="w-full h-px bg-white/10"></div>
        </div>

        {history.map((v, i) => {
          const h = (v / max) * 100;
          let colorClass = "bg-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]";
          
          if (v > max * 0.7) {
              colorClass = "bg-rose-500/80 shadow-[0_0_8px_rgba(225,29,72,0.3)]";
          } else if (v > max * 0.4) {
              colorClass = "bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]";
          }

          return (
            <div
              key={i}
              className={`w-full rounded-t-sm transition-all duration-300 ${colorClass}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TrafficGraph;