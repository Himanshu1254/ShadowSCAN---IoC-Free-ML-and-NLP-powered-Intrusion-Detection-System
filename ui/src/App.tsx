import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { DemoProvider } from './context/DemoContext';
import Overview from './pages/Overview';
import Flows from './pages/Flows';
import Sessions from './pages/Sessions';
import Intelligence from './pages/Intelligence';
import Ingestion from './pages/Ingestion';
import AlertOverview from './pages/AlertOverview';
import HIDS from './pages/HIDS';
import SystemHealth from './pages/SystemHealth';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [bootLog, setBootLog] = useState<string[]>([]);

  useEffect(() => {
    const logs = [
      "INITIALIZING SHADOWSCAN KERNEL...",
      "LOADING XGBOOST/RANDOM FOREST ML MODELS...",
      "BINDING TO LOCAL NETWORK INTERFACES...",
      "SYSTEM ONLINE."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setBootLog(prev => [...prev, logs[i]]);
      i++;
      if (i === logs.length) clearInterval(interval);
    }, 500);

    const timeout = setTimeout(() => {
      setIsBooting(false);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  if (isBooting) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center font-mono">
        <div className="w-full max-w-2xl p-8 space-y-4 text-emerald-500">
          {bootLog.map((log, i) => (
            <div key={i} className="animate-fade-in">&gt; {log}</div>
          ))}
          <div className="animate-pulse">&gt; <span className="w-2 h-4 bg-emerald-500 inline-block align-middle" /></div>
        </div>
      </div>
    );
  }

  return (
    <DemoProvider>
      <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="flows" element={<Flows />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="ingestion" element={<Ingestion />} />
        <Route path="alert/:id" element={<AlertOverview />} />
        <Route path="hids" element={<HIDS />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
    </DemoProvider>
  );
};

export default App;
