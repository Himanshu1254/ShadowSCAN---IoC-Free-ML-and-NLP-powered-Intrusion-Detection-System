import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  progress?: number;       // 0–100
  progressColor?: string;  // tailwind bg class e.g. 'bg-cyan-500'
  alert?: boolean;         // triggers rose glow
}

const StatCard: React.FC<Props> = ({ title, value, subtitle, icon, progress, progressColor = 'bg-cyan-500', alert }) => {
  const isAlert = alert || (typeof title === 'string' && title.toLowerCase().includes('alert') && Number(value) > 0);

  return (
    <div className={`p-5 rounded-md border transition-all duration-300 glass-panel flex flex-col gap-3 ${
        isAlert
          ? 'border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.12)] bg-rose-500/5'
          : 'border-white/5'
    }`}>
      <div className="flex items-start justify-between">
        <div className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${isAlert ? 'text-rose-400' : 'text-zinc-500'}`}>
          {title}
        </div>
        {icon && (
          <div className={`p-1.5 rounded-md border ${isAlert ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
            {icon}
          </div>
        )}
      </div>

      <div className={`text-2xl font-bold font-mono tracking-tight ${isAlert ? 'text-rose-400' : 'text-zinc-100'}`}>
        {value}
      </div>

      {subtitle && (
        <div className="text-[11px] text-zinc-600 font-mono">{subtitle}</div>
      )}

      {progress !== undefined && (
        <div className="mt-1">
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progress > 80 ? 'bg-rose-500' : progress > 60 ? 'bg-amber-500' : progressColor
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-600 font-mono mt-1 text-right">{progress.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
};

export default StatCard;