import React from 'react';
import Table from '../components/Table';
import { Hash, Clock, Shield } from 'lucide-react';
import { useDemoContext } from '../context/DemoContext';
import { usePolling } from '../hooks/usePolling';
import type { Session } from '../types';

const Sessions: React.FC = () => {
    const { isDemoMode } = useDemoContext();

    /**
     * usePolling handles:
     *  - periodic fetching (every 2 s)
     *  - immediate state reset + re-fetch on every mode switch (via modeKey)
     *  - mount / unmount cleanup
     *
     * The same endpoint /sessions is called in both modes.
     * The backend's StateManager routes the call to the correct data source:
     *   Demo Mode → DemoProvider.get_sessions()    (replay attack sessions)
     *   Live Mode → LiveRuntimeState.get_sessions() (real captured sessions only)
     */
    const { data: sessions, loading } = usePolling<Session[]>({
        endpoint: '/sessions',
        intervalMs: 2000,
        initialValue: [],
    });

    const columns = [
        {
            header: 'Session Key',
            accessor: (row: Session) => (
                <div className="flex items-center gap-2 font-mono text-xs">
                    <Hash size={12} className="text-zinc-600" />
                    <span className="text-cyan-500/80">{row.session_key}</span>
                </div>
            ),
        },
        {
            header: 'Source',
            accessor: (row: unknown) => (
                <div>
                    <div className="text-zinc-300 font-mono">{row.src_ip}</div>
                    {row.src_country && <div className="text-[10px] text-zinc-600 font-mono">{row.src_country}</div>}
                </div>
            ),
        },
        {
            header: 'Destination',
            accessor: (row: unknown) => (
                <div>
                    <div className="text-zinc-300 font-mono">{row.dst_ip}</div>
                    {row.dst_country && <div className="text-[10px] text-zinc-600 font-mono">{row.dst_country}</div>}
                </div>
            ),
        },
        {
            header: 'Start',
            accessor: (row: Session) => (
                <span className="text-zinc-400 text-sm">{row.start_time}</span>
            ),
        },
        {
            header: 'Duration',
            accessor: (row: Session) => (
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-zinc-600" />
                    <span>{row.duration}</span>
                </div>
            ),
        },
        {
            header: 'Flows',
            accessor: (row: Session) => (
                <div className="flex items-center gap-2">
                    <span className="w-16 bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-zinc-400 h-full" style={{ width: `${Math.min(row.flow_count, 100)}%` }} />
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">{row.flow_count}</span>
                </div>
            ),
        },
        {
            header: 'Status',
            accessor: (row: Session) => (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                    row.status === 'Active'
                        ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        : row.status === 'Closed'
                            ? 'border-white/10 text-zinc-500'
                            : 'border-orange-500/20 text-orange-500 bg-orange-500/10'
                }`}>
                    {row.status}
                </span>
            ),
        },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Network Sessions</h1>
                <p className="text-zinc-500 font-mono text-sm">
                    Aggregated flow data grouped by session key.{' '}
                    <span className={`font-bold ${isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
                    </span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Shield size={64} className="text-zinc-100" />
                    </div>
                    <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">Total Sessions</div>
                    <div className="text-3xl font-bold text-zinc-100 font-mono">{sessions.length}</div>
                </div>
                <div className="glass-panel p-6">
                    <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">Longest Duration</div>
                    <div className="text-3xl font-bold text-zinc-100 font-mono">--</div>
                </div>
                <div className="glass-panel p-6">
                    <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">Avg Throughput</div>
                    <div className="text-3xl font-bold text-zinc-100 font-mono">--</div>
                </div>
            </div>

            <div className="glass-panel">
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest font-mono">Active Sessions</h3>
                </div>
                <div className="p-2">
                    {loading ? (
                        <div className="p-4 text-zinc-500 font-mono text-sm animate-pulse">Loading sessions...</div>
                    ) : (
                        <Table data={sessions} columns={columns} emptyMessage="No active sessions." />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sessions;