import React, { useEffect, useState } from 'react';
import Table from '../components/Table';
import { Filter, Download, Pause } from 'lucide-react';
import { apiClient } from '../api/client';
import { Flow } from '../types';

const Flows: React.FC = () => {
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlows = async () => {
            try {
                const response = await apiClient.get<Flow[]>('/flows');
                setFlows(response.data);
            } catch (error) {
                console.error("Failed to fetch flows", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlows();
    }, []);

    const columns = [
        { header: 'Time', accessor: (row: Flow) => <span className="text-neutral-500 text-xs">{row.timestamp || new Date().toLocaleTimeString()}</span> },
        { header: 'Source', accessor: (row: Flow) => <span className="text-neutral-300">{row.src_ip}</span> },
        { header: 'Port', accessor: (row: Flow) => <span className="text-neutral-500">{row.src_port}</span> },
        { header: 'Destination', accessor: (row: Flow) => <span className="text-neutral-300">{row.dst_ip}</span> },
        { header: 'Port', accessor: (row: Flow) => <span className="text-neutral-500">{row.dst_port}</span> },
        { 
            header: 'Proto', 
            accessor: (row: Flow) => (
                <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    row.protocol === 'SSH' ? 'border-orange-500/30 text-orange-500' : 'border-neutral-700 text-neutral-400'
                }`}>
                    {row.protocol}
                </span>
            ) 
        },
        { header: 'Size', accessor: (row: Flow) => <span className="text-neutral-400">{row.packet_count} p</span> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-sm border border-neutral-800">
                <div className="flex items-center gap-4">
                    <h2 className="text-neutral-200 font-bold tracking-tight">Packet Flows</h2>
                    <div className="flex items-center gap-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-neutral-500 font-mono uppercase">Live Stream</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-neutral-300" />
                        <input 
                            type="text" 
                            placeholder="Filter IP / Port" 
                            className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-sm pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700 font-mono"
                        />
                    </div>
                    <button className="p-2 hover:bg-neutral-900 text-neutral-400 rounded-sm border border-transparent hover:border-neutral-800 transition-colors">
                        <Pause size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-sm text-xs border border-neutral-800 transition-colors font-medium">
                        <Download size={14} />
                        Export PCAP
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-neutral-500 font-mono text-sm p-4">Loading flows...</div>
            ) : (
                <Table data={flows} columns={columns} emptyMessage="No flows detected." />
            )}
        </div>
    );
};

export default Flows;