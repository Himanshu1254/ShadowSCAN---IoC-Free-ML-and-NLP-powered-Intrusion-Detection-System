import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Terminal, Activity, Crosshair } from 'lucide-react';
import Table from '../components/Table';
import { apiClient } from '../api/client';

const AlertOverview: React.FC = () => {
    useParams();
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
        { header: 'Timestamp', accessor: (row: any) => <span className="text-zinc-500 text-xs font-mono">{row.timestamp || 'N/A'}</span> },
        { header: 'Src IP', accessor: 'src_ip' },
        { header: 'Dst IP', accessor: 'dst_ip' },
        { header: 'Proto', accessor: 'protocol' },
        { header: 'Packets', accessor: 'packet_count' },
    ];

    const getSeverityColor = (severity: string) => {
        if (severity === "HIGH") return "bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]";
        if (severity === "MEDIUM") return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
        return "bg-emerald-600";
    };

    if (!alert) {
        return <div className="p-8 text-zinc-500 font-mono text-sm animate-pulse">Loading alert details...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <button 
                onClick={() => navigate('/intelligence')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-[10px] font-mono uppercase tracking-widest font-semibold"
            >
                <ArrowLeft size={14} /> Back to Intelligence
            </button>

            {/* Header */}
            <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-rose-500/5 rotate-12 pointer-events-none">
                    <AlertTriangle size={240} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-md flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.15)] shrink-0">
                            <Shield size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{alert.title}</h1>
                                <span className={`px-2 py-0.5 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm ${getSeverityColor(alert.severity)}`}>
                                    {alert.severity}
                                </span>
                            </div>

                            <div className="flex gap-6 text-[11px] font-mono uppercase tracking-widest font-semibold text-zinc-500 mb-4">
                                <span className="flex gap-2"><span className="text-zinc-600">Conf:</span> <span className="text-cyan-400">{alert.confidence}</span></span>
                                <span className="flex gap-2"><span className="text-zinc-600">Proto:</span> <span className="text-orange-400">{alert.protocol}</span></span>
                            </div>

                            <p className="text-zinc-400 text-sm mt-2 max-w-3xl font-mono leading-relaxed border-l-[3px] border-rose-500/30 pl-4 py-1 bg-gradient-to-r from-rose-500/5 to-transparent">
                                {alert.reason}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6">
                        <div className="flex items-center gap-3 text-zinc-200 text-sm font-bold uppercase tracking-widest font-mono mb-5 pb-3 border-b border-white/5">
                            <Crosshair size={16} className="text-orange-500" />
                            Target Analysis
                        </div>

                        <div className="space-y-5">
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono font-semibold">Source IP</div>
                                <div className="font-mono text-zinc-200 bg-black/40 p-3 rounded-md border border-white/5 text-sm">
                                    {alert.src_ip}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono font-semibold">Destination IP</div>
                                <div className="font-mono text-zinc-200 bg-black/40 p-3 rounded-md border border-white/5 text-sm">
                                    {alert.dst_ip}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <div className="flex items-center gap-3 text-zinc-200 text-sm font-bold uppercase tracking-widest font-mono mb-5 pb-3 border-b border-white/5">
                            <Terminal size={16} className="text-emerald-500" />
                            Suggested Action
                        </div>

                        <div className="text-sm text-emerald-400 font-mono bg-emerald-500/5 p-4 rounded-md border border-emerald-500/20 leading-relaxed">
                            {alert.action}
                        </div>
                    </div>
                </div>

                {/* Flows */}
                <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
                    <div className="flex items-center gap-3 text-zinc-200 text-sm font-bold uppercase tracking-widest font-mono mb-5 pb-3 border-b border-white/5">
                        <Activity size={16} className="text-cyan-500" />
                        Correlated Traffic
                    </div>

                    <div className="flex-1">
                        <Table data={relatedFlows} columns={flowColumns} emptyMessage="No correlated flows found in current buffer." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertOverview;