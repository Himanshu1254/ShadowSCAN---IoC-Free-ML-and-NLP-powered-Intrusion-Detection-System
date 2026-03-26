import React from "react";

interface Props {
  title: string;
  value: string | number;
}

const StatCard: React.FC<Props> = ({ title, value }) => {
  const isAlertCard = title.toLowerCase().includes("alert");
  const hasAlerts = Number(value) > 0;

  return (
    <div
      className={`p-5 rounded border transition-all duration-300 
      ${
        isAlertCard && hasAlerts
          ? "bg-[#0a0a0a] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          : "bg-[#0a0a0a] border-neutral-800"
      }`}
    >
      <div className="text-xs text-neutral-500 font-mono uppercase mb-2">
        {title}
      </div>

      <div
        className={`text-xl font-bold font-mono ${
          isAlertCard && hasAlerts ? "text-red-500" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
};

export default StatCard;