import React, { useState } from 'react';
import { SocketProvider } from './context/SocketContext';
import { ProtocolConsole } from './components/ProtocolConsole';
import { LiveTheater } from './components/LiveTheater';
import { DashboardStats } from './components/DashboardStats';
import { CustomerClient } from './components/CustomerClient';
import { AdminMovieManager } from './components/AdminMovieManager';
import { AdminUserManager } from './components/AdminUserManager';
import { LayoutDashboard, Server, Film, Armchair, Users } from 'lucide-react';

const App: React.FC = () => {
  const [adminView, setAdminView] = useState<'DASHBOARD' | 'MOVIES' | 'USERS'>('DASHBOARD');

  return (
    <SocketProvider>
      <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        
        {/* CỘT TRÁI: LOGS GIAO THỨC */}
        <ProtocolConsole />

        {/* KHU VỰC CHÍNH */}
        <div className="flex-1 flex gap-4 p-4 h-full bg-slate-900">
            
            {/* PHẦN 1: CLIENT ADMIN (CHIẾM 60%) */}
            <div className="flex-[3] flex flex-col gap-4 min-w-0">
                {/* Admin Header */}
                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
                            <LayoutDashboard size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm">HỆ THỐNG QUẢN TRỊ RẠP (ADMIN)</h1>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <Server size={10} />
                                <span>Server: ws://cinema-socket-vn:8080</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-900 rounded p-1 border border-slate-700 gap-1">
                        <button 
                            onClick={() => setAdminView('DASHBOARD')}
                            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${adminView === 'DASHBOARD' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Armchair size={14} /> Trực Quan Ghế
                        </button>
                        <button 
                            onClick={() => setAdminView('MOVIES')}
                            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${adminView === 'MOVIES' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Film size={14} /> Quản Lý Phim
                        </button>
                        <button 
                            onClick={() => setAdminView('USERS')}
                            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${adminView === 'USERS' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Users size={14} /> Quản Lý User
                        </button>
                    </div>
                </div>

                {/* Main Admin Content */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {adminView === 'DASHBOARD' && (
                        <>
                            <DashboardStats />
                            <div className="flex-1 min-h-0">
                                <LiveTheater />
                            </div>
                        </>
                    )}
                    {adminView === 'MOVIES' && (
                        <div className="flex-1 min-h-0">
                            <AdminMovieManager />
                        </div>
                    )}
                    {adminView === 'USERS' && (
                        <div className="flex-1 min-h-0">
                            <AdminUserManager />
                        </div>
                    )}
                </div>
            </div>

            {/* PHẦN 2: CLIENT KHÁCH HÀNG (CHIẾM 40% - MÔ PHỎNG MOBILE) */}
            <div className="flex-[2] flex flex-col min-w-[320px] border-l border-slate-800 pl-4">
                <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                    Mô phỏng Client Khách Hàng
                </div>
                {/* Ứng dụng Khách Hàng */}
                <div className="flex-1 border-[8px] border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl bg-black relative">
                    {/* Tai thỏ (Notch) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-50"></div>
                    <CustomerClient />
                </div>
                <div className="mt-2 text-center text-[10px] text-slate-600">
                    * Đồng bộ dữ liệu real-time với Admin qua Socket
                </div>
            </div>

        </div>
      </div>
    </SocketProvider>
  );
};

export default App;