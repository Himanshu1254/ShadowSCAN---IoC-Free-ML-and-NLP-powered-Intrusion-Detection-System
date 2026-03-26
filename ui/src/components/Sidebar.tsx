import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Activity, 
  ShieldAlert, 
  Lock,
  Terminal,
  Database
} from 'lucide-react';

const Sidebar: React.FC = () => {
    const navItems = [
        { path: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { path: '/flows', label: 'Flows', icon: <Network size={18} /> },
        { path: '/sessions', label: 'Sessions', icon: <Activity size={18} /> },
        { path: '/intelligence', label: 'Intelligence', icon: <ShieldAlert size={18} /> },
        { path: '/ingestion', label: 'Ingestion', icon: <Database size={18} /> },
    ];

    return (
        <aside className="w-64 bg-[#050505] border-r border-neutral-800 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-neutral-800">
                <div className="flex items-center gap-3 text-neutral-100 font-bold text-lg tracking-wider">
                    <div className="p-1.5 bg-neutral-900 border border-neutral-700 rounded">
                        <Lock size={18} className="text-orange-500" />
                    </div>
                    <span>SHADOW<span className="text-neutral-500">SCAN</span></span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-mono text-neutral-600 uppercase tracking-widest">Monitoring</div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 group font-mono text-sm ${
                                isActive
                                    ? 'bg-neutral-900 text-orange-500 border-l-2 border-orange-500'
                                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50 border-l-2 border-transparent'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Status */}
            <div className="p-4 border-t border-neutral-800">
                <div className="bg-neutral-900/50 rounded border border-neutral-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-neutral-500 font-mono uppercase">System Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <span className="text-[10px] text-emerald-500 font-mono">ONLINE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
                        <Terminal size={12} />
                        <span>node-us-east-4</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;