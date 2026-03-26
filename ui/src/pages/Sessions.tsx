import React, { useEffect, useState } from 'react';
import Table from '../components/Table';
import { Hash, Clock, Shield } from 'lucide-react';
import { apiClient } from '../api/client';
import { Session } from '../types';

const Sessions: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await apiClient.get<Session[]>('/sessions');
                setSessions(response.data);
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const columns = [
        { 
            header: 'Session Key', 
            accessor: (row: Session) => (
                <div className="flex items-center gap-2 font-mono text-xs">
                    <Hash size={12} className="text-neutral-600" />
                    <span className="text-orange-500/80">{row.session_key}</span>
                </div>
            )
        },
        { header: 'Start', accessor: (row: Session) => <span className="text-neutral-400 text-sm">{row.start_time}</span> },
        { 
            header: 'Duration', 
            accessor: (row: Session) => (
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-neutral-600" />
                    <span>{row.duration}</span>
                </div>
            )
        },
        { 
            header: 'Flows', 
            accessor: (row: Session) => (
                <div className="flex items-center gap-2">
                    <span className="w-16 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-neutral-500 h-full" style={{width: `${Math.min(row.flow_count, 100)}%`}}></div>
                    </span>
                    <span className="text-xs text-neutral-500">{row.flow_count}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (row: Session) => (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${
                    row.status === 'Active' 
                        ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' 
                        : row.status === 'Closed' 
                            ? 'border-neutral-700 text-neutral-500' 
                            : 'border-orange-500/20 text-orange-500 bg-orange-500/5'
                }`}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] p-5 rounded-sm border border-neutral-800 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <Shield size={64} />
                    </div>
                    <div className="text-neutral-500 text-xs font-mono uppercase mb-2">Total Sessions</div>
                    <div className="text-3xl font-bold text-neutral-200 font-mono">{sessions.length}</div>
                </div>
                <div className="bg-[#0a0a0a] p-5 rounded-sm border border-neutral-800">
                    <div className="text-neutral-500 text-xs font-mono uppercase mb-2">Longest Duration</div>
                    <div className="text-3xl font-bold text-neutral-200 font-mono">--</div>
                </div>
                <div className="bg-[#0a0a0a] p-5 rounded-sm border border-neutral-800">
                    <div className="text-neutral-500 text-xs font-mono uppercase mb-2">Avg Throughput</div>
                    <div className="text-3xl font-bold text-neutral-200 font-mono">--</div>
                </div>
            </div>

            <div className="border border-neutral-800 rounded-sm bg-[#0a0a0a]">
                <div className="p-4 border-b border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wide">Active Sessions</h3>
                </div>
                {loading ? (
                    <div className="p-4 text-neutral-500">Loading sessions...</div>
                ) : (
                    <Table data={sessions} columns={columns} emptyMessage="No active sessions." />
                )}
            </div>
        </div>
    );
};

export default Sessions;