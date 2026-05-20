import React, { useState, useEffect } from 'react';
import { Shield, ChevronRight, Terminal, UserCheck } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: string, mode: string) => void }) {
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'LOGS'>('LANDING');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<{user: string, time: string, mode: string}[]>([]);

  // Load Auth Logs from Local Storage
  useEffect(() => {
    const saved = localStorage.getItem('shadowScanAuthLogs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const validate = () => {
    const userRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    
    if (!userRegex.test(username)) return "Username requires 1 Upper, 1 Lower, and 1 Number.";
    if (!passRegex.test(password)) return "Password requires 8+ chars, 1 Upper, 1 Lower, 1 Number, 1 Special Char.";
    return "";
  };

  const handleAuth = (e: React.FormEvent, mode: string) => {
    e.preventDefault();
    if (mode !== 'Demo') {
      const valError = validate();
      if (valError) {
        setError(valError);
        return;
      }
    }
    
    const userString = mode === 'Demo' ? 'Guest_Demo' : username;
    const newLog = { user: userString, time: new Date().toLocaleString(), mode };
    const updatedLogs = [newLog, ...logs].slice(0, 10); // Keep last 10
    
    localStorage.setItem('shadowScanAuthLogs', JSON.stringify(updatedLogs));
    onLogin(userString, mode);
  };

  if (view === 'LANDING') {
    return (
      <div 
        className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-300 selection:bg-orange-500/30"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        <Shield className="w-16 h-16 text-orange-500 mb-6 animate-pulse" />
        <h1 className="text-5xl font-bold text-white tracking-widest uppercase mb-2">Shadow<span className="text-orange-500">SCAN</span></h1>
        <p className="text-zinc-500 tracking-[0.3em] text-sm mb-12">AUTONOMOUS THREAT INTELLIGENCE ENGINE</p>
        
        <div className="flex space-x-6">
          <button onClick={() => setView('AUTH')} className="px-8 py-3 bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500/20 transition-all uppercase tracking-widest text-xs font-bold flex items-center">
            Initialize Console <ChevronRight className="w-4 h-4 ml-2" />
          </button>
          <button onClick={() => setView('LOGS')} className="px-8 py-3 bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600 transition-all uppercase tracking-widest text-xs flex items-center">
            <Terminal className="w-4 h-4 mr-2" /> View Auth Logs
          </button>
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
        <div className="w-full max-w-md border border-zinc-800 bg-[#050505] p-6 rounded">
          <h2 className="text-orange-500 text-sm tracking-widest uppercase mb-4 border-b border-zinc-800 pb-2">Local Authentication Registry</h2>
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {logs.length === 0 ? <p className="text-xs text-zinc-600 text-center">No login history found on this device.</p> : logs.map((log, i) => (
              <div key={i} className="flex justify-between text-[10px] bg-zinc-900 p-2 rounded">
                <span className="text-white"><UserCheck className="w-3 h-3 inline mr-1 text-cyan-500"/> {log.user}</span>
                <span className="text-zinc-500">{log.time} [{log.mode}]</span>
              </div>
            ))}
          </div>
          <button onClick={() => setView('LANDING')} className="w-full py-2 text-xs text-zinc-500 border border-zinc-800 hover:text-white uppercase tracking-widest">Return</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-300"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      <div className="w-full max-w-sm border border-zinc-800 bg-[#050505] p-8 rounded shadow-[0_0_30px_rgba(249,115,22,0.05)]">
        <h2 className="text-white tracking-widest uppercase text-xl mb-6 text-center">
          {isSignUp ? 'Establish Credentials' : 'Secure Login'}
        </h2>
        
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] p-3 mb-4 rounded">{error}</div>}
        
        <form onSubmit={(e) => handleAuth(e, isSignUp ? 'Signup' : 'Login')} className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Operator ID (Username)</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 mt-1 text-white text-sm outline-none focus:border-orange-500" placeholder="e.g. Admin1" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Access Key (Password)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 mt-1 text-white text-sm outline-none focus:border-orange-500" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-3 bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500/20 uppercase tracking-widest text-xs font-bold mt-4">
            {isSignUp ? 'Register Identity' : 'Authenticate'}
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-800 pt-4 flex flex-col space-y-3">
          <button onClick={(e) => handleAuth(e, 'Demo')} className="w-full py-2 bg-zinc-900 text-cyan-500 border border-zinc-800 hover:border-cyan-500/50 uppercase tracking-widest text-[10px]">
            Enter Demo Mode (Guest)
          </button>
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest text-center">
            {isSignUp ? 'Switch to Login' : 'Create New Account'}
          </button>
        </div>
      </div>
    </div>
  );
}