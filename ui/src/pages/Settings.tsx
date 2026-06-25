import React, { useEffect, useState } from 'react';
import { Save, HardDrive, Shield, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';

const Settings: React.FC = () => {
    const [interfaces, setInterfaces] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [config, setConfig] = useState({ interface: '', model: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [ifaceRes, modelRes, configRes] = await Promise.all([
                    apiClient.get<string[]>('/settings/interfaces'),
                    apiClient.get<string[]>('/settings/models'),
                    apiClient.get<{ interface: string, model: string }>('/settings/config')
                ]);
                setInterfaces(ifaceRes.data);
                setModels(modelRes.data);
                setConfig(configRes.data);
            } catch (e) {
                console.error("Failed to load settings:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSavedMsg('');
        try {
            await apiClient.post('/settings/config', config);
            setSavedMsg('Configuration Applied to Pipeline');
            setTimeout(() => setSavedMsg(''), 3000);
        } catch (e) {
            console.error("Save failed:", e);
            setSavedMsg('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-zinc-500 font-mono text-sm animate-pulse">Querying core engine settings...</div>;

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Configuration</h1>
                <p className="text-zinc-500 font-mono text-sm">Configure Core Engine Parameters and Resource Allocations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NIDS Implementation */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <HardDrive size={18} className="text-emerald-400" />
                        <h2 className="text-sm font-bold text-zinc-100">Packet Capture Interface</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 font-mono block mb-2">Active Interface</label>
                            <select 
                                value={config.interface}
                                onChange={(e) => setConfig({ ...config, interface: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-md text-zinc-200 p-2 text-sm focus:outline-none focus:border-cyan-500/50"
                            >
                                {interfaces.map((iface) => (
                                    <option key={iface} value={iface}>{iface}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-zinc-600 font-mono mt-2">
                                Changing the interface will immediately bind Scapy to the new network interface.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ML Model Selection */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Shield size={18} className="text-cyan-400" />
                        <h2 className="text-sm font-bold text-zinc-100">Detection Model</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 font-mono block mb-2">Model Selection</label>
                            <select 
                                value={config.model}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-md text-zinc-200 p-2 text-sm focus:outline-none focus:border-cyan-500/50"
                            >
                                {models.map((mod) => (
                                    <option key={mod} value={mod}>{mod}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-zinc-600 font-mono mt-2">
                                Loading a new ML model might cause temporary latency spikes in packet processing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
                {savedMsg && (
                    <span className={`text-xs font-mono font-bold ${savedMsg.includes('Failed') ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {savedMsg}
                    </span>
                )}
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-md transition-colors text-sm font-mono font-bold disabled:opacity-50"
                >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Applying...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
