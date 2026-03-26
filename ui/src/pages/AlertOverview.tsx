import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Terminal, Activity, Crosshair, Lock } from 'lucide-react';
import Table from '../components/Table';
import { apiClient } from '../api/client';

const AlertOverview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [alert, setAlert] = useState<any>(location.state?.alert || null);
    const [relatedFlows, setRelatedFlows] = useState<any[]>([]);

    useEffect(() => {
        if (!alert) {
            apiClient.get('/alerts').then(res => {
                if (res.data.length > 0) setAlert(res.data[0]);
            });
        }
    }, [alert]);

    useEffect(() => {
        if (alert) {
            apiClient.get('/flows').then(res => {
                const correlated = res.data
                    .filter((f: any) => f.src_ip === alert.src_ip || f.dst_ip === alert.dst_ip)
                    .slice(0, 5);
                setRelatedFlows(correlated);
            });
        }
    }, [alert]);

    const flowColumns = [
        { header: 'Timestamp', accessor: (row: any) => <span className="text-neutral-500">{row.timestamp || 'N/A'}</span> },
        { header: 'Src IP', accessor: 'src_ip' },
        { header: 'Dst IP', accessor: 'dst_ip' },
        { header: 'Proto', accessor: 'protocol' },
        { header: 'Packets', accessor: 'packet_count' },
    ];

    const getSeverityColor = (severity: string) => {
        if (severity === "HIGH") return "bg-red-600";
        if (severity === "MEDIUM") return "bg-yellow-500";
        return "bg-green-600";
    };

    if (!alert) {
        return <div className="p-8 text-neutral-500">Loading alert details...</div>;
    }

    return (
        <div className="space-y-6">
            <button 
                onClick={() => navigate('/intelligence')}
                className="flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors text-xs font-mono uppercase tracking-wide"
            >
                <ArrowLeft size={14} /> Back to Intelligence
            </button>

            {/* Header */}
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-6 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-red-900/10 rotate-12">
                    <AlertTriangle size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-5">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center text-red-500">
                            <Shield size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-xl font-bold text-neutral-100">{alert.title}</h1>
                                <span className={`px-2 py-0.5 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm ${getSeverityColor(alert.severity)}`}>
                                    {alert.severity}
                                </span>
                            </div>

                            <div className="flex gap-4 text-xs font-mono text-neutral-400 mb-2">
                                <span>Confidence: {alert.confidence}</span>
                                <span>Protocol: {alert.protocol}</span>
                            </div>

                            <p className="text-neutral-400 text-sm mt-2 max-w-2xl font-mono leading-relaxed border-l-2 border-neutral-800 pl-3">
                                {alert.reason}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-5">
                        <div className="flex items-center gap-2 text-neutral-200 text-sm font-bold uppercase tracking-wide mb-4 pb-2 border-b border-neutral-800">
                            <Crosshair size={14} className="text-orange-500" />
                            Target Analysis
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase mb-1 font-mono">Source</div>
                                <div className="font-mono text-neutral-200 bg-neutral-900 p-2 rounded border border-neutral-800 text-sm">
                                    {alert.src_ip}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase mb-1 font-mono">Destination</div>
                                <div className="font-mono text-neutral-200 bg-neutral-900 p-2 rounded border border-neutral-800 text-sm">
                                    {alert.dst_ip}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-5">
                        <div className="flex items-center gap-2 text-neutral-200 text-sm font-bold uppercase tracking-wide mb-4 pb-2 border-b border-neutral-800">
                            <Terminal size={14} className="text-neutral-500" />
                            Suggested Action
                        </div>

                        <div className="text-sm text-neutral-300 font-mono">
                            {alert.action}
                        </div>
                    </div>
                </div>

                {/* Flows */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-800 rounded-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-neutral-200 text-sm font-bold uppercase tracking-wide">
                            <Activity size={14} className="text-neutral-500" />
                            Correlated Traffic
                        </div>
                    </div>

                    <Table data={relatedFlows} columns={flowColumns} emptyMessage="No correlated flows found." />
                </div>
            </div>
        </div>
    );
};

export default AlertOverview;