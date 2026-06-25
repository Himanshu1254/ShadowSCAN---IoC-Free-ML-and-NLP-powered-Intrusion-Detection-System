import React, { useEffect, useState } from 'react';
import { Shield, FolderSearch, Cpu, Activity } from 'lucide-react';
import Table from '../components/Table';
import { apiClient } from '../api/client';
import type { ProcessEntry, ProcessSnapshot, FimAlert, WindowsService } from '../types';

type HidsTab = 'processes' | 'fim' | 'services';

// -----------------------------------------------
// Process Monitor Tab
// -----------------------------------------------
const ProcessMonitor: React.FC = () => {
    const [data, setData] = useState<ProcessSnapshot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await apiClient.get<ProcessSnapshot>('/hids/processes');
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
        const iv = setInterval(fetch, 5000);
        return () => clearInterval(iv);
    }, []);

    const columns = [
        {
            header: 'PID',
            accessor: (row: ProcessEntry) => <span className="font-mono text-zinc-500 text-xs">{row.pid}</span>
        },
        {
            header: 'Process',
            accessor: (row: ProcessEntry) => (
                <div>
                    <div className="font-mono text-zinc-200 text-xs">{row.name}</div>
                    <div className="font-mono text-zinc-600 text-[9px] truncate max-w-[180px]">{row.path}</div>
                </div>
            )
        },
        {
            header: 'User',
            accessor: (row: ProcessEntry) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400 text-xs truncate max-w-[100px]">{row.user}</span>
                    {row.is_admin && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase border rounded-sm tier-high">ADMIN</span>
                    )}
                </div>
            )
        },
        {
            header: 'CPU %',
            accessor: (row: ProcessEntry) => (
                <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="w-12 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full rounded-full ${row.cpu_usage > 50 ? 'bg-rose-500' : row.cpu_usage > 20 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                            style={{ width: `${Math.min(row.cpu_usage, 100)}%` }}
                        />
                    </div>
                    <span className="font-mono text-zinc-400 text-xs">{row.cpu_usage}%</span>
                </div>
            )
        },
        {
            header: 'MEM %',
            accessor: (row: ProcessEntry) => (
                <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="w-12 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full rounded-full ${row.mem_usage > 20 ? 'bg-violet-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(row.mem_usage * 3, 100)}%` }}
                        />
                    </div>
                    <span className="font-mono text-zinc-400 text-xs">{row.mem_usage}%</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (row: ProcessEntry) => (
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border rounded-sm ${
                    row.status === 'HIGH CPU'
                        ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                        : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                }`}>
                    {row.status}
                </span>
            )
        },
    ];

    if (loading) return <div className="p-6 text-zinc-500 font-mono text-sm animate-pulse">Scanning host processes...</div>;

    return (
        <div className="space-y-4">
            {/* System Stats Header */}
            {data?.system_stats && (
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'System CPU', value: data.system_stats.total_cpu, color: 'bg-cyan-500' },
                        { label: 'System RAM', value: data.system_stats.total_ram, color: 'bg-violet-500' },
                    ].map(stat => (
                        <div key={stat.label} className="glass-panel p-4">
                            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">{stat.label}</div>
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-bold font-mono text-zinc-100">{stat.value}%</div>
                                <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${stat.value > 80 ? 'bg-rose-500' : stat.color}`}
                                        style={{ width: `${stat.value}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Table data={data?.processes || []} columns={columns} emptyMessage="No active processes found." />
        </div>
    );
};

// -----------------------------------------------
// FIM Alerts Tab
// -----------------------------------------------
const FimMonitor: React.FC = () => {
    const [alerts, setAlerts] = useState<FimAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await apiClient.get<FimAlert[]>('/hids/fim');
                setAlerts(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
        const iv = setInterval(fetch, 3000);
        return () => clearInterval(iv);
    }, []);

    const getEventStyle = (type: string) => {
        switch (type) {
            case 'created': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
            case 'modified': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
            case 'deleted': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
            default: return 'text-zinc-400 border-zinc-600 bg-zinc-800';
        }
    };

    const columns = [
        {
            header: 'Time',
            accessor: (row: FimAlert) => <span className="font-mono text-zinc-500 text-xs">{row.timestamp}</span>
        },
        {
            header: 'Event',
            accessor: (row: FimAlert) => (
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border rounded-sm ${getEventStyle(row.event_type)}`}>
                    {row.event_type}
                </span>
            )
        },
        {
            header: 'File',
            accessor: (row: FimAlert) => (
                <span className="font-mono text-zinc-300 text-xs truncate max-w-[280px] block">{row.file_path}</span>
            )
        },
        {
            header: 'SHA-256 Hash',
            accessor: (row: FimAlert) => (
                <span className="font-mono text-cyan-600 text-[10px] truncate max-w-[180px] block">{row.hash}</span>
            )
        },
    ];

    if (loading) return <div className="p-6 text-zinc-500 font-mono text-sm animate-pulse">Starting FIM engine...</div>;

    return (
        <div className="space-y-4">
            {alerts.length === 0 && (
                <div className="glass-panel p-6 flex items-center gap-4 border-emerald-500/10">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-200">File System Secure</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                            FIM engine monitoring <code className="text-zinc-400">/ShadowSCAN_FIM_Test</code> — No changes detected.
                        </p>
                    </div>
                </div>
            )}
            <Table data={alerts} columns={columns} emptyMessage="No file integrity events detected." />
        </div>
    );
};

