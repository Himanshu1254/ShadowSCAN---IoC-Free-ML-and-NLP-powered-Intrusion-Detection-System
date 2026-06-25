import React from 'react';
import Table from '../components/Table';
import { Filter, Download, Pause } from 'lucide-react';
import { useDemoContext } from '../context/DemoContext';
import { usePolling } from '../hooks/usePolling';
import type { Flow } from '../types';

const Flows: React.FC = () => {
    const { isDemoMode } = useDemoContext();

    /**
     * usePolling handles:
     *  - periodic fetching (every 2 s)
     *  - immediate state reset + re-fetch on every mode switch (via modeKey)
     *  - mount / unmount cleanup
     *
     * The same endpoint /flows is called in both modes.
     * The backend's StateManager routes the call to the correct data source:
     *   Demo Mode → DemoProvider.get_flows()    (replay attack flows)
     *   Live Mode → LiveRuntimeState.get_flows() (real captured flows only)
     */
    const { data: flows, loading } = usePolling<Flow[]>({
        endpoint: '/flows',
        intervalMs: 2000,
        initialValue: [],
    });

    const handleExport = () => {
        const jsonString = JSON.stringify(flows, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shadowscan-flows-${new Date().toISOString().replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const columns = [
        {
            header: 'Time',
            accessor: (row: Flow) => (
                <span className="text-zinc-500 text-xs">{row.timestamp || new Date().toLocaleTimeString()}</span>
            ),
        },
        {
            header: 'Source',
            accessor: (row: Flow) => (
                <div>
                    <div className="text-zinc-300 font-mono">{row.src_ip}</div>
                    {row.src_country && <div className="text-[10px] text-zinc-600 font-mono">{row.src_country}</div>}
                </div>
            ),
        },
        { header: 'Port', accessor: (row: Flow) => <span className="text-zinc-500">{row.src_port}</span> },
        {
            header: 'Destination',
            accessor: (row: Flow) => (
                <div>
                    <div className="text-zinc-300 font-mono">{row.dst_ip}</div>
                    {row.dst_country && <div className="text-[10px] text-zinc-600 font-mono">{row.dst_country}</div>}
                </div>
            ),
        },
        { header: 'Port', accessor: (row: Flow) => <span className="text-zinc-500">{row.dst_port}</span> },
        {
            header: 'Proto',
            accessor: (row: Flow) => (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    row.protocol === 'SSH'
                        ? 'border-orange-500/30 text-orange-500 bg-orange-500/10'
                        : 'border-white/10 text-zinc-400'
                }`}>
                    {row.protocol}
                </span>
            ),
        },
        { header: 'Size', accessor: (row: Flow) => <span className="text-zinc-400">{row.packet_count} p</span> },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Packet Flows</h1>
                <p className="text-zinc-500 font-mono text-sm">
                    Raw network connection telemetry.{' '}
                    <span className={`font-bold ${isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
                    </span>
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-md border ${
                        isDemoMode
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse-slow ${
                            isDemoMode
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        }`} />
                        <span className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${
                            isDemoMode ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                            {isDemoMode ? 'Demo Replay' : 'Live Stream'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter IP / Port"
                            className="bg-black/20 border border-white/10 text-zinc-300 text-xs rounded-md pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600 font-mono"
                        />
                    </div>
                    <button className="p-2 hover:bg-white/5 text-zinc-400 rounded-md border border-transparent transition-colors">
                        <Pause size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-md text-xs border border-white/5 transition-colors font-medium"
                    >
                        <Download size={14} />
                        Export PCAP
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-500 font-mono text-sm p-4 animate-pulse">Loading flows...</div>
            ) : (
                <Table data={flows} columns={columns} emptyMessage="No flows detected." />
            )}
        </div>
    );
};

export default Flows;