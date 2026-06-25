import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, Layers, Thermometer, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import type { CpuRamTelemetry, DiskTelemetry, GpuEntry } from '../types';

// -----------------------------------------------
// Circular Gauge
// -----------------------------------------------
interface GaugeProps {
    value: number;
    label: string;
    color: string;
    unit?: string;
}

const CircularGauge: React.FC<GaugeProps> = ({ value, label, color, unit = '%' }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const clampedValue = Math.min(Math.max(value, 0), 100);
    const dashOffset = circumference * (1 - clampedValue / 100);

    const strokeColor = clampedValue > 85
        ? '#f43f5e'
        : clampedValue > 65
            ? '#f59e0b'
            : color;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Track */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    {/* Progress */}
                    <circle
                        cx="50" cy="50" r={radius} fill="none"
                        stroke={strokeColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 6px ${strokeColor}80)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold font-mono text-zinc-100">{clampedValue.toFixed(0)}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{unit}</span>
                </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">{label}</span>
        </div>
    );
};

// -----------------------------------------------
// System Health Page
// -----------------------------------------------
const SystemHealth: React.FC = () => {
    const [hardware, setHardware] = useState<CpuRamTelemetry | null>(null);
    const [disk, setDisk] = useState<DiskTelemetry | null>(null);
    const [gpu, setGpu] = useState<GpuEntry[] | null>(null);
    const [gpuError, setGpuError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchAll = async () => {
        try {
            const [hwRes, diskRes, gpuRes] = await Promise.all([
                apiClient.get<CpuRamTelemetry>('/hids/hardware/cpu_ram'),
                apiClient.get<DiskTelemetry>('/hids/hardware/disk'),
                apiClient.get('/hids/hardware/gpu'),
            ]);
            setHardware(hwRes.data);
            setDisk(diskRes.data);
            if (gpuRes.data.error) {
                setGpuError(gpuRes.data.error);
            } else {
                setGpu(gpuRes.data);
                setGpuError(null);
            }
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Failed to fetch hardware telemetry', e);
        }
    };

    useEffect(() => {
        // Wrap in setTimeout to avoid synchronous setState inside effect body
        setTimeout(fetchAll, 0);
        const iv = setInterval(fetchAll, 3000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Health</h1>
                    <p className="text-zinc-500 font-mono text-sm">Live hardware telemetry from HIDS hardware trackers.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono mt-1">
                    <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '4s' }} />
                    Updated {lastUpdated.toLocaleTimeString()}
                </div>
            </div>

            {/* CPU & RAM Gauges */}
            <div className="glass-panel p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-md">
                        <Cpu size={15} className="text-cyan-400" />
                    </div>
                    <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">CPU & Memory</h2>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-16">
                    <CircularGauge value={hardware?.total_cpu ?? 0} label="CPU Load" color="#06b6d4" />
                    <CircularGauge value={hardware?.total_ram ?? 0} label="RAM Usage" color="#8b5cf6" />

                    {/* Detail */}
                    <div className="space-y-4 min-w-[200px]">
                        {[
                            { label: 'CPU', value: hardware?.total_cpu ?? 0, color: 'bg-cyan-500' },
                            { label: 'RAM', value: hardware?.total_ram ?? 0, color: 'bg-violet-500' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[10px] font-bold font-mono text-zinc-300">{item.value.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${item.value > 85 ? 'bg-rose-500' : item.value > 65 ? 'bg-amber-500' : item.color}`}
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Disk Drives */}
            {disk && (
                <div className="glass-panel p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                            <HardDrive size={15} className="text-amber-400" />
                        </div>
                        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">Disk Storage</h2>
                    </div>

                    {/* Aggregate */}
                    {disk.total_aggregate?.total_size_gb && (
                        <div className="bg-black/30 border border-white/5 rounded-md p-4">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                                <span>Total Aggregate</span>
                                <span>{disk.total_aggregate.global_percent_used}% used</span>
                            </div>
                            <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${disk.total_aggregate.global_percent_used > 85 ? 'bg-rose-500' : disk.total_aggregate.global_percent_used > 65 ? 'bg-amber-500' : 'bg-amber-400'}`}
                                    style={{ width: `${disk.total_aggregate.global_percent_used}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-2">
                                <span>{disk.total_aggregate.total_used_gb} GB used</span>
                                <span>{disk.total_aggregate.total_free_gb} GB free of {disk.total_aggregate.total_size_gb} GB</span>
                            </div>
                        </div>
                    )}

                    {/* Individual Drives */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {disk.individual_drives.map((drive) => (
                            <div key={drive.device} className="bg-black/30 border border-white/5 rounded-md p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold font-mono text-zinc-200">{drive.device}</div>
                                        <div className="text-[9px] text-zinc-600 font-mono">{drive.file_system} · {drive.mountpoint}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold font-mono ${drive.percent_used > 85 ? 'text-rose-400' : 'text-zinc-400'}`}>
                                        {drive.percent_used}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${drive.percent_used > 85 ? 'bg-rose-500' : drive.percent_used > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${drive.percent_used}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                                    <span>{drive.used_gb} GB used</span>
                                    <span>{drive.free_gb} GB free</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GPU */}
            <div className="glass-panel p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-md">
                        <Layers size={15} className="text-violet-400" />
                    </div>
                    <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">GPU Telemetry</h2>
                </div>

                {gpuError ? (
                    <div className="bg-black/30 border border-white/5 rounded-md p-6 text-center">
                        <div className="text-zinc-600 text-xs font-mono">{gpuError}</div>
                    </div>
                ) : gpu && gpu.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {gpu.map((g) => (
                            <div key={g.id} className="bg-black/30 border border-white/5 rounded-md p-5 space-y-4">
                                <div>
                                    <div className="text-xs font-bold font-mono text-zinc-200">{g.name}</div>
                                    <div className="text-[9px] text-zinc-600 font-mono">GPU #{g.id}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'GPU Load', value: g.load_percent, color: 'bg-violet-500', unit: '%' },
                                        { label: 'VRAM Used', value: (g.memory_used_mb / g.memory_total_mb) * 100, color: 'bg-blue-500', unit: '%' },
                                    ].map(m => (
                                        <div key={m.label}>
                                            <div className="flex justify-between text-[9px] font-mono text-zinc-600 mb-1">
                                                <span>{m.label}</span>
                                                <span>{m.value.toFixed(1)}{m.unit}</span>
                                            </div>
                                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                <div className={`h-full rounded-full ${m.value > 85 ? 'bg-rose-500' : m.color}`} style={{ width: `${Math.min(m.value, 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                                    <Thermometer size={12} className={g.temperature_c > 80 ? 'text-rose-400' : 'text-zinc-500'} />
                                    <span className={g.temperature_c > 80 ? 'text-rose-400 font-bold' : ''}>{g.temperature_c}°C</span>
                                    <span className="ml-3 text-zinc-700">{g.memory_used_mb} / {g.memory_total_mb} MB VRAM</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-black/30 border border-white/5 rounded-md p-6 text-center">
                        <div className="text-zinc-600 text-xs font-mono">No GPU data available.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemHealth;
