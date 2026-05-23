import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Shield, Terminal, Activity, Layers, Cpu, ShieldAlert, UserCheck, Eye, EyeOff, Hash, FileSearch, ServerCrash, HardDrive, MonitorPlay, Settings } from "lucide-react";

// --------------------------------------------------
// COMPONENT: SMOOTH NUMBER ENGINE ANIMATION
// --------------------------------------------------
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

// --------------------------------------------------
// COMPONENT: DYNAMIC THREAT PALETTE
// --------------------------------------------------
const getThreatColor = (severity: string, attackType: string) => {
  if (severity === 'HIGH' || attackType === 'Traffic Flood') return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', row: 'hover:bg-red-900/20' };
  if (severity === 'MEDIUM' || attackType === 'Port Scan') return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', row: 'hover:bg-amber-900/20' };
  return { text: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', row: 'hover:bg-cyan-900/20' };
};

// --------------------------------------------------
// MAIN WORKSPACE INTERFACE
// --------------------------------------------------
function App() {
  const [uiStage, setUiStage] = useState<'INTRO' | 'AUTH' | 'DASHBOARD'>('INTRO');
  const [activeEngine, setActiveEngine] = useState<'NIDS' | 'HIDS'>('NIDS');
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [currentUser, setCurrentUser] = useState("Guest");
  const [systemOn, setSystemOn] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'HIGH' | 'LOW'>('HIGH');

  const [modules, setModules] = useState({
    oscilloscope: true,
    radar: false,
    donut: false,
    triage: false,
    geo: false,
    fim: true,
    disk: false,
    gpu: false,
    services: false
  });

  // NIDS State
  const [stats, setStats] = useState({ packets: 0, flows: 0, sessions: 0, alerts: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [ecgStream, setEcgStream] = useState<any[]>([]);

  // HIDS State
  const [fimAlerts, setFimAlerts] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [hidsEcg, setHidsEcg] = useState<any[]>([]);
  
  // NEW HIDS Hardware State
  const [diskData, setDiskData] = useState<any>(null);
  const [gpuData, setGpuData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);

  // Dynamic Theme Variables
  const themeText = activeEngine === 'NIDS' ? 'text-cyan-500' : 'text-orange-500';
  const themeBorder = activeEngine === 'NIDS' ? 'border-cyan-500/30' : 'border-orange-500/30';
  const themeBg = activeEngine === 'NIDS' ? 'bg-cyan-500/5' : 'bg-orange-500/5';
  const hexColor = activeEngine === 'NIDS' ? '#06b6d4' : '#f97316';

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (usernameInput === "admin" && passwordInput === "admin") {
      setUiStage('DASHBOARD');
      setCurrentUser("admin");
    } else {
      alert("UNAUTHORIZED ACCESS ATTEMPT BLOCKED.");
    }
  };

  const fetchData = async () => {
    if (!systemOn) return;

    try {
      const healthRes = await fetch("http://127.0.0.1:8000/health");
      if (!healthRes.ok) throw new Error("Backend offline");
      setBackendOnline(true);

      // --- NIDS FETCHING ---
      if (activeEngine === 'NIDS') {
        const statsRes = await fetch("http://127.0.0.1:8000/overview/stats");
        const statsData = await statsRes.json();
        setStats(statsData);

        const alertsRes = await fetch("http://127.0.0.1:8000/alerts");
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setEcgStream(prev => {
          const freshPoint = {
            time: timestamp,
            benign: Math.max(0, statsData.packets - alertsData.length),
            threat: alertsData.filter((a: any) => a.severity === 'HIGH').length
          };
          return [...prev.slice(-24), freshPoint];
        });
      }

      // --- HIDS FETCHING ---
      if (activeEngine === 'HIDS') {
        const fimRes = await fetch("http://127.0.0.1:8000/hids/fim");
        if (fimRes.ok) setFimAlerts(await fimRes.json());

        const procRes = await fetch("http://127.0.0.1:8000/hids/processes");
        if (procRes.ok) {
          const payload = await procRes.json();
          setProcesses(payload.processes);
          
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setHidsEcg(prev => {
            const fresh = { time: timestamp, cpu: payload.system_stats.total_cpu, ram: payload.system_stats.total_ram };
            return [...prev.slice(-24), fresh];
          });
        }

        // Fetching the New Hardware Trackers
        if (modules.disk) {
          const diskRes = await fetch("http://127.0.0.1:8000/hids/hardware/disk");
          if (diskRes.ok) setDiskData(await diskRes.json());
        }
        if (modules.gpu) {
          const gpuRes = await fetch("http://127.0.0.1:8000/hids/hardware/gpu");
          if (gpuRes.ok) setGpuData(await gpuRes.json());
        }
        if (modules.services) {
          const svcRes = await fetch("http://127.0.0.1:8000/hids/services");
          if (svcRes.ok) setServicesData(await svcRes.json());
        }
      }

    } catch (err) {
      setBackendOnline(false);
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
    const refreshRate = performanceMode === 'HIGH' ? 1000 : 3000;
    const heartbeat = setInterval(tick, refreshRate); 

    return () => clearInterval(heartbeat);
  }, [systemOn, performanceMode, activeEngine, modules]);

  // --- UI RENDERING STARTS HERE ---

  if (uiStage === 'INTRO') {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-black px-4 select-none" style={{ fontFamily: "'Iceland', sans-serif" }}>
        <div className="text-center space-y-6 max-w-xl transition-all duration-1000 ease-out animate-fade-in">
          <Shield className="w-12 h-12 text-cyan-500 mx-auto animate-pulse" />
          <h1 className="text-4xl tracking-[0.3em] text-white font-bold uppercase transition-opacity duration-1000">
            SHADOW<span className="text-cyan-500">SCAN</span>
          </h1>
          <p className="text-xs text-zinc-600 tracking-[0.15em] leading-relaxed uppercase max-w-sm mx-auto">
            Next-gen architecture running live network telemetry. Machine learning classification modules ready.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => setUiStage('AUTH')}
              className="px-8 py-2.5 bg-transparent text-cyan-500 border border-cyan-500/30 hover:border-cyan-500 rounded text-sm uppercase tracking-[0.25em] font-bold transition-all duration-300 hover:bg-cyan-500/5"
            >
              Initialize Matrix
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uiStage === 'AUTH') {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505', color: '#06b6d4', fontFamily: "'Iceland', sans-serif" }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px', border: '1px solid #06b6d430', borderLeft: '2px solid #06b6d4', background: '#0a0a0a', width: '350px' }}>
          <h2 style={{ textAlign: 'center', margin: 0, letterSpacing: '3px', fontSize: '24px', color: '#fff' }} className="uppercase">Identity Verification</h2>
          <input type="text" placeholder="Operator Username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} style={{ padding: '12px', backgroundColor: '#030303', color: '#06b6d4', border: '1px solid #1f1f1f', outline: 'none', fontFamily: "'Iceland', sans-serif", letterSpacing: '1px' }} />
          <input type="password" placeholder="Security Access Token" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ padding: '12px', backgroundColor: '#030303', color: '#06b6d4', border: '1px solid #1f1f1f', outline: 'none', fontFamily: "'Iceland', sans-serif", letterSpacing: '1px' }} />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#06b6d4', color: '#000', cursor: 'pointer', fontWeight: 'bold', border: 'none', fontFamily: "'Iceland', sans-serif", fontSize: '15px', letterSpacing: '2px' }}>Grant Authorization</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-400 p-6 bg-black select-none transition-colors duration-500" style={{ fontFamily: "'Iceland', sans-serif" }}>
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center pb-4 border-b mb-6 border-zinc-900">
        <div className="flex items-center space-x-4">
          <Shield className={`w-7 h-7 animate-pulse ${themeText}`} />
          <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase">SHADOW<span className={themeText}>SCAN</span></h1>
          <div className="ml-6 flex space-x-2">
            <button onClick={() => setActiveEngine('NIDS')} className={`px-4 py-1 border uppercase tracking-wider text-xs transition-all duration-300 ${activeEngine === 'NIDS' ? 'bg-cyan-900/30 border-cyan-400 text-cyan-400' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>NIDS Network</button>
            <button onClick={() => setActiveEngine('HIDS')} className={`px-4 py-1 border uppercase tracking-wider text-xs transition-all duration-300 ${activeEngine === 'HIDS' ? 'bg-orange-900/30 border-orange-500 text-orange-500' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>HIDS Kernel</button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] tracking-widest text-zinc-500 uppercase border border-zinc-900 px-3 py-1.5 rounded bg-[#050505]">
            <UserCheck className={`w-3 h-3 ${themeText}`} />
            <span>OP: {currentUser}</span>
          </div>
          <button onClick={() => setSystemOn(!systemOn)} className={`px-6 py-1 text-xs tracking-widest uppercase font-bold rounded border transition-all ${systemOn ? 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:bg-zinc-900' : `${themeBg} ${themeText} ${themeBorder} hover:bg-opacity-20`}`}>
            {systemOn ? "Halt Daemon" : "Initialize Engine"}
          </button>
        </div>
      </header>

      {/* NIDS VIEW (Network) */}
      {activeEngine === 'NIDS' ? (
        <div className="animate-fade-in transition-opacity duration-500">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#030303] border border-zinc-900 rounded mb-6 text-[10px] tracking-wider uppercase">
            <span className="text-zinc-600 mr-2">Telemetry Modules:</span>
            {['oscilloscope'].map((key) => (
              <button key={key} onClick={() => toggleModule(key as keyof typeof modules)} className={`px-3 py-1 border rounded transition-all flex items-center space-x-1.5 ${modules[key as keyof typeof modules] ? 'bg-cyan-500/5 text-cyan-500 border-cyan-500/30' : 'bg-black text-zinc-600 border-zinc-900 hover:border-zinc-800'}`}>
                {modules[key as keyof typeof modules] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}<span>{key}</span>
              </button>
            ))}
          </div>

          {modules.oscilloscope && (
            <div className="p-5 rounded border border-zinc-900 bg-black mb-6 relative overflow-hidden">
              <h2 className="text-xs tracking-widest uppercase text-zinc-500 mb-6 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-cyan-500 animate-pulse" /> Live Network Oscilloscope Sweep
              </h2>
              <div className="h-60 -mx-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ecgStream.length ? ecgStream : [{time: '0', benign: 0, threat: 0}]}>
                    <defs>
                      <linearGradient id="glowThreat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={hexColor} stopOpacity={0.2}/><stop offset="95%" stopColor={hexColor} stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide={true} />
                    <YAxis hide={true} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: "'Iceland', sans-serif" }} />
                    <Area type="monotone" dataKey="benign" stroke="#27272a" strokeWidth={1} fill="none" isAnimationActive={false} />
                    <Area type="step" dataKey="threat" stroke={hexColor} strokeWidth={2.5} fill="url(#glowThreat)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Network Alerts Table */}
          <div className="p-5 rounded border border-zinc-900 bg-black">
            <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-zinc-900">
              <Terminal className={`w-4 h-4 ${themeText}`} />
              <h2 className="text-xs tracking-widest uppercase text-zinc-500">Live Intrusion Telemetry Register</h2>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] border border-zinc-900/50 rounded">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[1600px]">
                <thead className="sticky top-0 bg-[#050505] z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]">
                  <tr className="text-zinc-600 border-b border-zinc-900 uppercase tracking-widest text-[10px]">
                    <th className="py-4 pl-4 pr-6 font-normal">Source Node Vector</th>
                    <th className="py-4 pr-6 font-normal">Triage Severity</th>
                    <th className="py-4 pr-6 font-normal">Attack Matrix Classification</th>
                    <th className="py-4 pr-4 font-normal">AI Cognitive Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {alerts.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-zinc-700 tracking-widest uppercase text-[12px]">-- Peripheral Environment Clear --</td></tr> : (
                    alerts.map((a, index) => {
                      const palette = getThreatColor(a.severity, a.attack_type);
                      return (
                        <tr key={index} className={`transition-colors text-zinc-400 border-b border-zinc-900/30 ${palette.row}`}>
                          <td className="py-4 pl-4 pr-6 tracking-wider">{a.src_ip}</td>
                          <td className="py-4 pr-6"><span className={`px-3 py-1 rounded text-[10px] font-bold border ${palette.bg} ${palette.text} ${palette.border}`}>{a.severity}</span></td>
                          <td className={`py-4 pr-6 font-bold tracking-wider ${palette.text}`}>{a.attack_type}</td>
                          <td className="py-4 pr-4 text-zinc-300 font-mono border-l border-zinc-900/40 pl-4 bg-zinc-900/[0.02]">{a.reason}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (

      /* ========================================= */
      /* HIDS VIEW (Host Kernel & Hardware)        */
      /* ========================================= */
        <div className="animate-fade-in transition-opacity duration-500 space-y-6">

          {/* Module Toggles */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#030303] border border-zinc-900 rounded text-[10px] tracking-wider uppercase">
            <span className="text-zinc-600 mr-2">Kernel Overlays:</span>
            {['fim', 'disk', 'gpu', 'services'].map((key) => (
              <button key={key} onClick={() => toggleModule(key as keyof typeof modules)} className={`px-3 py-1 border rounded transition-all flex items-center space-x-1.5 ${modules[key as keyof typeof modules] ? 'bg-orange-500/5 text-orange-500 border-orange-500/30' : 'bg-black text-zinc-600 border-zinc-900'}`}>
                {modules[key as keyof typeof modules] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{key} Tracking</span>
              </button>
            ))}
          </div>

          {/* LIVE TASK MANAGER GRAPH (CPU & RAM) */}
          <div className="p-5 rounded border border-zinc-900 bg-black relative overflow-hidden">
            <h2 className="text-xs tracking-widest uppercase text-zinc-500 mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-orange-500 animate-pulse" /> Live System Resource Sweep (CPU & RAM)
            </h2>
            <div className="h-60 -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hidsEcg.length ? hidsEcg : [{time: '0', cpu: 0, ram: 0}]}>
                  <defs>
                    <linearGradient id="glowCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                    <linearGradient id="glowRam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.2}/><stop offset="95%" stopColor="#a1a1aa" stopOpacity={0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide={true} />
                  <YAxis hide={true} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: "'Iceland', sans-serif" }} />
                  <Area type="monotone" dataKey="ram" stroke="#71717a" strokeWidth={1} fill="url(#glowRam)" isAnimationActive={false} />
                  <Area type="step" dataKey="cpu" stroke="#f97316" strokeWidth={2.5} fill="url(#glowCpu)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GPU MODULE */}
          {modules.gpu && (
            <div className="p-5 rounded border border-zinc-900 bg-[#030303]">
               <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-zinc-900">
                <MonitorPlay className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs tracking-widest uppercase text-zinc-500">NVIDIA Graphics Processing Unit Telemetry</h2>
              </div>
              {gpuData && gpuData.length > 0 && !gpuData[0]?.error ? (
                gpuData.map((gpu, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-mono text-zinc-300">
                    <div><span className="text-zinc-500 mr-2">GPU {gpu.id}:</span> {gpu.name}</div>
                    <div className="flex space-x-6">
                      <div><span className="text-zinc-500 text-[10px]">TEMP:</span> <span className={gpu.temperature_c > 80 ? 'text-red-500' : 'text-orange-500'}>{gpu.temperature_c}°C</span></div>
                      <div><span className="text-zinc-500 text-[10px]">LOAD:</span> {gpu.load_percent}%</div>
                      <div><span className="text-zinc-500 text-[10px]">VRAM USED:</span> {gpu.memory_used_mb} MB</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 text-[10px] uppercase tracking-widest">-- GPU Tracker Unavailable or Initializing --</div>
              )}
            </div>
          )}

          {/* DISK MODULE */}
          {modules.disk && diskData && (
            <div className="p-5 rounded border border-zinc-900 bg-[#030303]">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-zinc-900">
                <HardDrive className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs tracking-widest uppercase text-zinc-500">Physical Storage Volumes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diskData.individual_drives.map((drive: any, idx: number) => (
                  <div key={idx} className="p-3 border border-zinc-900 rounded bg-black flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-orange-500">{drive.device}</span>
                      <span className="text-[10px] tracking-widest text-zinc-600 uppercase">{drive.file_system}</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full mb-2 overflow-hidden">
                      <div className={`h-full ${drive.percent_used > 85 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${drive.percent_used}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>{drive.used_gb} GB Used</span>
                      <span>{drive.free_gb} GB Free</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICES MODULE */}
          {modules.services && (
            <div className="p-5 rounded border border-zinc-900 bg-black">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-zinc-900">
                <Settings className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs tracking-widest uppercase text-zinc-500">Live Background Services Scanner</h2>
              </div>
              <div className="overflow-y-auto max-h-[300px] border border-zinc-900/50 rounded">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-[#050505] z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]">
                    <tr className="text-zinc-600 border-b border-zinc-900 uppercase tracking-widest text-[10px]">
                      <th className="py-4 pl-4 pr-6 font-normal">Display Name</th>
                      <th className="py-4 pr-6 font-normal">Service Name</th>
                      <th className="py-4 pr-6 font-normal text-orange-500">Absolute Execution Path</th>
                      <th className="py-4 pr-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {servicesData.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-zinc-700 tracking-widest uppercase text-[12px]">-- Scanning Services --</td></tr>
                    ) : (
                      servicesData.map((svc, index) => (
                        <tr key={index} className="hover:bg-zinc-900/40 transition-colors text-zinc-400">
                          <td className="py-4 pl-4 pr-6 font-bold tracking-wider text-zinc-300">{svc.display_name}</td>
                          <td className="py-4 pr-6 font-mono text-zinc-500">{svc.service_name}</td>
                          <td className="py-4 pr-6 tracking-wider text-orange-500/80 font-mono text-[10px] truncate max-w-sm" title={svc.executable_path}>{svc.executable_path}</td>
                          <td className="py-4 pr-4">
                            <span className="px-2 py-1 rounded text-[10px] font-bold border bg-green-500/10 text-green-500 border-green-500/30">
                              {svc.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVE PROCESS GRID */}
          <div className="p-5 rounded border border-zinc-900 bg-black">
            <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-zinc-900">
              <Cpu className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs tracking-widest uppercase text-zinc-500">Live Memory & Process Execution Tracker (Top 25)</h2>
            </div>
            <div className="overflow-y-auto max-h-[400px] border border-zinc-900/50 rounded">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-[#050505] z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]">
                  <tr className="text-zinc-600 border-b border-zinc-900 uppercase tracking-widest text-[10px]">
                    <th className="py-4 pl-4 pr-6 font-normal w-24">PID</th>
                    <th className="py-4 pr-6 font-normal w-48">Executable Name</th>
                    <th className="py-4 pr-6 font-normal text-orange-500">Execution Path</th>
                    {/* NEW PRIVILEGE COLUMN */}
                    <th className="py-4 pr-6 font-normal text-orange-500">Execution Privilege</th>
                    <th className="py-4 pr-6 font-normal text-zinc-500">CPU (%)</th>
                    <th className="py-4 pr-6 font-normal text-zinc-500">RAM (%)</th>
                    <th className="py-4 pr-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {processes.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-zinc-700 tracking-widest uppercase text-[12px]">-- Scanning Memory --</td></tr>
                  ) : (
                    processes.map((p, index) => (
                      <tr key={index} className="hover:bg-zinc-900/40 transition-colors text-zinc-400">
                        <td className="py-4 pl-4 pr-6 font-mono text-zinc-500">{p.pid}</td>
                        <td className="py-4 pr-6 font-bold tracking-wider text-zinc-300">{p.name}</td>
                        <td className="py-4 pr-6 tracking-wider text-orange-500/80 font-mono text-[10px] truncate max-w-xs" title={p.path}>{p.path}</td>
                        {/* PRIVILEGE DATA RENDERING */}
                        <td className="py-4 pr-6">
                          <div className="flex items-center space-x-2">
                            <span className="text-zinc-300 font-mono">{p.user}</span>
                            {p.is_admin && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">ADMIN</span>}
                          </div>
                        </td>
                        <td className={`py-4 pr-6 font-bold ${p.cpu_usage > 40 ? 'text-orange-500' : 'text-zinc-400'}`}>{p.cpu_usage}%</td>
                        <td className="py-4 pr-6 text-zinc-400">{p.mem_usage}%</td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${p.status === 'NORMAL' ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-orange-500/10 text-orange-500 border-orange-500/30'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;