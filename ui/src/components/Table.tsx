import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

function Table<T>({ data, columns, onRowClick, emptyMessage = "No data available" }: TableProps<T>) {
    return (
        <div className="w-full overflow-hidden border border-white/5 rounded-md glass-panel">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {columns.map((col, index) => (
                                <th 
                                    key={index} 
                                    className={`py-3 px-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <tr 
                                    key={(row as { id?: string | number }).id || rowIndex} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="py-3 px-4 text-sm text-zinc-300 font-mono">
                                            {typeof col.accessor === 'function' 
                                                ? col.accessor(row) 
                                                : (row[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-zinc-600 font-mono text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Table;