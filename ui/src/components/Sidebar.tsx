import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Activity, 
  ShieldAlert, 
  Database,
  Lock,
  FolderSearch,
  HeartPulse,
  Settings as SettingsIcon,
  User
} from 'lucide-react';

import { apiClient } from '../api/client';
import type { BackendHealth } from '../types';

const Sidebar: React.FC = () => {
    const [, setHealth] = React.useState<BackendHealth | null>(null);

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
        { path: '/app', label: 'Overview', icon: <LayoutDashboard size={15} /> },
        { path: '/app/flows', label: 'Flows', icon: <Network size={15} /> },
        { path: '/app/sessions', label: 'Sessions', icon: <Activity size={15} /> },
        { path: '/app/intelligence', label: 'Intelligence', icon: <ShieldAlert size={15} /> },
    ];

    const hidsItems = [
        { path: '/app/hids', label: 'Host Monitor', icon: <FolderSearch size={15} /> },
        { path: '/app/health', label: 'Sys Health', icon: <HeartPulse size={15} /> },
        { path: '/app/settings', label: 'Settings', icon: <SettingsIcon size={15} /> },
    ];



    return (
        <aside className="w-64 bg-[#030712] border-r border-[#1e293b] h-screen fixed left-0 top-0 hidden md:flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-14 flex items-center px-5 border-b border-[#1e293b] shrink-0 justify-between">
                <div className="flex items-center gap-2 text-zinc-100 font-bold tracking-wide">
                    <Lock size={16} className="text-cyan-500" />
                    <span>Shadow<span className="text-cyan-500">SCAN</span></span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">v4.2.1</span>
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
                                end={item.path === '/app'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-150 text-xs font-mono uppercase tracking-widest ${
                                        isActive
                                            ? 'bg-cyan-950/30 text-cyan-400 font-medium border-l-[3px] border-cyan-500'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border-l-[3px] border-transparent'
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
                                    `flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-150 text-xs font-mono uppercase tracking-widest ${
                                        isActive
                                            ? 'bg-cyan-950/30 text-cyan-400 font-medium border-l-[3px] border-cyan-500'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border-l-[3px] border-transparent'
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

            {/* Analyst Footer */}
            <div className="p-5 border-t border-[#1e293b] shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0f172a] rounded-sm border border-[#1e293b] flex items-center justify-center">
                            <User size={14} className="text-cyan-500" />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-zinc-300 font-bold tracking-widest uppercase">Analyst</div>
                            <div className="text-[8px] font-mono text-zinc-600">SHDOW\analyst_07</div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Clearance Level</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-300 flex items-center gap-1">
                        TIER 3
                    </span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;