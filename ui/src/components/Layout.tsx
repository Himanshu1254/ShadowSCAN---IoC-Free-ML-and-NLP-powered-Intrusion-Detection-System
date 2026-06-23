import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useDemoContext } from '../context/DemoContext';

const Layout: React.FC = () => {
  const { isDemoMode, setIsDemoMode } = useDemoContext();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleToggleMode = () => {
    if (isDemoMode) {
      // Switching to Live Mode
      setIsConnecting(true);
      setIsDemoMode(false);
      setTimeout(() => {
        setIsConnecting(false);
      }, 1500);
    } else {
      // Switching to Demo Mode
      setIsDemoMode(true);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#09090b] relative">
        {/* Top Navigation / Mode Toggle */}
        <div className="sticky top-0 z-20 w-full h-16 flex items-center justify-end px-8 bg-black/40 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${!isDemoMode ? 'text-emerald-400' : 'text-zinc-600'}`}>
              SENSOR MODE: LIVE
            </span>
            <button 
              onClick={handleToggleMode}
              className="relative w-12 h-6 rounded-full bg-zinc-800 border border-white/10 transition-colors focus:outline-none"
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ${isDemoMode ? 'translate-x-6 bg-amber-400' : 'translate-x-0 bg-emerald-400'}`} />
            </button>
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isDemoMode ? 'text-amber-400' : 'text-zinc-600'}`}>
              SENSOR MODE: DEMO
            </span>
          </div>
        </div>
        
        {/* Subtle top shadow/gradient for depth */}
        <div className="absolute top-16 left-0 z-10 w-full h-16 bg-gradient-to-b from-[#09090b] to-transparent pointer-events-none" />
        <div className="p-6 md:p-8 md:ml-64 max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          {isConnecting ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-emerald-500 font-mono text-sm animate-pulse tracking-widest text-center">
                &gt; ESTABLISHING SECURE CONNECTION TO LOCALHOST...<br />
                &gt; SNIFFING INTERFACES...
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default Layout;
