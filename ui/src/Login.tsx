import { useState, useEffect } from 'react';
import { Shield, ChevronRight, Terminal, UserCheck, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemoContext } from './context/DemoContext';

export default function Login() {
  const navigate = useNavigate();
  const { setIsDemoMode } = useDemoContext();
  const [view, setView] = useState<'LANDING' | 'LOGS'>('LANDING');
  const [logs, setLogs] = useState<{user: string, time: string, mode: string}[]>([]);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('shadowScanAuthLogs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const handleModeSelection = (mode: 'Demo' | 'Live') => {
    setIsBooting(true);
    const newLog = { user: `Operator_${mode}`, time: new Date().toLocaleString(), mode };
    const updatedLogs = [newLog, ...logs].slice(0, 10);
    localStorage.setItem('shadowScanAuthLogs', JSON.stringify(updatedLogs));

    setIsDemoMode(mode === 'Demo');

    // Boot sequence animation
    const bootMessages = [
      "INITIALIZING SHADOWSCAN KERNEL...",
      `LOADING ${mode.toUpperCase()} PROFILE...`,
      "BINDING TO NETWORK INTERFACES...",
      "SYSTEM ONLINE."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setBootLog(prev => [...prev, bootMessages[i]]);
      i++;
      if (i === bootMessages.length) clearInterval(interval);
    }, 400);

    setTimeout(() => {
      navigate('/app');
    }, 2000);
  };

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

  if (view === 'LOGS') {
    return (
      <div 
        className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-300 p-6"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        <div className="w-full max-w-md border border-zinc-800 bg-[#050505] p-6 rounded shadow-[0_0_30px_rgba(249,115,22,0.05)]">
          <h2 className="text-orange-500 text-sm tracking-widest uppercase mb-4 border-b border-zinc-800 pb-2">Local Authentication Registry</h2>
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {logs.length === 0 ? <p className="text-xs text-zinc-600 text-center">No login history found on this device.</p> : logs.map((log, i) => (
              <div key={i} className="flex justify-between text-[10px] bg-zinc-900 p-2 rounded border border-zinc-800/50">
                <span className="text-white"><UserCheck className="w-3 h-3 inline mr-1 text-cyan-500"/> {log.user}</span>
                <span className="text-zinc-500">{log.time} [{log.mode}]</span>
              </div>
            ))}
          </div>
          <button onClick={() => setView('LANDING')} className="w-full py-2 text-xs text-zinc-500 border border-zinc-800 hover:text-white uppercase tracking-widest transition-colors">Return</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-zinc-300 p-6 relative overflow-hidden"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 text-center mb-12">
        <Shield className="w-20 h-20 text-emerald-500 mb-6 mx-auto animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-full" />
        <h1 className="text-5xl font-bold text-white tracking-widest uppercase mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Shadow<span className="text-emerald-500">SCAN</span></h1>
        <p className="text-zinc-500 tracking-[0.3em] text-xs max-w-lg mx-auto">AUTONOMOUS THREAT INTELLIGENCE ENGINE</p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Demo Mode Window */}
        <div 
          onClick={() => handleModeSelection('Demo')}
          className="group cursor-pointer bg-black/40 border border-amber-500/20 hover:border-amber-500/60 hover:bg-amber-500/5 p-8 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col h-full"
        >
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-wider mb-2">Demo Mode</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1 font-sans">
            Analyze the features and capabilities of our project in a safe, simulated environment. Features synthetic threat data and mock visualizations.
          </p>
          <div className="flex items-center text-amber-500 text-xs font-bold uppercase tracking-widest mt-auto">
            Initialize Demo <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Live Mode Window */}
        <div 
          onClick={() => handleModeSelection('Live')}
          className="group cursor-pointer bg-black/40 border border-emerald-500/20 hover:border-emerald-500/60 hover:bg-emerald-500/5 p-8 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col h-full"
        >
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-wider mb-2">Live Mode</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1 font-sans">
            Connect directly to live local interfaces. Monitor real-time network traffic, active sessions, and live threat detection feeds.
          </p>
          <div className="flex items-center text-emerald-500 text-xs font-bold uppercase tracking-widest mt-auto">
            Engage System <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="z-10 mt-12">
        <button onClick={() => setView('LOGS')} className="text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest text-[10px] flex items-center">
          <Terminal className="w-3 h-3 mr-2" /> View Auth Registry
        </button>
      </div>
    </div>
  );
}