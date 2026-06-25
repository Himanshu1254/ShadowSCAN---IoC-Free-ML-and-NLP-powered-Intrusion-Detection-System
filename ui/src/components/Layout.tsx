import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useDemoContext } from '../context/DemoContext';
import { LogOut, Zap, Radio } from 'lucide-react';

const Layout: React.FC = () => {
  const { isDemoMode, setIsDemoMode } = useDemoContext();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleModeToggle = async () => {
    if (switching) return;
    setSwitching(true);
    await setIsDemoMode(!isDemoMode);
    setSwitching(false);
  };

  return (
    <div className="flex h-screen bg-[#030712] text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#030712] relative flex flex-col md:ml-64">
        {/* Top Navigation / Mode Toggle */}
        <div className="sticky top-0 z-20 w-full h-14 flex items-center justify-between px-6 bg-[#030712]/95 border-b border-[#1e293b]">

          {/* Cyberpunk Top Metrics */}
          <div className="flex items-center gap-8 hidden lg:flex">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">Time</span>
              <span className="text-[10px] text-zinc-300 font-mono tracking-widest">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">Sockets</span>
              <span className="text-[10px] text-zinc-300 font-mono tracking-widest">1,246</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">Users</span>
              <span className="text-[10px] text-zinc-300 font-mono tracking-widest">47</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">Environment</span>
              <span className="text-[10px] text-zinc-300 font-mono tracking-widest">PRODUCTION</span>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Live Feed Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="text-[9px] text-rose-500 font-mono uppercase tracking-widest font-bold">Live Feed</span>
            </div>

            <div className="h-4 w-px bg-[#1e293b]" />

            {/* ── MODE TOGGLE SWITCH ─────────────────────────────────── */}
            <button
              id="mode-toggle-btn"
              onClick={handleModeToggle}
              disabled={switching}
              title={isDemoMode ? 'Switch to Live Mode' : 'Switch to Demo Mode'}
              className={`
                relative flex items-center gap-0 rounded-full p-0.5 border transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#030712]
                ${isDemoMode
                  ? 'bg-amber-500/10 border-amber-500/30 focus:ring-amber-500/40'
                  : 'bg-emerald-500/10 border-emerald-500/30 focus:ring-emerald-500/40'}
                ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:brightness-110'}
              `}
            >
              {/* DEMO label */}
              <span className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest
                transition-all duration-300
                ${isDemoMode
                  ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'text-zinc-600'}
              `}>
                <Zap size={9} />
                Demo
              </span>

              {/* LIVE label */}
              <span className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest
                transition-all duration-300
                ${!isDemoMode
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-zinc-600'}
              `}>
                <Radio size={9} />
                Live
              </span>
            </button>
            {/* ───────────────────────────────────────────────────────── */}

            <div className="h-4 w-px bg-[#1e293b]" />

            {/* Disconnect */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-rose-400 transition-colors"
              title="Disconnect & Return to Login"
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        {/* Subtle top shadow/gradient for depth */}
        <div className="absolute top-14 left-0 z-10 w-full h-8 bg-gradient-to-b from-[#030712] to-transparent pointer-events-none" />
        <div className="p-6 md:p-8 w-full max-w-none mx-auto h-[calc(100vh-3.5rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