// -----------------------------------------------
// Services Tab
// -----------------------------------------------
const ServicesMonitor: React.FC = () => {
    const [services, setServices] = useState<WindowsService[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await apiClient.get<WindowsService[]>('/hids/services');
                setServices(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = filter
        ? services.filter(s => s.display_name.toLowerCase().includes(filter.toLowerCase()) || s.service_name.toLowerCase().includes(filter.toLowerCase()))
        : services;

    const columns = [
        {
            header: 'Service',
            accessor: (row: WindowsService) => (
                <div>
                    <div className="font-mono text-zinc-200 text-xs">{row.display_name}</div>
                    <div className="font-mono text-zinc-600 text-[9px]">{row.service_name}</div>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (row: WindowsService) => (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 border rounded-sm text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                    {row.status}
                </span>
            )
        },
        {
            header: 'Start Type',
            accessor: (row: WindowsService) => (
                <span className="font-mono text-zinc-500 text-xs">{row.start_type}</span>
            )
        },
        {
            header: 'Executable Path',
            accessor: (row: WindowsService) => (
                <span className="font-mono text-zinc-600 text-[9px] truncate max-w-[280px] block">{row.executable_path}</span>
            )
        },
    ];

    if (loading) return <div className="p-6 text-zinc-500 font-mono text-sm animate-pulse">Enumerating Windows services...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Filter services..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="bg-black/30 border border-white/10 text-zinc-300 text-xs rounded-md px-3 py-2 w-64 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700 font-mono"
                />
                <span className="text-[10px] text-zinc-600 font-mono">{filtered.length} running services</span>
            </div>
            <Table data={filtered} columns={columns} emptyMessage="No running services found." />
        </div>
    );
};

// -----------------------------------------------
// HIDS Page — Main
// -----------------------------------------------
const HIDS: React.FC = () => {
    const [activeTab, setActiveTab] = useState<HidsTab>('processes');

    const tabs: { key: HidsTab; label: string; icon: React.ReactNode; desc: string }[] = [
        { key: 'processes', label: 'Process Monitor', icon: <Cpu size={14} />, desc: 'Live top 25 processes by CPU/RAM' },
        { key: 'fim', label: 'FIM Alerts', icon: <FolderSearch size={14} />, desc: 'Real-time file integrity events' },
        { key: 'services', label: 'Windows Services', icon: <Activity size={14} />, desc: 'Running background services' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Host Monitor</h1>
                <p className="text-zinc-500 font-mono text-sm">HIDS engine — process scanning, file integrity, and service enumeration.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 glass-panel p-1 rounded-lg w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-semibold transition-all ${
                            activeTab === tab.key
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab description */}
            <p className="text-[11px] text-zinc-600 font-mono -mt-2">
                {tabs.find(t => t.key === activeTab)?.desc}
            </p>

            {/* Tab Content */}
            <div>
                {activeTab === 'processes' && <ProcessMonitor />}
                {activeTab === 'fim' && <FimMonitor />}
                {activeTab === 'services' && <ServicesMonitor />}
            </div>
        </div>
    );
};

export default HIDS;
