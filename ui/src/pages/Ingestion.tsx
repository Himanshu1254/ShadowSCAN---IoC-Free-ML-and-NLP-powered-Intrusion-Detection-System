import React, { useState, useRef } from 'react';
import { Upload, Database, FileText, AlertCircle, CheckCircle, Loader, X } from 'lucide-react';
import { apiClient } from '../api/client';
import type { LogAnalysisResult, AlertTier } from '../types';

const Ingestion: React.FC = () => {
    const [tier, setTier] = useState<AlertTier>('enterprise');
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<LogAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File, isCsv: boolean) => {
        setUploading(true);
        setResult(null);
        setError(null);
        setFilename(file.name);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = isCsv
                ? `/api/upload_log?tier=${tier}`
                : `/upload-log`;

            const res = await apiClient.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Upload failed. Ensure the backend is running.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file, file.name.endsWith('.csv'));
    };

    const tiers: { key: AlertTier; label: string; desc: string }[] = [
        { key: 'enterprise', label: 'Enterprise', desc: 'Full ML anomaly detection on all rows' },
        { key: 'personal', label: 'Personal', desc: 'Safe-list scan for internal traffic' },
        { key: 'student', label: 'Student', desc: 'Educational breakdown of data schema' },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Log Analysis</h1>
                <p className="text-zinc-500 font-mono text-sm">Upload PCAP or CSV traffic logs for offline NIDS analysis.</p>
            </div>

            {/* Tier Selector */}
            <div className="glass-panel p-5 space-y-3">
                <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">Analysis Mode</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {tiers.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTier(t.key)}
                            className={`p-4 rounded-md border text-left transition-all ${
                                tier === t.key
                                    ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                    : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/[0.02]'
                            }`}
                        >
                            <div className={`text-xs font-bold font-mono uppercase tracking-wider mb-1 ${tier === t.key ? 'text-cyan-400' : 'text-zinc-400'}`}>
                                {t.label}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono">{t.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PCAP Upload */}
                <div
                    className={`glass-panel p-8 flex flex-col items-center justify-center min-h-[280px] border-dashed cursor-pointer transition-all group ${
                        dragging ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" accept=".pcap,.pcapng" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], false)} />
                    <div className={`p-5 rounded-full mb-5 border transition-colors ${dragging ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-zinc-900 border-white/5 group-hover:bg-zinc-800'}`}>
                        <Upload size={30} className={dragging ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
                    </div>
                    <h3 className="text-zinc-200 font-semibold text-sm mb-2">Upload PCAP File</h3>
                    <p className="text-zinc-500 text-xs text-center font-mono max-w-[220px]">
                        Drag & drop or click to upload .pcap/.pcapng for NLP log analysis
                    </p>
                </div>

                {/* CSV Upload */}
                <div className="glass-panel p-6 flex flex-col min-h-[280px]">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                            <Database size={15} className="text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-zinc-200 font-semibold text-sm">CSV Log Analysis</h3>
                            <p className="text-[10px] text-zinc-500 font-mono">ML anomaly detection on flow data</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <button
                            onClick={() => csvInputRef.current?.click()}
                            className="flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-mono font-semibold"
                        >
                            <FileText size={16} />
                            Upload CSV Flow Data
                        </button>
                        <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], true)} />
                        <p className="text-[10px] text-zinc-600 font-mono text-center max-w-[200px]">
                            Expects columns: src_ipv4, dst_ipv4, protocol, date_time
                        </p>
                    </div>

                    {/* Active Interfaces */}
                    <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                        <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Active Interfaces</div>
                        {[
                            { name: 'interface-eth0', label: 'Live Capture', active: true, speed: '1.2 Gbps' },
                            { name: 'syslog-forwarder', label: 'Log Stream', active: false, speed: 'Idle' },
                        ].map(iface => (
                            <div key={iface.name} className="flex items-center justify-between bg-black/30 rounded-md px-3 py-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${iface.active ? 'bg-emerald-500 animate-pulse-slow' : 'bg-zinc-600'}`} />
                                    <span className="text-xs text-zinc-300 font-mono">{iface.name}</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">{iface.speed}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            {(uploading || result || error) && (
                <div className="glass-panel p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {uploading && <Loader size={16} className="text-cyan-400 animate-spin" />}
                            {result && !error && <CheckCircle size={16} className="text-emerald-400" />}
                            {error && <AlertCircle size={16} className="text-rose-400" />}
                            <span className="text-sm font-bold text-zinc-200">
                                {uploading ? `Analyzing ${filename}...` : error ? 'Analysis Failed' : `Results: ${filename}`}
                            </span>
                        </div>
                        {!uploading && (
                            <button onClick={() => { setResult(null); setError(null); setFilename(null); }} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {uploading && <div className="h-1 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 animate-pulse rounded-full w-2/3" /></div>}

                    {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-3 text-rose-400 text-xs font-mono">⚠ {error}</div>}

                    {result && (
                        <div className="space-y-4">
                            {/* NLP Report */}
                            {result.report && (
                                <div className="bg-black/40 border border-white/5 rounded-md p-4">
                                    <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest mb-2">NLP Analysis Report</div>
                                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">{result.report}</pre>
                                </div>
                            )}
                            {/* Summary Stats */}
                            {result.summary && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-black/30 border border-white/5 rounded-md p-3">
                                        <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Total Alerts</div>
                                        <div className="text-xl font-bold text-zinc-100 font-mono">{result.summary.total_alerts}</div>
                                    </div>
                                    {Object.entries(result.summary.attack_distribution).slice(0, 3).map(([k, v]) => (
                                        <div key={k} className="bg-black/30 border border-white/5 rounded-md p-3">
                                            <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest truncate">{k}</div>
                                            <div className="text-xl font-bold text-amber-400 font-mono">{v}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Educational insight */}
                            {result.educational_insight && (
                                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-md p-4 text-cyan-300 text-sm font-mono leading-relaxed">
                                    📚 {result.educational_insight}
                                </div>
                            )}
                            {/* Status */}
                            {result.status && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-3 text-emerald-400 text-xs font-mono">
                                    ✓ {result.status}
                                </div>
                            )}
                            {/* Anomalies Table */}
                            {result.anomalies && result.anomalies.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                                        {result.anomalies.length} Anomalies Detected
                                    </div>
                                    <div className="overflow-auto max-h-64 space-y-1">
                                        {result.anomalies.map((a, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-md px-3 py-2 text-xs font-mono">
                                                <span className="text-orange-400">{a.src_ip}</span>
                                                <span className="text-zinc-600">→</span>
                                                <span className="text-zinc-400">{a.dst_ip}</span>
                                                <span className="ml-auto text-rose-400 text-[10px] font-bold">{a.attack_type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Ingestion;