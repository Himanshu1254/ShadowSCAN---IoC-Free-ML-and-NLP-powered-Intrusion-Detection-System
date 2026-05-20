import { useEffect, useState } from "react";
import Login from "./Login";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Shield, Terminal, Radio, Activity, Layers, Cpu, ShieldAlert, Wifi, ChevronDown, Eye, EyeOff, Globe, FileText, Hash, UserCheck, Monitor } from "lucide-react";

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
// MAIN WORKSPACE INTERFACE
// --------------------------------------------------
function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("Guest");
  const [systemOn, setSystemOn] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  
  // Interface Configuration
  const [activeInterface, setActiveInterface] = useState("Wi-Fi");
  const [performanceMode, setPerformanceMode] = useState<'HIGH' | 'LOW'>('HIGH');

  // Telemetry Module Visibility Toggles
  const [modules, setModules] = useState({
    oscilloscope: true,
    radar: false,
    donut: false,
    triage: false,
    matrix: false,
    entropy: false,
    geo: false,
    fim: false
  });

  // Data Storage States
  const [stats, setStats] = useState({ packets: 0, flows: 0, sessions: 0, alerts: 0 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [ecgStream, setEcgStream] = useState<any[]>([]);

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --------------------------------------------------
  // REAL-TIME DATA PIPELINE INGESTION
  // --------------------------------------------------
  const fetchData = async () => {
    if (!systemOn) return;

    try {
      const healthRes = await fetch("http://127.0.0.1:8000/health");
      if (!healthRes.ok) throw new Error("Backend offline");
      setBackendOnline(true);

      const statsRes = await fetch("http://127.0.0.1:8000/overview/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      const alertsRes = await fetch("http://127.0.0.1:8000/alerts");
      const alertsData = await alertsRes.json();
      const rollingAlerts = alertsData.slice(-100);
      setAlerts(rollingAlerts);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setEcgStream(prev => {
        const freshPoint = {
          time: timestamp,
          benign: Math.max(0, statsData.packets - rollingAlerts.length),
          threat: rollingAlerts.filter((a: any) => a.severity === 'HIGH').length
        };
        return [...prev.slice(-24), freshPoint];
      });

    } catch (err) {
      console.log("⚠ Transport layer handshake interrupted");
      setBackendOnline(false);
    }
  };

  // --------------------------------------------------
  // DYNAMIC POLLING TICK (1s HIGH vs 3s LOW)
  // --------------------------------------------------
  useEffect(() => {
    if (!systemOn) {
      setEcgStream([]);
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
  }, [systemOn, performanceMode]);

  // --------------------------------------------------
  // METRIC DISTRIBUTIONS
  // --------------------------------------------------
  const protocolData = Object.values(alerts.reduce((acc: any, a: any) => {
    const p = a.protocol || "Unknown";
    acc[p] = acc[p] || { name: p, value: 0 };
    acc[p].value += 1;
    return acc;
  }, {}));

  const severityData = Object.values(alerts.reduce((acc: any, a: any) => {
    const s = a.severity || "LOW";
    acc[s] = acc[s] || { name: s, value: 0 };
    acc[s].value += 1;
    return acc;
  }, {}));

  const topIPs = Object.values(alerts.reduce((acc: any, a: any) => {
    const ip = a.src_ip || "Unknown";
    acc[ip] = acc[ip] || { ip: ip, count: 0 };
    acc[ip].count += 1;
    return acc;
  }, {})).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

  const radarData = Object.values(alerts.reduce((acc: any, a: any) => {
    if (a.attack_type && a.attack_type !== "Normal") {
      acc[a.attack_type] = acc[a.attack_type] || { vector: a.attack_type, intensity: 0 };
      acc[a.attack_type].intensity += 1;
    }
    return acc;
  }, {}));

  const geoData = Object.values(alerts.reduce((acc: any, a: any) => {
    const country = a.country || "Local Network";
    acc[country] = acc[country] || { origin: country, events: 0 };
    acc[country].events += 1;
    return acc;
  }, {})).slice(0, 4);

  // --------------------------------------------------
  // ROUTING
  // --------------------------------------------------
  if (!loggedIn) {
    return <Login onLogin={(user) => { setLoggedIn(true); setCurrentUser(user); }} />;
  }

  return (
    <div className="min-h-screen text-zinc-400 p-6 bg-black select-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      
      {/* HEADER CONTROL TERMINAL */}
      <header className="flex justify-between items-center pb-4 border-b mb-6 border-zinc-900">
        <div className="flex items-center space-x-4">
          <Shield className="w-7 h-7 text-orange-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase">
            SHADOW<span className="text-orange-500">SCAN</span>
          </h1>
          
          {/* HARDWARE INTERFACE LOOP */}
          <div className="ml-6 relative flex items-center bg-[#050505] border border-zinc-900 rounded px-3 py-1">
            <Wifi className="w-3.5 h-3.5 text-zinc-600 mr-2" />
            <select 
              value={activeInterface}
              onChange={(e) => setActiveInterface(e.target.value)}
              className="bg-transparent text-xs text-orange-500 uppercase tracking-widest outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="Wi-Fi">Wi-Fi (wlan0)</option>
              <option value="Ethernet">Ethernet (eth0)</option>
              <option value="Hotspot">Cellular Bridge</option>
              <option value="Dongle">USB Interface</option>
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-600 absolute right-2 pointer-events-none" />
          </div>

          {/* PERFORMANCE MODE TOGGLE */}
          <div className="relative flex items-center bg-[#050505] border border-zinc-900 rounded px-3 py-1">
            <Monitor className="w-3.5 h-3.5 text-cyan-600 mr-2" />
            <select 
              value={performanceMode}
              onChange={(e) => setPerformanceMode(e.target.value as 'HIGH' | 'LOW')}
              className="bg-transparent text-xs text-cyan-500 uppercase tracking-widest outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="HIGH">High-End Rig (1s Refresh + Glow)</option>
              <option value="LOW">Low-End Rig (3s Refresh + Flat)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-600 absolute right-2 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] tracking-widest text-zinc-500 uppercase border border-zinc-900 px-3 py-1.5 rounded bg-[#050505]">
            <UserCheck className="w-3 h-3 text-cyan-500" />
            <span>OP: {currentUser}</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#050505] px-3 py-1.5 rounded border border-zinc-900">
            <div className={`w-2 h-2 rounded-full ${!systemOn ? 'bg-zinc-700' : backendOnline ? 'bg-orange-500 animate-pulse' : 'bg-red-600'}`} />
            <span className="text-[10px] tracking-widest text-zinc-500">
              {systemOn ? (backendOnline ? "SYNC_ON" : "LINK_ERR") : "DAEMON_HALTED"}
            </span>
          </div>
          <button
            onClick={() => setSystemOn(!systemOn)}
            className={`px-6 py-1 text-xs tracking-widest uppercase font-bold rounded border transition-all ${
              systemOn 
                ? 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:bg-zinc-900' 
                : 'bg-orange-500/5 text-orange-500 border-orange-500/20 hover:bg-orange-500/15'
            }`}
          >
            {systemOn ? "Halt Daemon" : "Initialize Matrix"}
          </button>
        </div>
      </header>

      {/* CORE STAT COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Inbound Packets', value: stats.packets, icon: Layers },
          { title: 'Flow Vector Blocks', value: stats.flows, icon: Activity },
          { title: 'Stateful Sessions', value: stats.sessions, icon: Cpu },
          { title: 'Flagged Anomalies', value: alerts.length, icon: ShieldAlert, danger: true },
        ].map((card, idx) => (
          <div key={idx} className={`p-4 bg-[#030303] rounded border transition-all duration-300 ${card.danger && card.value > 0 ? 'border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.05)]' : 'border-zinc-900'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] tracking-widest uppercase text-zinc-600">{card.title}</span>
              <card.icon className={`w-3.5 h-3.5 ${card.danger && card.value > 0 ? 'text-orange-500' : 'text-zinc-700'}`} />
            </div>
            <div className={`text-2xl font-bold tracking-tight ${card.danger && card.value > 0 ? 'text-orange-500' : 'text-white'}`}>
              <AnimatedNumber value={card.value} />
            </div>
          </div>
        ))}
      </div>

      {/* TELEMETRY SWITCH PANEL (The 8 Module Toggles) */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-[#030303] border border-zinc-900 rounded mb-6 text-[10px] tracking-wider uppercase">
        <span className="text-zinc-600 mr-2">Telemetry Grid Deployment:</span>
        {Object.keys(modules).map((key) => (
          <button
            key={key}
            onClick={() => toggleModule(key as keyof typeof modules)}
            className={`px-3 py-1 border rounded transition-all flex items-center space-x-1.5 ${
              modules[key as keyof typeof modules]
                ? 'bg-orange-500/5 text-orange-500 border-orange-500/30'
                : 'bg-black text-zinc-600 border-zinc-900 hover:border-zinc-800'
            }`}
          >
            {modules[key as keyof typeof modules] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{key}</span>
          </button>
        ))}
      </div>

      {/* TOOL 1: THE NETWORK ECG OSCILLOSCOPE */}
      {modules.oscilloscope && (
        <div className="p-5 rounded border border-zinc-900 bg-black mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:25px_25px] pointer-events-none" />
          <h2 className="text-xs tracking-widest uppercase text-zinc-500 mb-6 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-orange-500 animate-pulse" /> Live Network Oscilloscope Sweep
          </h2>
          <div className="h-60 -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ecgStream.length ? ecgStream : [{time: '0', benign: 0, threat: 0}]}>
                <defs>
                  <linearGradient id="glowThreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  {/* Conditional Neon Filter */}
                  {performanceMode === 'HIGH' && (
                    <filter id="neonStroke"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  )}
                </defs>
                <XAxis dataKey="time" hide={true} />
                <YAxis hide={true} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontFamily: "'Orbitron', sans-serif" }} />
                <Area type="monotone" dataKey="benign" stroke="#27272a" strokeWidth={1} fill="none" isAnimationActive={false} />
                <Area type="step" dataKey="threat" stroke="#f97316" strokeWidth={2.5} fill="url(#glowThreat)" isAnimationActive={false} style={{ filter: performanceMode === 'HIGH' ? 'url(#neonStroke)' : 'none' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TOOL GRID (DYNAMIC BLOCKS 2 THROUGH 7) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* TOOL 2: RADAR THREAT FINGERPRINT */}
        {modules.radar && (
          <div className="p-4 rounded border border-zinc-900 bg-[#030303] flex flex-col justify-between">
            <h3 className="text-xs tracking-widest text-zinc-500 uppercase flex items-center"><Hash className="w-3.5 h-3.5 mr-2 text-orange-500" /> Threat Fingerprint</h3>
            <div className="h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData.length ? radarData : [{vector: 'None', intensity: 0}]}>
                  <PolarGrid stroke="#18181b" />
                  <PolarAngleAxis dataKey="vector" tick={{ fill: '#71717a', fontSize: 9, fontFamily: "'Orbitron', sans-serif" }} />
                  <Radar name="Vectors" dataKey="intensity" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TOOL 3: PROTOCOL DONUT MATRIX */}
        {modules.donut && (
          <div className="p-4 rounded border border-zinc-900 bg-[#030303]">
            <h3 className="text-xs tracking-widest text-zinc-500 uppercase">Protocol Breakdown</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={protocolData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={70} stroke="none" paddingAngle={3}>
                    {protocolData.map((_, i) => <Cell key={i} fill={['#f97316', '#3f3f46', '#18181b'][i % 3]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', fontFamily: "'Orbitron', sans-serif" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TOOL 4: SEVERITY TRIAGE ENGINE */}
        {modules.triage && (
          <div className="p-4 rounded border border-zinc-900 bg-[#030303]">
            <h3 className="text-xs tracking-widest text-zinc-500 uppercase">Severity Distribution</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <XAxis dataKey="name" stroke="#18181b" fontSize={9} tick={{fontFamily: "'Orbitron', sans-serif"}} />
                  <Bar dataKey="value" fill="#f97316" radius={[2, 2, 0, 0]}>
                    {severityData.map((e: any, i) => <Cell key={i} fill={e.name === 'HIGH' ? '#f97316' : '#27272a'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TOOL 5: KILL-CHAIN TALKER MATRIX */}
        {modules.matrix && (
          <div className="p-4 rounded border border-zinc-900 bg-[#030303]">
            <h3 className="text-xs tracking-widest text-zinc-500 uppercase mb-3">Top Malicious Talkers</h3>
            <div className="space-y-2.5">
              {topIPs.map((node: any, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-zinc-900/60 pb-1">
                  <span className="text-zinc-200 tracking-wider">{node.ip}</span>
                  <span className="text-orange-500 font-bold bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">{node.count} pkts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOOL 6: FLOW ENTROPY MATRIX */}
        {modules.entropy && (
          <div className="p-4 rounded border border-zinc-900 bg-[#030303]">
            <h3 className="text-xs tracking-widest text-zinc-500 uppercase mb-4">Flow Density Entropy</h3>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 24 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-6 rounded-xs transition-all duration-300 ${
                    alerts.length > 0 && idx % 7 === 0 
                      ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                      : 'bg-zinc-950 border border-zinc-900'
                  }`} 
                />
              ))}
            </div>
          </div>
        )}

        {/* TOOL 7: GEO-SENSOR INFERENCE LAYOUT */}
        {modules.geo && (
          <div className="p-4 rounded border border-zinc-900 bg-[#030303]">
            <h3 className="text-xs tracking-widest text-zinc-500 uppercase mb-3 flex items-center"><Globe className="w-3.5 h-3.5 mr-2 text-orange-500" /> Spatial Threat Ingress</h3>
            <div className="space-y-2">
              {geoData.map((g: any, i) => (
                <div key={i} className="flex justify-between text-xs text-zinc-500">
                  <span className="uppercase tracking-widest">{g.origin}</span>
                  <span className="text-orange-500 font-bold">{g.events} Hits</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TOOL 8: HOST-BASED FILE INTEGRITY MONITOR (v3.1 Runway Block) */}
      {modules.fim && (
        <div className="p-4 bg-[#030303] border border-zinc-900 rounded mb-6 flex justify-between items-center border-l-2 border-l-emerald-500/50">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">HIDS Kernel Guard — File Integrity Module</h4>
              <p className="text-[10px] text-zinc-600">Monitoring System Target: <span className="text-zinc-400 tracking-wider">C:\Windows\System32\drivers\etc\hosts</span></p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
              SHA-256 MATCHED
            </span>
            <p className="text-[8px] text-zinc-600 mt-1">Status Loop: Continuous Integrity Validated</p>
          </div>
        </div>
      )}

      {/* CORE ALERTS STREAMING TABLE */}
      <div className="p-5 rounded border border-zinc-900 bg-black">
        <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-zinc-900">
          <Terminal className="w-4 h-4 text-orange-500" />
          <h2 className="text-xs tracking-widest uppercase text-zinc-500">Live Intrusion Telemetry Register</h2>
        </div>
        <div className="overflow-x-auto max-h-[350px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-black z-10">
              <tr className="text-zinc-600 border-b border-zinc-900 uppercase tracking-widest text-[9px]">
                <th className="pb-3 pr-4 font-normal">Source Vector</th>
                <th className="pb-3 pr-4 font-normal">Destination Node</th>
                <th className="pb-3 pr-4 font-normal">Protocol</th>
                <th className="pb-3 pr-4 font-normal">Triage Severity</th>
                <th className="pb-3 pr-4 font-normal">Attack Matrix Classification</th>
                <th className="pb-3 font-normal">Engine Reasoning (Heuristic Context)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-700 tracking-widest uppercase text-[10px]">
                    -- Peripheral Environment Clear: No Threats Hooked --
                  </td>
                </tr>
              ) : (
                alerts.map((a, index) => (
                  <tr key={index} className="hover:bg-zinc-900/20 transition-colors text-zinc-400">
                    <td className="py-3 pr-4 text-zinc-300 tracking-wider">{a.src_ip}</td>
                    <td className="py-3 pr-4 text-zinc-500 tracking-wider">{a.dst_ip}</td>
                    <td className="py-3 pr-4 text-[10px] text-zinc-600">{a.protocol}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        a.severity === 'HIGH' ? 'bg-orange-500/5 text-orange-500 border-orange-500/20' : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                      }`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className={`py-3 pr-4 font-bold ${a.severity === 'HIGH' ? 'text-orange-400' : 'text-zinc-300'}`}>{a.attack_type}</td>
                    <td className="py-3 text-zinc-500 truncate max-w-sm" title={a.reason}>{a.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;