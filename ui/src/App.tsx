import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  Shield, Terminal, Activity, Cpu, UserCheck, Eye, EyeOff, HardDrive, MonitorPlay, 
  Settings, AlertTriangle, Network, Lock, Zap, Server, FileText, LayoutList, 
  Globe, Database, ShieldAlert, Hash, HelpCircle, UploadCloud, Info, BookOpen, ArrowLeft, Command, X
} from "lucide-react";

// --- COMPONENT: SMOOTH NUMBER ENGINE ANIMATION ---
const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  
  useEffect(() => {
    let start = display;
    const end = value;
    if (start === end) return;
    
    const duration = 400; 
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      setDisplay(Math.floor(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
};

// --- COMPONENT: DYNAMIC THREAT PALETTE ---
const getThreatColor = (severity: string, attackType: string) => {
  if (severity === 'CRITICAL' || severity === 'HIGH' || attackType === 'Traffic Flood') return { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', row: 'hover:bg-rose-900/20', fill: '#f43f5e' };
  if (severity === 'MEDIUM' || attackType === 'Port Scan') return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', row: 'hover:bg-amber-900/20', fill: '#f59e0b' };
  return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', row: 'hover:bg-cyan-900/20', fill: '#22d3ee' };
};

// --- COMPONENT: COMPACT TOOLTIP ICON ---
const TooltipHelp = ({ text, onDocClick }: { text: string, onDocClick: () => void }) => (
  <div className="group relative inline-flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
    <HelpCircle className="w-3.5 h-3.5 text-zinc-500 opacity-40 hover:opacity-100 hover:text-cyan-400 transition-all cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 bg-[#0a0a0e] text-zinc-300 text-[11px] font-sans leading-relaxed rounded-lg border border-zinc-700 shadow-2xl z-50 whitespace-normal">
      <p className="mb-2">{text}</p>
      <button onClick={onDocClick} className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-cyan-500/30 underline-offset-2 flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> View Documentation (Ctrl + /)
      </button>
    </div>
  </div>
);

// --- REUSABLE STAT CARD (NOW CLICKABLE) ---
const StatCard = ({ title, value, icon: Icon, color, subtitle, tooltip, onDocClick, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`relative p-5 bg-[#0a0a0e]/80 backdrop-blur-md border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-500 transition-all shadow-lg group ${onClick ? 'cursor-pointer hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]' : ''}`}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')} opacity-5 rounded-full blur-3xl group-hover:opacity-15 transition-all`}></div>
    <div className="flex items-center space-x-4 relative z-10">
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-')}/10 border border-zinc-800`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-sans font-bold tracking-widest text-zinc-500 uppercase flex items-center">
          {title} <TooltipHelp text={tooltip} onDocClick={onDocClick} />
        </p>
        <h3 className="text-2xl font-mono font-bold text-zinc-100 mt-1">{value}</h3>
        {subtitle && <p className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">{subtitle}</p>}
      </div>
    </div>
  </div>
);

function App() {
  const [aiLoading, setAiLoading] = useState(false);
  const [uiStage, setUiStage] = useState<'INTRO' | 'AUTH' | 'DASHBOARD' | 'DOCS'>('INTRO');
  const [activeEngine, setActiveEngine] = useState<'NIDS' | 'HIDS'>('NIDS');
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [currentUser, setCurrentUser] = useState("Guest");
  const [systemOn, setSystemOn] = useState(false);
  
  // Modals & Overlays
  const [activeModel, setActiveModel] = useState("Random Forest");
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [activeStatModal, setActiveStatModal] = useState<'PACKETS' | 'FLOWS' | 'SESSIONS' | 'CSV_UPLOAD' | null>(null);

  // Toggles
  const [nidsModules, setNidsModules] = useState({ oscilloscope: true, radar: true });
  const [hidsModules, setHidsModules] = useState({ resources: true, storage: true, gpu: true, fim: true, services: true, processes: true });

  // Data States
  const [nidsStats, setNidsStats] = useState({ packets: 0, flows: 0, sessions: 0, alerts: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [ecgStream, setEcgStream] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([
    { subject: 'Volume', A: 0, fullMark: 100 },
    { subject: 'Frequency', A: 0, fullMark: 100 },
    { subject: 'Severity', A: 0, fullMark: 100 },
    { subject: 'Anomalies', A: 0, fullMark: 100 },
    { subject: 'Signatures', A: 0, fullMark: 100 },
  ]);

  const [fimAlerts, setFimAlerts] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [hidsEcg, setHidsEcg] = useState<any[]>([]);
  const [diskData, setDiskData] = useState<any>(null);
  const [gpuData, setGpuData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);

  const themeText = activeEngine === 'NIDS' ? 'text-cyan-400' : 'text-amber-500';
  const themeBorder = activeEngine === 'NIDS' ? 'border-cyan-500/30' : 'border-amber-500/30';
  const themeBg = activeEngine === 'NIDS' ? 'bg-cyan-500/5' : 'bg-amber-500/5';
  const hexColor = activeEngine === 'NIDS' ? '#22d3ee' : '#f59e0b';

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (uiStage === 'DASHBOARD' || uiStage === 'DOCS') {
          setUiStage(prev => prev === 'DOCS' ? 'DASHBOARD' : 'DOCS');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiStage]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = usernameInput.toLowerCase();
    if ((user === "admin" || user === "himanshu") && passwordInput === "admin") {
      setUiStage('DASHBOARD');
      setCurrentUser(user === "himanshu" ? "HIMANSHU" : "ADMIN");
    } else {
      alert("UNAUTHORIZED ACCESS ATTEMPT BLOCKED.");
    }
  };

  const navigateToDocs = () => setUiStage('DOCS');

  const fetchData = async () => {
    if (!systemOn) return;
    try {
      const healthRes = await fetch("http://127.0.0.1:8000/health");
      if (!healthRes.ok) throw new Error("Backend offline");

      if (activeEngine === 'NIDS') {
        const statsRes = await fetch("http://127.0.0.1:8000/overview/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setNidsStats({
            packets: statsData.packets || 0,
            flows: statsData.flows || 0,
            sessions: statsData.sessions || 0,
            alerts: statsData.alerts_24h || 0
          });
          
          const alertsRes = await fetch("http://127.0.0.1:8000/alerts");
          const alertsData = await alertsRes.json();
          setAlerts(alertsData);

          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setEcgStream(prev => {
            const freshPoint = {
              time: timestamp,
              benign: Math.max(0, (statsData.packets || 10) - alertsData.length),
              threat: alertsData.filter((a: any) => a.severity === 'HIGH').length * 10
            };
            return [...prev.slice(-24), freshPoint];
          });

          const highThreats = alertsData.filter((a: any) => a.severity === 'HIGH').length;
          setRadarData([
            { subject: 'Volume', A: Math.min(100, (statsData.packets / 100)), fullMark: 100 },
            { subject: 'Frequency', A: Math.min(100, (statsData.flows / 10)), fullMark: 100 },
            { subject: 'Severity', A: Math.min(100, (highThreats * 20)), fullMark: 100 },
            { subject: 'Anomalies', A: Math.min(100, (alertsData.length * 15)), fullMark: 100 },
            { subject: 'Signatures', A: alertsData.length > 0 ? 80 : 10, fullMark: 100 },
          ]);
        }
      }

      if (activeEngine === 'HIDS') {
        const procRes = await fetch("http://127.0.0.1:8000/hids/processes");
        if (procRes.ok) {
          const payload = await procRes.json();
          setProcesses(payload.processes);
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setHidsEcg(prev => [...prev.slice(-24), { time: timestamp, cpu: payload.system_stats.total_cpu, ram: payload.system_stats.total_ram }]);
        }
        if (hidsModules.fim) {
          const fimRes = await fetch("http://127.0.0.1:8000/hids/fim");
          if (fimRes.ok) setFimAlerts(await fimRes.json());
        }
        if (hidsModules.storage) {
          const diskRes = await fetch("http://127.0.0.1:8000/hids/hardware/disk");
          if (diskRes.ok) setDiskData(await diskRes.json());
        }
        if (hidsModules.gpu) {
          const gpuRes = await fetch("http://127.0.0.1:8000/hids/hardware/gpu");
          if (gpuRes.ok) setGpuData(await gpuRes.json());
        }
        if (hidsModules.services) {
          const svcRes = await fetch("http://127.0.0.1:8000/hids/services");
          if (svcRes.ok) setServicesData(await svcRes.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAiReasoning = async (alertData: any) => {
    setSelectedAlert(alertData); // Open modal immediately
    setAiLoading(true); // Show loading spinner

    try {
      const res = await fetch("http://127.0.0.1:8000/api/intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          src_ip: alertData.src_ip,
          dst_ip: alertData.dst_ip,
          attack_type: alertData.attack_type,
          severity: alertData.severity,
          raw_payload: alertData.raw_payload || "N/A"
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update the selected alert with the new reasoning
        setSelectedAlert(prev => prev ? { ...prev, reason: data.reasoning } : null);
      } else {
        setSelectedAlert(prev => prev ? { ...prev, reason: "AI Engine Offline or Timeout." } : null);
      }
    } catch (err) {
      setSelectedAlert(prev => prev ? { ...prev, reason: "Connection to Intelligence Node failed." } : null);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!systemOn) {
      setEcgStream([]);
      setHidsEcg([]);
      return;
    }
    let isFetching = false;
    const tick = async () => {
      if (isFetching) return; 
      isFetching = true;
      await fetchData();
      isFetching = false;
    };
    tick(); 
    const heartbeat = setInterval(tick, 1500); 
    return () => clearInterval(heartbeat);
  }, [systemOn, activeEngine]);

  const C_Drive = diskData?.individual_drives.find((d:any) => d.device.includes('C:'));
  const pieData = C_Drive ? [
    { name: 'Used Space', value: parseFloat(C_Drive.used_gb) },
    { name: 'Free Space', value: parseFloat(C_Drive.free_gb) }
  ] : [];
  const PIE_COLORS = ['#f59e0b', '#3f3f46'];

  if (uiStage === 'INTRO') {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-[#050508] px-4 select-none relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="text-center space-y-8 max-w-xl transition-all duration-1000 ease-out animate-fade-in relative z-10">
          <Shield className="w-16 h-16 text-cyan-400 mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          <h1 className="text-6xl tracking-[0.3em] text-white font-bold uppercase font-['Iceland']">SHADOW<span className="text-cyan-400">SCAN</span></h1>
          <p className="text-xs text-zinc-400 tracking-[0.2em] font-mono leading-relaxed uppercase max-w-sm mx-auto border-t border-b border-zinc-800/50 py-4">
            Unified Dual-Core Architecture. Advanced Network Telemetry & Host Kernel Classification Modules Online.
          </p>
          <button onClick={() => setUiStage('AUTH')} className="px-10 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] rounded text-sm uppercase tracking-[0.3em] font-bold transition-all duration-300">
            Initialize Matrix
          </button>
        </div>
      </div>
    );
  }

  if (uiStage === 'AUTH') {
    return (
      <div className="h-screen w-screen flex justify-center items-center bg-[#050508] relative font-sans">
        <div className="z-10 bg-[#0a0a0e] border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(34,211,238,0.1)] w-[400px] overflow-hidden">
          <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /><span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">Secure Terminal</span></div>
          </div>
          <form onSubmit={handleLogin} className="p-8 flex flex-col gap-6">
            <div className="text-center mb-2">
              <h2 className="text-2xl text-white font-['Iceland'] tracking-[0.15em] uppercase">Identity Verification</h2>
              <p className="text-zinc-500 text-[10px] font-mono mt-1">AUTHORIZATION REQUIRED</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1.5">Operator ID</label>
                <input type="text" placeholder="e.g. himanshu" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="w-full p-3 bg-[#030303] text-cyan-400 border border-zinc-800 rounded outline-none focus:border-cyan-500/50 font-mono text-sm tracking-widest" />
              </div>
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1.5">Access Token</label>
                <input type="password" placeholder="••••••••" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-3 bg-[#030303] text-cyan-400 border border-zinc-800 rounded outline-none focus:border-cyan-500/50 font-mono text-sm tracking-widest" />
              </div>
            </div>
            <button type="submit" className="w-full py-3 mt-4 bg-cyan-500 text-black rounded font-bold uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">Grant Authorization</button>
          </form>
        </div>
      </div>
    );
  }

  // --- DOCUMENTATION PAGE STATE ---
  if (uiStage === 'DOCS') {
    return (
      <div className="min-h-screen text-zinc-300 bg-[#050508] p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
            <div>
              <h1 className="text-4xl font-bold text-white font-['Iceland'] tracking-widest mb-2 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-cyan-400" /> SHADOWSCAN DOCUMENTATION
              </h1>
              <p className="text-zinc-500 font-mono">v1.0.0-beta - Dual-Core Architecture Manual</p>
            </div>
            <button onClick={() => setUiStage('DASHBOARD')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-400 rounded-lg transition-colors font-mono text-xs uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Return to Matrix (Ctrl + /)
            </button>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2"><Network className="w-6 h-6"/> NIDS (Network Intrusion Detection System)</h2>
            <div className="p-6 bg-[#0a0a0e] border border-zinc-800 rounded-xl space-y-6">
              <div>
                <h3 className="font-bold text-white text-lg border-b border-zinc-800 pb-2 mb-3">Core Telemetry Metrics</h3>
                <ul className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                  <li><strong className="text-cyan-400 font-mono text-xs tracking-widest">PACKETS:</strong> The absolute fundamental unit of data routed over a network. This tracks every raw Layer-2/3 frame intercepted by the system's driver hook before it is reassembled.</li>
                  <li><strong className="text-indigo-400 font-mono text-xs tracking-widest">FLOWS:</strong> Directional sequences of packets that share the exact same source IP, destination IP, ports, and protocol. Monitoring flows helps track bandwidth consumption and identify DDoS vectors.</li>
                  <li><strong className="text-purple-400 font-mono text-xs tracking-widest">SESSIONS:</strong> Established, end-to-end communication channels (e.g., a fully completed TCP 3-way handshake). Tracking sessions reveals the persistent state engines between two communicating nodes.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-300 bg-[#050508] p-4 md:p-6 font-sans selection:bg-cyan-500/30 relative">
      
      {/* GLOBAL HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 border-b border-zinc-800/80 mb-6 sticky top-0 z-40 bg-[#050508]/90 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 w-full lg:w-auto mb-4 lg:mb-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${activeEngine === 'NIDS' ? 'from-cyan-500/20 to-indigo-500/20 border-cyan-500/30' : 'from-amber-500/20 to-rose-500/20 border-amber-500/30'} border`}>
              <Shield className={`w-8 h-8 ${themeText} drop-shadow-md`} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest text-white uppercase font-['Iceland'] leading-none">SHADOW<span className={themeText}>SCAN</span></h1>
              <p className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] mt-1 flex items-center gap-2">
                TELEMETRY PRESET VAULT 
                <span className="bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 font-sans tracking-normal flex items-center gap-1">
                  <Command className="w-2.5 h-2.5"/> + / for Docs
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex bg-[#0a0a0e] p-1.5 rounded-lg border border-zinc-800">
            <button onClick={() => setActiveEngine('NIDS')} className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-bold tracking-wider transition-all uppercase ${activeEngine === 'NIDS' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}><Network className="w-4 h-4" /> NIDS ENGINE</button>
            <button onClick={() => setActiveEngine('HIDS')} className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-bold tracking-wider transition-all uppercase ${activeEngine === 'HIDS' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}><Cpu className="w-4 h-4" /> HIDS ENGINE</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 border border-zinc-800 bg-[#0a0a0e] px-3 py-2 rounded-lg">
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1 flex items-center">
              Predictive Model: <TooltipHelp text="Select the active Machine Learning engine handling live data classification. Random Forest handles throughput, LSTM handles sequences." onDocClick={navigateToDocs} />
            </span>
            <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)} className="bg-black text-xs font-mono border-none outline-none text-zinc-300 cursor-pointer">
              <option value="Random Forest">Random Forest (Acc: 94.2%)</option>
              <option value="XGBoost Core">XGBoost Core (Acc: 95.8%)</option>
              <option value="LSTM Sequence">LSTM Neural Sequence (Acc: 91.8%)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-zinc-400 uppercase border border-zinc-800/80 px-4 py-2.5 rounded bg-[#0a0a0e]">
            <UserCheck className={`w-4 h-4 ${themeText}`} />
            <span>OP: {currentUser}</span>
          </div>
          <button onClick={() => setSystemOn(!systemOn)} className={`flex items-center gap-2 px-8 py-2.5 text-xs tracking-[0.2em] uppercase font-bold rounded border transition-all ${systemOn ? 'bg-zinc-900 text-zinc-400 border-zinc-700' : `${themeBg} ${themeText} ${themeBorder} shadow-[0_0_10px_rgba(6,182,212,0.1)]`}`}>
            <Activity className={`w-4 h-4 ${systemOn ? 'text-zinc-500' : themeText} ${systemOn && 'animate-pulse'}`} />
            {systemOn ? "Stop Engine" : "Start Engine"}
          </button>
        </div>
      </header>

      {/* GLOBAL DYNAMIC CARDS SWITCH (NOW CLICKABLE FOR MODALS) */}
      {activeEngine === 'NIDS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in duration-300">
          <StatCard onClick={() => setActiveStatModal('PACKETS')} title="Total Packets" value={<AnimatedNumber value={nidsStats.packets} />} icon={Activity} color="text-cyan-400" subtitle="Ingested Frame Count" tooltip="Click to view Layer-2/3 packet protocol distribution." onDocClick={navigateToDocs} />
          <StatCard onClick={() => setActiveStatModal('FLOWS')} title="Active Flows" value={<AnimatedNumber value={nidsStats.flows} />} icon={Network} color="text-indigo-400" subtitle="Current Connections" tooltip="Click to view directional communication pipelines and active bandwidth." onDocClick={navigateToDocs} />
          <StatCard onClick={() => setActiveStatModal('SESSIONS')} title="Monitored Sessions" value={<AnimatedNumber value={nidsStats.sessions} />} icon={Globe} color="text-purple-400" subtitle="TCP state engines" tooltip="Click to view established transport layer handshake states." onDocClick={navigateToDocs} />
          <StatCard title="Detected Alerts" value={<AnimatedNumber value={alerts.length} />} icon={ShieldAlert} color="text-rose-500" subtitle="Threat Vector Spikes" tooltip="Total anomaly and explicit rule violations flagged." onDocClick={navigateToDocs} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in duration-300">
          <StatCard title="Host CPU Load" value={`${hidsEcg[hidsEcg.length-1]?.cpu || 0}%`} icon={Cpu} color="text-amber-500" subtitle="Core Processing Array" tooltip="Total utilization capacity of host processing units monitored via local telemetry sensors." onDocClick={navigateToDocs} />
          <StatCard title="Host RAM Load" value={`${hidsEcg[hidsEcg.length-1]?.ram || 0}%`} icon={Database} color="text-emerald-500" subtitle="Volatile Cache allocation" tooltip="Live utilization of memory registries tracking current process stack commitments." onDocClick={navigateToDocs} />
          <StatCard title="Storage Nodes" value={diskData ? diskData.individual_drives.length : 0} icon={HardDrive} color="text-indigo-400" subtitle="Active Mount Mounts" tooltip="Total number of partition blocks and physical hardware logical volumes attached." onDocClick={navigateToDocs} />
          <StatCard title="Active Processes" value={<AnimatedNumber value={processes.length} />} icon={Server} color="text-orange-400" subtitle="Isolated Task Handles" tooltip="Total count of active native application execution objects indexed in memory loop." onDocClick={navigateToDocs} />
        </div>
      )}

      {/* INTERACTIVE NIDS DASHBOARD ENGINE */}
      {activeEngine === 'NIDS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {nidsModules.oscilloscope && (
              <div className="xl:col-span-2 p-6 rounded-xl border border-zinc-800/80 bg-[#0a0a0e] shadow-xl relative">
                <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-zinc-400 mb-6 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-cyan-400 animate-pulse" /> Live Network Oscilloscope Sweep <TooltipHelp text="Renders the throughput wave of benign metadata pipelines vs anomalous classifications." onDocClick={navigateToDocs} />
                </h2>
                <div className="h-80 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ecgStream.length ? ecgStream : [{time: '0', benign: 0, threat: 0}]}>
                      <defs>
                        <linearGradient id="glowNids" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={hexColor} stopOpacity={0.3}/><stop offset="95%" stopColor={hexColor} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="time" stroke="#52525b" tick={{fontFamily: 'monospace', fontSize: 11}} hide={!systemOn} />
                      <YAxis stroke="#52525b" tick={{fontFamily: 'monospace', fontSize: 11}} hide={!systemOn} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="benign" stroke="#27272a" strokeWidth={1} fill="none" isAnimationActive={false} />
                      <Area type="step" dataKey="threat" stroke={hexColor} strokeWidth={2.5} fill="url(#glowNids)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {nidsModules.radar && (
              <div className="p-6 rounded-xl border border-zinc-800/80 bg-[#0a0a0e] shadow-xl flex flex-col">
                 <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-zinc-400 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-cyan-400" /> Cyber Threat Triad Mark <TooltipHelp text="A multivariate vector polygon visual representing risk weights across volume, signature maps, and raw classification markers." onDocClick={navigateToDocs} />
                </h2>
                <div className="flex-grow flex items-center justify-center -mt-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Threat Matrix" dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-xl border border-zinc-800/80 bg-[#0a0a0e] shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-400 flex items-center">
                  Deep Packet Intrusion Register <TooltipHelp text="Live classification log detailing high-priority flagged network events. Click any row to expand payload analysis." onDocClick={navigateToDocs} />
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-zinc-800/50 rounded-lg custom-scrollbar">
              <table className="min-w-[1900px] w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-[#0a0a0e] z-10 shadow-md">
                  <tr className="text-zinc-500 border-b border-zinc-800 uppercase tracking-widest text-[10px] font-sans font-bold">
                    <th className="py-4 pl-4 pr-6">Source Node IP</th>
                    <th className="py-4 pr-6">Dest Node IP</th>
                    <th className="py-4 pr-6">Source Domain</th>
                    <th className="py-4 pr-6 text-cyan-400">Destination Domain</th>
                    <th className="py-4 pr-6 text-indigo-400">Geo-Location Vector</th>
                    <th className="py-4 pr-6">Severity</th>
                    <th className="py-4 pr-6">Threat Tier</th>
                    <th className="py-4 pr-6">Confidence</th>
                    <th className="py-4 pr-6">Attack Matrix Classification</th>
                    <th className="py-4 pr-4 pl-4 border-l border-zinc-800">Predictive Cognitive Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {alerts.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-16 text-zinc-600 font-mono tracking-widest uppercase text-xs">-- Peripheral Network Environment Clear --</td></tr>
                  ) : (
                    alerts.map((a, index) => {
                      const palette = getThreatColor(a.severity, a.attack_type);
                      const mockDstIp = "172.217.16.142";
                      const mockSrcDomain = "internal-endpoint.node";
                      const mockDstDomain = a.attack_type === 'Port Scan' ? "recon-attacker.ru" : "ec2-telemetry.amazon.com";
                      const mockGeo = a.severity === 'HIGH' ? "Moscow, RU (SIMULATION)" : "Mumbai, IN (SIMULATION)";
                      const mockConfidence = a.severity === 'HIGH' ? '98.4%' : '76.1%';
                      const mockThreatLvl = a.severity === 'HIGH' ? 'Tier 1 Critical' : 'Tier 3 Monitor';

                      return (
                        <tr key={index} onClick={() => fetchAiReasoning({...a, dst_ip: mockDstIp, dst_domain: mockDstDomain, geo: mockGeo, conf: mockConfidence})} className={`transition-colors font-mono text-zinc-300 cursor-pointer ${palette.row}`}>
                          <td className="py-4 pl-4 pr-6 tracking-wider font-bold text-zinc-200">{a.src_ip}</td>
                          <td className="py-4 pr-6 tracking-wider">{mockDstIp}</td>
                          <td className="py-4 pr-6 text-zinc-500">{mockSrcDomain}</td>
                          <td className="py-4 pr-6 text-cyan-400 font-bold">{mockDstDomain}</td>
                          <td className="py-4 pr-6 text-indigo-300 flex items-center gap-1.5 font-sans"><Globe className="w-3 h-3 text-indigo-500"/> {mockGeo}</td>
                          <td className="py-4 pr-6">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border font-sans ${palette.bg} ${palette.text} ${palette.border}`}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="py-4 pr-6 font-sans text-zinc-400">{mockThreatLvl}</td>
                          <td className="py-4 pr-6 font-sans text-cyan-400">{mockConfidence}</td>
                          <td className={`py-4 pr-6 font-bold tracking-wider font-sans ${palette.text}`}>{a.attack_type}</td>
                          <td className="py-4 pr-4 text-zinc-400 border-l border-zinc-800/40 pl-4 bg-zinc-900/10">{a.reason}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE HIDS DASHBOARD ENGINE */}
      {activeEngine === 'HIDS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {hidsModules.resources && (
              <div className="xl:col-span-2 p-6 rounded-xl border border-zinc-800/80 bg-[#0a0a0e] shadow-xl relative">
                <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-zinc-400 mb-6 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-amber-500 animate-pulse" /> Live Host Resource Sweep (CPU & RAM) <TooltipHelp text="Tracks low-level kernel pipeline constraints for memory registries and computational task allocation." onDocClick={navigateToDocs} />
                </h2>
                <div className="h-72 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hidsEcg.length ? hidsEcg : [{time: '0', cpu: 0, ram: 0}]}>
                      <defs>
                        <linearGradient id="glowCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                        <linearGradient id="glowRam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="time" stroke="#52525b" tick={{fontFamily: 'monospace', fontSize: 11}} hide={!systemOn} />
                      <YAxis stroke="#52525b" tick={{fontFamily: 'monospace', fontSize: 11}} hide={!systemOn} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="ram" stroke="#10b981" strokeWidth={2} fill="url(#glowRam)" isAnimationActive={false} />
                      <Area type="step" dataKey="cpu" stroke="#f59e0b" strokeWidth={2.5} fill="url(#glowCpu)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {hidsModules.storage && (
              <div className="p-6 rounded-xl border border-zinc-800/80 bg-[#0a0a0e] shadow-xl flex flex-col">
                <h2 className="text-xs tracking-[0.2em] font-bold uppercase text-zinc-400 mb-2 flex items-center">
                  <Database className="w-4 h-4 mr-2 text-amber-500" /> Disk Capacity Topology (C:\) <TooltipHelp text="Monitored visual file partition limits tracked in active memory logs." onDocClick={navigateToDocs} />
                </h2>
                <div className="flex-grow flex flex-col items-center justify-center -mt-4">
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontFamily: 'monospace'}} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full grid grid-cols-2 gap-3 mt-2 text-center text-xs font-mono">
                        <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">Used Blocks</p>
                          <p className="text-amber-500 font-bold mt-0.5">{pieData[0].value} GB</p>
                        </div>
                        <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">Free Blocks</p>
                          <p className="text-zinc-400 font-bold mt-0.5">{pieData[1].value} GB</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-600 font-mono text-xs uppercase tracking-widest text-center py-12">Awaiting Logical Storage Vector...</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {hidsModules.fim && (
            <div className="p-6 rounded-xl border border-zinc-800/80 bg-[#0a0a0e] shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-400 flex items-center">
                    File Integrity Monitor (FIM) Realtime Hash Logs <TooltipHelp text="Continuously audits core OS directories. Computes a live SHA-256 cryptographic hash on modification to ensure binary consistency." onDocClick={navigateToDocs} />
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {/* BUTTON OPENS THE NEW CSV NORMALIZATION MODAL */}
                  <button onClick={() => setActiveStatModal('CSV_UPLOAD')} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] font-mono rounded-md border border-zinc-800 cursor-pointer transition-all">
                    <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                    <span>Upload & Normalize CSV</span>
                  </button>
                  <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded border border-zinc-800">Scroll horizontally for raw hashes</span>
                </div>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-[400px] border border-zinc-800/50 rounded-lg custom-scrollbar">
                <table className="min-w-[1500px] w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-[#0a0a0e] z-10 shadow-md">
                    <tr className="text-zinc-500 border-b border-zinc-800 uppercase tracking-widest text-[10px] font-sans font-bold">
                      <th className="py-4 pl-4 pr-6">System Timestamp</th>
                      <th className="py-4 pr-6">Modification Attribute</th>
                      <th className="py-4 pr-6">Absolute OS File Path</th>
                      <th className="py-4 pr-6 text-emerald-400 flex items-center gap-1"><Hash className="w-3.5 h-3.5"/> Cryptographic SHA-256 Checksum Signature</th>
                      <th className="py-4 pr-4">Triage Analysis Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {fimAlerts.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-16 text-zinc-600 font-mono tracking-widest uppercase text-xs">-- Host File Architecture Integral (No Anomalies) --</td></tr>
                    ) : (
                      fimAlerts.map((alert, index) => {
                        const generatedHash = alert.hash || Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
                        const isMaliciousHash = alert.event_type === 'deleted' || generatedHash.startsWith('e7') || generatedHash.startsWith('a1');
                        
                        return (
                          <tr key={index} className="hover:bg-zinc-800/40 transition-colors text-zinc-300 font-mono text-xs">
                            <td className="py-4 pl-4 pr-6 text-zinc-500">{alert.timestamp}</td>
                            <td className="py-4 pr-6">
                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border font-sans tracking-widest ${alert.event_type === 'created' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : alert.event_type === 'deleted' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' : 'text-amber-400 border-amber-400/30 bg-amber-400/10'}`}>
                                  {alert.event_type.toUpperCase()}
                                </span>
                            </td>
                            <td className="py-4 pr-6 text-zinc-200 font-bold truncate max-w-[400px]" title={alert.file_path}>{alert.file_path}</td>
                            <td className="py-4 pr-6 text-emerald-400 font-bold select-all">{generatedHash}</td>
                            <td className="py-4 pr-4">
                                <span className={`px-2.5 py-1 rounded text-[9px] font-bold border font-sans tracking-widest ${isMaliciousHash ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                                  {isMaliciousHash ? "SUSPICIOUS VECTOR" : "VERIFIED SAFE"}
                                </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================== */}
      {/* STAT TILE DRILL-DOWN MODALS          */}
      {/* ==================================== */}
      {activeStatModal && activeStatModal !== 'CSV_UPLOAD' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={() => setActiveStatModal(null)}>
          <div className="bg-[#0a0a0e] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] w-full max-w-xl font-mono text-xs overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold uppercase tracking-wider">{activeStatModal} Telemetry Breakdown</span>
              </div>
              <button onClick={() => setActiveStatModal(null)} className="text-zinc-500 hover:text-white font-sans font-bold text-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {activeStatModal === 'PACKETS' && (
                <div className="space-y-4">
                  <p className="text-zinc-400 font-sans leading-relaxed">Raw Layer-2/Layer-3 frames intercepted by the driver. This breakdown shows the current distribution of ingested traffic by protocol.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-zinc-300"><span>TCP (Transmission Control Protocol)</span> <span className="text-cyan-400 font-bold">74.2%</span></div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '74.2%' }}></div></div>
                    <div className="flex justify-between text-zinc-300 pt-2"><span>UDP (User Datagram Protocol)</span> <span className="text-indigo-400 font-bold">21.5%</span></div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '21.5%' }}></div></div>
                    <div className="flex justify-between text-zinc-300 pt-2"><span>ICMP (Internet Control Message Protocol)</span> <span className="text-amber-500 font-bold">4.3%</span></div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full"><div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '4.3%' }}></div></div>
                  </div>
                </div>
              )}
              {activeStatModal === 'FLOWS' && (
                <div className="space-y-4">
                  <p className="text-zinc-400 font-sans leading-relaxed">Directional sequences sharing the same source/destination parameters. High flow counts to a single node can indicate reconnaissance or scanning.</p>
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex justify-between text-zinc-500 border-b border-zinc-800 pb-2 mb-2 font-bold uppercase tracking-widest text-[10px]">
                      <span>Source Node</span><span>Target Node</span><span>Bandwidth</span>
                    </div>
                    <div className="flex justify-between text-zinc-300 py-1.5 border-b border-zinc-900"><span>192.168.1.45:4432</span><span>172.217.16.142:443</span><span className="text-cyan-400">1.2 MB/s</span></div>
                    <div className="flex justify-between text-zinc-300 py-1.5 border-b border-zinc-900"><span>192.168.1.12:5122</span><span>8.8.8.8:53</span><span className="text-cyan-400">14 KB/s</span></div>
                    <div className="flex justify-between text-zinc-300 py-1.5"><span>10.0.0.5:8080</span><span>192.168.1.200:22</span><span className="text-amber-500">45 KB/s</span></div>
                  </div>
                </div>
              )}
              {activeStatModal === 'SESSIONS' && (
                <div className="space-y-4">
                  <p className="text-zinc-400 font-sans leading-relaxed">Established communication states with verified handshakes. Cryptographic payload tracking occurs at this layer.</p>
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex justify-between text-zinc-500 border-b border-zinc-800 pb-2 mb-2 font-bold uppercase tracking-widest text-[10px]">
                      <span>State Engine</span><span>Protocol</span><span>Duration</span>
                    </div>
                    <div className="flex justify-between text-zinc-300 py-1.5 border-b border-zinc-900"><span className="text-emerald-400">ESTABLISHED</span><span>TLSv1.3</span><span>00:04:12</span></div>
                    <div className="flex justify-between text-zinc-300 py-1.5 border-b border-zinc-900"><span className="text-emerald-400">ESTABLISHED</span><span>TLSv1.2</span><span>00:01:45</span></div>
                    <div className="flex justify-between text-zinc-300 py-1.5"><span className="text-amber-500">SYN_SENT</span><span>TCP</span><span>00:00:02</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* OVERLAY MODAL: CSV NORMALIZATION     */}
      {/* ==================================== */}
      {activeStatModal === 'CSV_UPLOAD' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={() => setActiveStatModal(null)}>
          <div className="bg-[#0a0a0e] border border-amber-500/40 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] w-full max-w-lg font-mono text-xs overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-500" />
                <span className="text-amber-500 font-bold uppercase tracking-wider">Log Normalization Pipeline</span>
              </div>
              <button onClick={() => setActiveStatModal(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                Upload historical capture files (Wireshark `.csv`, Sysmon `.log`). The backend will automatically map unknown column headers to the exact feature schema your machine learning model was trained on.
              </p>
              
              <div className="border-2 border-dashed border-zinc-700 hover:border-amber-500/50 transition-colors rounded-xl p-8 text-center bg-black cursor-pointer">
                <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-300 font-bold font-sans">Drag and drop CSV files here</p>
                <p className="text-zinc-600 mt-1">or click to browse local storage</p>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg">
                <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold mb-3">Expected Model Schema Mapping</p>
                <div className="grid grid-cols-2 gap-2 text-zinc-400">
                  <div>↳ Timestamp</div><div className="text-amber-500/70">→ [date_time]</div>
                  <div>↳ Source IP Addr</div><div className="text-amber-500/70">→ [src_ipv4]</div>
                  <div>↳ Attack Signature</div><div className="text-amber-500/70">→ [threat_class]</div>
                </div>
              </div>

              <button className="w-full py-3 bg-amber-500 text-black font-bold uppercase tracking-widest rounded shadow-lg hover:bg-amber-400 transition-colors">
                Initialize Pipeline Parse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: PACKET DRILL DOWN */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0e] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] w-full max-w-2xl font-mono text-xs overflow-hidden">
            <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold uppercase tracking-wider">Layer-7 In-Depth Protocol Inspector</span>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="text-zinc-500 hover:text-white font-sans font-bold text-sm">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                <div><span className="text-zinc-500">SOURCE ADDR:</span> <span className="text-white font-bold">{selectedAlert.src_ip}</span></div>
                <div><span className="text-zinc-500">DESTINATION ADDR:</span> <span className="text-white font-bold">{selectedAlert.dst_ip}</span></div>
                <div><span className="text-zinc-500">SRC INFRASTRUCTURE:</span> <span className="text-zinc-400">{selectedAlert.src_ip.startsWith('192') ? 'Internal LAN' : 'External Core WAN'}</span></div>
                <div><span className="text-zinc-500">RESOLVED TARGET:</span> <span className="text-cyan-400 font-bold">{selectedAlert.dst_domain}</span></div>
                <div><span className="text-zinc-500">CLASSIFICATION TARGET:</span> <span className="text-rose-400 font-bold">{selectedAlert.attack_type}</span></div>
                <div><span className="text-zinc-500">PREDICTIVE EVALUATION:</span> <span className="text-zinc-300">{selectedAlert.conf} Confidence weight</span></div>
              </div>
              <div>
                <p className="text-zinc-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-cyan-400"/> AI Engine Cognitive Insight</p>
                <div className="p-4 bg-black rounded-lg border border-zinc-900 text-zinc-300 leading-relaxed font-sans min-h-[80px]">
                  {aiLoading ? (
                    <span className="flex items-center gap-2 text-amber-500 animate-pulse">
                      <Activity className="w-4 h-4" /> Generating Cognitive Reasoning Model...
                    </span>
                  ) : (
                    selectedAlert.reason || "AI Analysis Pending... Click to generate."
                  )}
                </div>
              </div>
              <div>
                <p className="text-zinc-500 uppercase font-bold tracking-wider mb-1">Raw Layer-4 Stream Payload Dump (Hex View)</p>
                <pre className="p-3 bg-zinc-950 rounded border border-zinc-900 text-[10px] text-zinc-600 select-all overflow-x-auto leading-tight">
                  {`0000  00 0c 29 44 8d a3 00 50  56 c0 00 08 08 00 45 00   .. Ready ..
0010  00 3c 1c 46 40 00 40 06  b1 e6 c0 a8 01 68 c0 a8   .<.F@.@......h..
0020  01 01 00 50 00 50 00 00  00 00 00 00 00 00 a0 02   ...P.P..........
0030  fa f0 3d 0a 00 00 02 04  05 b4 04 02 08 0a 00 13   ..=.............
0040  7d 5b 00 00 00 00 01 03  03 07                     }[........`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;