import React, { useState } from 'react';
import { Save, HardDrive, Trash2, Cpu } from 'lucide-react';

const Settings: React.FC = () => {
    const [storage, setStorage] = useState(10);
    const [model, setModel] = useState('llama3');
    const [ram, setRam] = useState(8);

    const handleClearCache = () => {
        alert('Telemetry Cache Cleared.');
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Settings</h1>
                <p className="text-zinc-500 font-mono text-sm">Configure Core Engine Parameters and Resource Allocations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Storage & Cache */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <HardDrive size={18} className="text-emerald-400" />
                        <h2 className="text-sm font-bold text-zinc-100">Storage & Cache</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 font-mono block mb-2">Storage Allocation for PCAP/CSV Logs</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="50" 
                                    value={storage}
                                    onChange={(e) => setStorage(parseInt(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                                <span className="text-sm font-mono text-zinc-200">{storage} GB</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="text-xs text-zinc-400 font-mono block mb-2">Cache Management</label>
                            <button 
                                onClick={handleClearCache}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md transition-colors text-xs font-mono"
                            >
                                <Trash2 size={14} />
                                Clear Telemetry Cache
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ollama Implementation */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Cpu size={18} className="text-cyan-400" />
                        <h2 className="text-sm font-bold text-zinc-100">Ollama Implementation</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 font-mono block mb-2">Model Selection</label>
                            <select 
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-md text-zinc-200 p-2 text-sm focus:outline-none focus:border-cyan-500/50"
                            >
                                <option value="llama3">Llama 3 (8B) - Recommended</option>
                                <option value="mistral">Mistral (7B)</option>
                                <option value="phi3">Phi-3 (3.8B)</option>
                                <option value="gemma">Gemma (7B)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-400 font-mono block mb-2">RAM Allocation (GB)</label>
                            <input 
                                type="number" 
                                min="2" 
                                max="64" 
                                value={ram}
                                onChange={(e) => setRam(parseInt(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-md text-zinc-200 p-2 text-sm focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-md transition-colors text-sm font-mono font-bold">
                    <Save size={16} />
                    Save Configuration
                </button>
            </div>
        </div>
    );
};

export default Settings;
