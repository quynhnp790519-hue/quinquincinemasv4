import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { SocketMessageType } from '../types';
import { Smartphone, Send } from 'lucide-react';

export const CustomerSimulator: React.FC = () => {
  const { sendMessage } = useSocket();
  const [seatId, setSeatId] = useState('');
  const [userId, setUserId] = useState(`Guest-${Math.floor(Math.random() * 1000)}`);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatId) return;

    // Simulate a Customer sending a request to the server
    sendMessage(SocketMessageType.BOOK_SEAT_REQUEST, {
      seatId: seatId.toUpperCase(),
      userId: userId
    });
    setSeatId('');
  };

  return (
    <div className="fixed bottom-6 right-6 bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-2xl w-72 z-50">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700 text-orange-400">
        <Smartphone size={18} />
        <span className="font-bold text-sm">Customer Simulator (Client B)</span>
      </div>
      
      <form onSubmit={handleBook} className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold">User Identity</label>
          <input 
            type="text" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold">Target Seat (e.g., A1, B5)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={seatId}
              onChange={(e) => setSeatId(e.target.value)}
              placeholder="A1"
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white font-mono placeholder:text-slate-600 focus:border-orange-500 outline-none"
              maxLength={3}
            />
            <button 
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 rounded flex items-center justify-center transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </form>
      <div className="mt-3 text-[10px] text-slate-500 leading-tight">
        * Sends <code>BOOK_SEAT_REQUEST</code> to server. Admin dashboard should update instantly.
      </div>
    </div>
  );
};