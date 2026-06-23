import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/Table';
import { AlertTriangle, ChevronRight, Bot, X, Globe } from 'lucide-react';
import { apiClient } from '../api/client';
import { useDemoContext } from '../context/DemoContext';
import type { Alert, AlertTier } from '../types';

// ----------------------------------------
// AI Analysis Side-Panel
// ----------------------------------------
interface AiPanelProps {
    alert: Alert;
    onClose: () => void;
}

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 15); // Speed of typing
        return () => clearInterval(timer);
    }, [text]);

    return <span>{displayedText}</span>;
};

const AiPanel: React.FC<AiPanelProps> = ({ alert, onClose }) => {
    const [reasoning, setReasoning] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const analyze = async () => {
            try {
                const res = await apiClient.post('/api/intelligence/analyze', {
                    src_ip: alert?.src_ip,
                    dst_ip: alert?.dst_ip,
                    attack_type: alert?.attack_type || 'Unknown',
                    severity: alert?.severity,
                    raw_payload: alert?.reason || 'N/A',
                });
                setReasoning(res?.data?.reasoning);
            } catch (e: any) {
                const detail = e?.response?.data?.detail || 'Ollama engine offline. Ensure localhost:11434 is running.';
                setError(detail);
            } finally {
                setLoading(false);
            }
        };
        analyze();
    }, [alert]);

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-cyan-500/30 shadow-[-10px_0_40px_rgba(6,182,212,0.1)] flex flex-col transform transition-transform duration-300 translate-x-0">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0 bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-cyan-400">
                        <Bot size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Ollama Cognitive Analysis</h2>
                        <p className="text-[10px] text-zinc-500 font-mono">Streaming breakdown...</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Alert Context */}
                <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Threat Context</div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Attack Type', value: alert?.attack_type || 'Unknown' },
                            { label: 'Severity', value: alert?.severity },
                            { label: 'Source', value: `${alert?.src_ip} (${alert?.country || '?'})` },
                            { label: 'Destination', value: `${alert?.dst_ip} (${alert?.dst_country || '?'})` },
                            { label: 'Detected By', value: alert?.detected_by || 'N/A' },
                            { label: 'Confidence', value: alert?.confidence || 'N/A' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-black/30 rounded-md p-2.5 border border-white/5">
                                <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest mb-1">{label}</div>
                                <div className="text-xs text-zinc-300 font-mono truncate" title={value}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Reasoning */}
                <div>
                    <div className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest mb-3">Cognitive Breakdown</div>
                    {loading && (
                        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
                            <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                            Querying Ollama LLM engine...
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-red-400 text-xs font-mono">
                            ⚠ {error}
                        </div>
                    )}
                    {reasoning && (
                        <div className="text-zinc-300 text-sm font-mono leading-relaxed border-l-2 border-cyan-500/40 pl-4 py-2 bg-gradient-to-r from-cyan-500/5 to-transparent">
                            <TypewriterText text={reasoning} />
                            <span className="inline-block w-2 h-3 ml-1 bg-cyan-400 animate-pulse" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------
// Intelligence Page
// ----------------------------------------
const Intelligence: React.FC = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [tier, setTier] = useState<AlertTier>('enterprise');
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [unverified, setUnverified] = useState<Record<string, string>>({});

    const { isDemoMode } = useDemoContext();

    const fetchUnverified = async () => {
        try {
            const res = await apiClient.get('/intelligence/unverified');
            setUnverified(res.data);
        } catch {}
    };

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        fetchUnverified();

        if (!isDemoMode) {
            // Live Mode
            const fetchAlerts = async () => {
                try {
                    const response = await apiClient.get(`/alerts?tier=${tier}`);
                    if (isMounted) {
                        setAlerts(response.data);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('Failed to fetch alerts', error);
                    if (isMounted) setLoading(false);
                }
            };
            fetchAlerts();
            const intervalId = setInterval(fetchAlerts, 2000);
            return () => {
                isMounted = false;
                clearInterval(intervalId);
            };
        } else {
            // Demo Mode
            let mockData: Alert[] = [];
            let idx = 0;
            let streamInterval: NodeJS.Timeout;

            const initDemo = async () => {
                try {
                    const response = await apiClient.get(`/alerts?tier=${tier}`);
                    mockData = response.data;
                    setLoading(false);
                    streamInterval = setInterval(() => {
                        if (isMounted && idx < mockData.length) {
                            setAlerts(prev => [mockData[idx], ...prev]);
                            idx++;
                        }
                    }, 800);
                } catch (err) {
                    if (isMounted) setLoading(false);
                }
            };
            initDemo();

            return () => {
                isMounted = false;
                if (streamInterval) clearInterval(streamInterval);
            };
        }
    }, [isDemoMode, tier]);

    const getSeverityStyle = (severity: string) => {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL': return 'tier-critical';
            case 'HIGH': return 'tier-high';
            case 'MEDIUM': return 'tier-medium';
            default: return 'tier-low';
        }
    };

    const tiers: { key: AlertTier; label: string; color: string }[] = [
        { key: 'enterprise', label: 'Enterprise', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
        { key: 'personal', label: 'Personal', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
        { key: 'student', label: 'Student', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    ];

    const columns = [
        {
            header: 'Severity',
            accessor: (row: Alert) => (
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-sm ${getSeverityStyle(row.severity)}`}>
                    {row.severity}
                </span>
            )
        },
        {
            header: 'Attack Type',
            accessor: (row: Alert) => (
                <span className="text-zinc-300 text-xs font-mono">{row.attack_type || 'N/A'}</span>
            )
        },
        {
            header: 'Source',
            accessor: (row: Alert) => (
                <div>
                    <div className="font-mono text-orange-400 text-xs">{row.src_ip}</div>
                    {row.country && <div className="text-[10px] text-zinc-600 font-mono">{row.country}</div>}
                </div>
            )
        },
        {
            header: 'Destination',
            accessor: (row: Alert) => (
                <div>
                    <div className="font-mono text-zinc-400 text-xs">{row.dst_ip}</div>
                    {row.dst_country && <div className="text-[10px] text-zinc-600 font-mono">{row.dst_country}</div>}
                </div>
            )
        },
        {
            header: 'Detected By',
            accessor: (row: Alert) => (
                <span className="text-cyan-500/80 text-[10px] font-mono">{row.detected_by || '—'}</span>
            )
        },
        {
            header: 'Score',
            accessor: (row: Alert) => row.anomaly_score != null ? (
                <div className="flex items-center gap-2">
                    <div className="w-14 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full rounded-full ${row.anomaly_score > 90 ? 'bg-rose-500' : row.anomaly_score > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(row.anomaly_score, 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{row.anomaly_score}%</span>
                </div>
            ) : <span className="text-zinc-600 text-xs">—</span>
        },
        {
            header: 'Conf',
            accessor: (row: Alert) => <span className="text-zinc-400 font-mono text-xs">{row.confidence || '—'}</span>
        },
        {
            header: 'AI',
            accessor: (row: Alert) => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedAlert(row); }}
                    className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    title="AI Analysis"
                >
                    <Bot size={12} />
                </button>
            ),
            className: 'w-10'
        },
        {
            header: '',
            accessor: () => <ChevronRight size={14} className="text-zinc-600" />,
            className: 'w-8'
        },
    ];

    const unverifiedEntries = Object.entries(unverified);

    return (
        <>
            {selectedAlert && <AiPanel alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}

            <div className="animate-fade-in space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Threat Intelligence</h1>
                        <p className="text-zinc-500 font-mono text-sm mt-1">NIDS anomaly stream with AI cognitive analysis.</p>
                    </div>

                    {/* Tier Selector */}
                    <div className="flex items-center gap-1 glass-panel p-1 rounded-lg self-start sm:self-auto">
                        {tiers.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTier(t.key)}
                                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md border transition-all ${
                                    tier === t.key ? t.color : 'text-zinc-600 border-transparent hover:text-zinc-400'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Alert Stats Banner */}
                <div className={`glass-panel p-4 flex items-center justify-between ${(alerts || []).length > 0 ? 'border-rose-500/20' : 'border-emerald-500/10'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-md border ${(alerts || []).length > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="text-zinc-200 font-bold text-sm">
                                {(alerts || []).length > 0 ? `${(alerts || []).length} Active Threats` : 'Network Clear'}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-0.5 font-mono">
                                Mode: <span className="text-zinc-300 font-semibold uppercase">{tier}</span> — Click any row for details · Click <Bot size={10} className="inline" /> for AI analysis
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alert Table */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Live Alert Feed</h2>
                    </div>
                    {loading ? (
                        <div className="p-6 text-zinc-500 font-mono text-sm animate-pulse glass-panel">Loading intelligence feed...</div>
                    ) : (
                        <Table
                            data={alerts || []}
                            columns={columns}
                            onRowClick={(row) => setSelectedAlert(row)}
                        />
                    )}
                </div>

                {/* Unverified Entities Panel */}
                {(unverifiedEntries || []).length > 0 && (
                    <div className="glass-panel p-5 space-y-4 border-amber-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
                                <Globe size={14} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-200">Unverified Entities</h3>
                                <p className="text-[10px] text-zinc-500 font-mono">{(unverifiedEntries || []).length} IPs with no reverse DNS — flagged for triage</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(unverifiedEntries || []).slice(0, 12).map(([ip, label]) => (
                                <div key={ip} className="flex items-center justify-between bg-black/30 rounded-md px-3 py-2 border border-white/5">
                                    <span className="font-mono text-xs text-orange-400">{ip}</span>
                                    <span className="text-[10px] text-zinc-600 font-mono truncate ml-2">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Intelligence;