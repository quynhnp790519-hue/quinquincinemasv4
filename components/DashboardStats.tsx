import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { analyzeTraffic } from '../services/geminiService';
import { DollarSign, Users, Ticket, Activity, Bot } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { stats, logs } = useSocket();
  const [aiSummary, setAiSummary] = useState<string>("Đang chờ dữ liệu...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (stats.totalRevenue > 0 && !isAnalyzing) {
      setIsAnalyzing(true);
      const timer = setTimeout(async () => {
        const result = await analyzeTraffic(stats, logs.slice(0, 5));
        setAiSummary(result);
        setIsAnalyzing(false);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [stats.ticketsSold]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      {/* Cards Thống kê */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tổng Doanh Thu</span>
          <div className="p-1.5 bg-emerald-500/10 rounded-md"><DollarSign size={16} className="text-emerald-500" /></div>
        </div>
        <div className="text-xl font-bold text-white mt-2">
            {stats.totalRevenue.toLocaleString('vi-VN')} <span className="text-xs text-slate-500">vnđ</span>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Khách Online</span>
          <div className="p-1.5 bg-blue-500/10 rounded-md"><Users size={16} className="text-blue-500" /></div>
        </div>
        <div className="text-xl font-bold text-white mt-2">{stats.activeUsers}</div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tỷ Lệ Lấp Đầy</span>
          <div className="p-1.5 bg-purple-500/10 rounded-md"><Activity size={16} className="text-purple-500" /></div>
        </div>
        <div className="flex items-end gap-2 mt-2">
            <span className="text-xl font-bold text-white">{stats.occupancyRate}%</span>
        </div>
        <div className="w-full bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
          <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${stats.occupancyRate}%` }}></div>
        </div>
      </div>

      {/* AI Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-xl border border-indigo-500/30 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-2 z-10">
          <span className="text-indigo-300 text-xs uppercase font-bold flex items-center gap-2">
            <Bot size={14} /> Trợ lý Gemini
          </span>
          {isAnalyzing && <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>}
        </div>
        <p className="text-xs text-indigo-100 leading-relaxed z-10 font-medium italic">
          "{aiSummary}"
        </p>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Bot size={80} />
        </div>
      </div>
    </div>
  );
};