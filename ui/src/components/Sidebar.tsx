import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Activity, 
  ShieldAlert, 
  Database,
  Lock,
  Terminal,
  FolderSearch,
  HeartPulse,
  Settings as SettingsIcon
} from 'lucide-react';

import { apiClient } from '../api/client';
import type { BackendHealth } from '../types';

const Sidebar: React.FC = () => {
    const [health, setHealth] = React.useState<BackendHealth | null>(null);

    React.useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await apiClient.get<BackendHealth>('/health');
                setHealth(res.data);
            } catch {
                setHealth(null);
            }
        };
        fetchHealth();
        const iv = setInterval(fetchHealth, 5000);
        return () => clearInterval(iv);
    }, []);

    const nidsItems = [
        { path: '/', label: 'Overview', icon: <LayoutDashboard size={15} /> },
        { path: '/flows', label: 'Flows', icon: <Network size={15} /> },
        { path: '/sessions', label: 'Sessions', icon: <Activity size={15} /> },
        { path: '/intelligence', label: 'Intelligence', icon: <ShieldAlert size={15} /> },
        { path: '/ingestion', label: 'Log Analysis', icon: <Database size={15} /> },
    ];

    const hidsItems = [
        { path: '/hids', label: 'Host Monitor', icon: <FolderSearch size={15} /> },
        { path: '/health', label: 'Sys Health', icon: <HeartPulse size={15} /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon size={15} /> },
    ];

    const isOnline = health?.status === 'online';

    return (
        <aside className="w-60 bg-zinc-950/90 backdrop-blur-md border-r border-white/5 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 text-zinc-100 font-bold tracking-wide">
                    <div className="p-1.5 bg-zinc-900 border border-white/10 rounded-md shadow-inner">
                        <Lock size={15} className="text-zinc-300" />
                    </div>
                    <span>Shadow<span className="text-zinc-500">SCAN</span></span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-5 px-3 space-y-5 overflow-y-auto">
                {/* NIDS Group */}
                <div>
                    <div className="px-3 mb-2 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.15em] font-semibold">
                        NIDS Engine
                    </div>
                    <div className="space-y-0.5">
                        {nidsItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-sm ${
                                        isActive
                                            ? 'bg-white/[0.06] text-zinc-100 font-medium border-l-2 border-cyan-500'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border-l-2 border-transparent'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* HIDS Group */}
                <div>
                    <div className="px-3 mb-2 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.15em] font-semibold">
                        HIDS Engine
                    </div>
                    <div className="space-y-0.5">
                        {hidsItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-sm ${
                                        isActive
                                            ? 'bg-white/[0.06] text-zinc-100 font-medium border-l-2 border-amber-500'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border-l-2 border-transparent'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer Status */}
            <div className="p-3 border-t border-white/5 shrink-0">
                <div className="bg-black/40 rounded-md border border-white/5 p-3 space-y-2">
                    {/* Engine Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider font-semibold">Engine</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse-slow shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`}></span>
                            <span className={`text-[9px] font-mono font-semibold ${isOnline ? 'text-emerald-500' : 'text-red-400'}`}>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>
                    {/* ML Model Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider font-semibold">ML Model</span>
                        <span className={`text-[9px] font-mono font-semibold ${health?.ml_model === 'loaded' ? 'text-cyan-400' : 'text-zinc-500'}`}>
                            {health?.ml_model === 'loaded' ? 'LOADED' : 'OFFLINE'}
                        </span>
                    </div>
                    {/* Pipeline Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider font-semibold">Pipeline</span>
                        <span className={`text-[9px] font-mono font-semibold ${health?.pipeline === 'running' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {health?.pipeline === 'running' ? 'RUNNING' : 'STOPPED'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-mono pt-1 border-t border-white/5">
                        <Terminal size={10} />
                        <span>ShadowSCAN v0.1</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;