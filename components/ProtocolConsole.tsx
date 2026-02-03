import React, { useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Terminal, ArrowDown, ArrowUp } from 'lucide-react';

export const ProtocolConsole: React.FC = () => {
  const { logs } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0; // Keep at top because we render reversed
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 font-mono text-xs w-80 shadow-2xl flex-shrink-0">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400">
          <Terminal size={16} />
          <span className="font-bold tracking-wider">SYSTEM LOGS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-400 text-[10px]">LIVE</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700" ref={scrollRef}>
        {logs.map((log, idx) => {
          const isNewOrder = log.message.type === 'NEW_ORDER';
          const isError = log.message.type.includes('FAILURE');
          
          return (
            <div 
              key={log.message.id + idx} 
              className={`
                p-2 rounded border-l-2 transition-all
                ${log.direction === 'OUT' ? 'border-blue-500 bg-blue-950/10' : 'border-emerald-500 bg-emerald-950/10'}
                ${isNewOrder ? 'bg-emerald-900/30 border-emerald-400' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-1 opacity-70">
                <span className={`font-bold flex items-center gap-1 ${log.direction === 'OUT' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {log.direction === 'OUT' ? <ArrowUp size={10}/> : <ArrowDown size={10}/>}
                  {log.direction === 'OUT' ? 'ADMIN' : 'SERVER'}
                </span>
                <span className="text-slate-500 text-[9px]">
                  {new Date(log.message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className={`font-semibold mb-1 ${isNewOrder ? 'text-white' : 'text-slate-300'}`}>
                {log.message.type}
              </div>

              {/* Special highlighting for Orders */}
              {isNewOrder && log.message.payload.customer ? (
                 <div className="text-emerald-200 bg-emerald-900/40 p-1.5 rounded text-[10px] space-y-1">
                    <div>🎬 <span className="font-bold text-white">{log.message.payload.movie}</span></div>
                    <div>👤 {log.message.payload.customer}</div>
                    <div>💺 Ghế: <span className="font-bold">{log.message.payload.seat}</span></div>
                    <div>💰 {log.message.payload.price?.toLocaleString()}đ</div>
                 </div>
              ) : (
                <pre className={`text-[10px] overflow-x-auto whitespace-pre-wrap break-all ${isError ? 'text-red-400' : 'text-slate-500'}`}>
                  {JSON.stringify(log.message.payload, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="text-center text-slate-600 mt-10 italic">Waiting for connection...</div>
        )}
      </div>
    </div>
  );
};