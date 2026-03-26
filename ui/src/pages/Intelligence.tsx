import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/Table';
import { AlertTriangle, ChevronRight, Filter } from 'lucide-react';
import { apiClient } from '../api/client';

const Intelligence: React.FC = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await apiClient.get('/alerts');
                setAlerts(response.data);
            } catch (error) {
                console.error("Failed to fetch alerts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 3000); // live refresh
        return () => clearInterval(interval);
    }, []);

    const getSeverityStyle = (severity: string) => {
        if (severity === "HIGH") return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (severity === "MEDIUM") return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    };

    const columns = [
        { 
            header: 'Severity', 
            accessor: (row: any) => (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-sm ${getSeverityStyle(row.severity)}`}>
                    {row.severity}
                </span>
            )
        },

        {
            header: 'Confidence',
            accessor: (row: any) => (
                <span className="text-cyan-400 font-mono text-xs">
                    {row.confidence || "N/A"}
                </span>
            )
        },

        {
            header: 'Source',
            accessor: (row: any) => (
                <span className="font-mono text-orange-500/80 text-xs">
                    {row.src_ip}
                </span>
            )
        },

        {
            header: 'Destination',
            accessor: (row: any) => (
                <span className="font-mono text-neutral-400 text-xs">
                    {row.dst_ip}
                </span>
            )
        },

        {
            header: 'Protocol',
            accessor: (row: any) => (
                <span className="font-mono text-neutral-500 text-xs">
                    {row.protocol}
                </span>
            )
        },

        {
            header: 'Reason',
            accessor: (row: any) => (
                <span className="text-neutral-400 text-xs max-w-xs truncate">
                    {row.reason || "Anomalous activity"}
                </span>
            )
        },

        { 
            header: '', 
            accessor: () => <ChevronRight size={14} className="text-neutral-700" />,
            className: "w-8"
        },
    ];

    return (
        <div className="space-y-6">

            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-sm p-4 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-900/20 rounded-sm text-red-500 border border-red-900/30">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="text-neutral-200 font-bold tracking-tight">Active Threats Detected</h3>
                        <p className="text-neutral-500 text-xs mt-1">
                            {alerts.length} anomalies detected requiring attention.
                        </p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors">
                    Review All
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                        Alert Feed
                    </h2>
                    <button className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300">
                        <Filter size={12} />
                        Filter
                    </button>
                </div>

                {loading ? (
                    <div className="p-4 text-neutral-500">Loading intelligence...</div>
                ) : (
                    <Table 
                        data={alerts} 
                        columns={columns} 
                        onRowClick={(row) =>
                            navigate(`/alert/${encodeURIComponent(row.src_ip + '-' + row.protocol)}`, { state: { alert: row } })
                        }
                    />
                )}
            </div>
        </div>
    );
};

export default Intelligence;