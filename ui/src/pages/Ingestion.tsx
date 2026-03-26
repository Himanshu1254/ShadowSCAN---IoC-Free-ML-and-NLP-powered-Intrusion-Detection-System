import React from 'react';
import { Upload, Database } from 'lucide-react';

const Ingestion: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Data Ingestion</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-8 flex flex-col items-center justify-center border-dashed hover:border-neutral-600 transition-colors cursor-pointer group">
                    <div className="p-4 bg-neutral-900 rounded-full mb-4 group-hover:bg-neutral-800 transition-colors">
                        <Upload size={32} className="text-neutral-400 group-hover:text-neutral-200" />
                    </div>
                    <h3 className="text-neutral-200 font-medium mb-2">Upload PCAP File</h3>
                    <p className="text-neutral-500 text-sm text-center max-w-xs">
                        Drag and drop .pcap or .pcapng files here to analyze network traffic offline.
                    </p>
                </div>

                <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Database size={20} className="text-orange-500" />
                        <h3 className="text-neutral-200 font-medium">Active Data Sources</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-sm border border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <div>
                                    <div className="text-sm text-neutral-200 font-mono">interface-eth0</div>
                                    <div className="text-xs text-neutral-500">Live Capture</div>
                                </div>
                            </div>
                            <span className="text-xs text-neutral-400 font-mono">1.2 Gbps</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-sm border border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-neutral-600 rounded-full"></div>
                                <div>
                                    <div className="text-sm text-neutral-200 font-mono">syslog-forwarder</div>
                                    <div className="text-xs text-neutral-500">Log Stream</div>
                                </div>
                            </div>
                            <span className="text-xs text-neutral-400 font-mono">Idle</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ingestion;