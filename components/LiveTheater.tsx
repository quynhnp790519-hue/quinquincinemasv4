import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Seat, SeatStatus, SocketMessageType, Movie } from '../types';
import { Monitor, RefreshCcw, User, Ban, ChevronDown, CheckCheck } from 'lucide-react';

export const LiveTheater: React.FC = () => {
  const { sendMessage, lastMessage, isConnected } = useSocket();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // 1. Lấy danh sách phim khi khởi động
  useEffect(() => {
    if (isConnected) {
        sendMessage(SocketMessageType.GET_MOVIES, {});
    }
  }, [isConnected, sendMessage]);

  // 2. Lấy ghế khi phim được chọn
  useEffect(() => {
    if (isConnected && selectedMovieId) {
        setLoading(true);
        sendMessage(SocketMessageType.GET_ROOM_STATE, { movieId: selectedMovieId });
    }
  }, [selectedMovieId, isConnected, sendMessage]);

  // Handle Updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === SocketMessageType.MOVIES_UPDATE) {
      const updatedMovies = lastMessage.payload.movies;
      setMovies(updatedMovies);
      // Mặc định chọn phim đầu tiên nếu chưa chọn
      if (!selectedMovieId && updatedMovies.length > 0) {
        setSelectedMovieId(updatedMovies[0].id);
      }
    }

    if (lastMessage.type === SocketMessageType.ROOM_STATE_RESPONSE) {
      // Chỉ cập nhật nếu đúng phim đang xem
      if (lastMessage.payload.movieId === selectedMovieId || !selectedMovieId) {
          setSeats(lastMessage.payload.seats);
          setLoading(false);
      }
    }

    if (lastMessage.type === SocketMessageType.SEAT_UPDATE) {
      // Chỉ cập nhật real-time nếu đúng phim đang xem
      if (lastMessage.payload.movieId === selectedMovieId) {
          const { seatId, status } = lastMessage.payload;
          setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status } : s));
      }
    }

    if (lastMessage.type === SocketMessageType.RESET_CONFIRMED) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 2000);
    }
  }, [lastMessage, selectedMovieId]);

  const handleReset = () => {
    if(confirm(`CẢNH BÁO: Reset phòng cho phim đang chọn? Tất cả ghế đã đặt sẽ bị hủy.`)) {
      setLoading(true);
      sendMessage(SocketMessageType.RESET_ROOM, { movieId: selectedMovieId });
    }
  };

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case SeatStatus.AVAILABLE: return 'bg-slate-700/50 hover:bg-slate-600 text-slate-400 cursor-default';
      case SeatStatus.BOOKED: return 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] text-white border border-red-400';
      case SeatStatus.VIP: return 'bg-purple-900/80 border border-purple-500 text-purple-200';
      default: return 'bg-slate-800';
    }
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800 relative">
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center border-b border-slate-700 pb-1 z-10">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Sơ đồ Phòng Chiếu
        </span>
        
        {/* Dropdown chọn phim */}
        <div className="relative group">
            <select 
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="bg-slate-800 text-white text-xs border border-slate-600 rounded px-2 py-1 outline-none focus:border-emerald-500 appearance-none pr-8 cursor-pointer"
            >
                {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-slate-400 pointer-events-none"/>
        </div>
      </div>

      {/* Màn hình chiếu */}
      <div className="mt-12 h-12 bg-gradient-to-b from-emerald-500/10 to-transparent flex items-center justify-center mx-12 rounded-t-[50%] border-t-2 border-emerald-500/30 shadow-[0_-10px_20px_rgba(16,185,129,0.1)]">
        <span className="text-[10px] tracking-[0.5em] text-emerald-600 font-bold uppercase">Màn Hình</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center relative">
        {resetSuccess && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl font-bold">
                    <CheckCheck size={20} /> Đã Reset Phòng!
                </div>
            </div>
        )}

        {loading ? (
          <div className="text-emerald-500 animate-pulse flex items-center gap-2">
            <RefreshCcw className="animate-spin" size={16}/> Đang tải dữ liệu phòng...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map(row => (
              <div key={row} className="flex gap-3 justify-center">
                <div className="w-4 text-slate-600 font-mono text-xs flex items-center justify-center">{row}</div>
                {seats.filter(s => s.row === row).map(seat => (
                  <div
                    key={seat.id}
                    title={`Ghế ${seat.id} - ${seat.price.toLocaleString()}đ`}
                    className={`
                      w-8 h-8 rounded-t md:rounded-t-lg flex items-center justify-center text-[10px] font-bold transition-all duration-300
                      ${getSeatColor(seat.status)}
                    `}
                  >
                    {seat.status === SeatStatus.BOOKED ? <User size={12} /> : seat.number}
                  </div>
                ))}
                <div className="w-4 text-slate-600 font-mono text-xs flex items-center justify-center">{row}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Admin Control */}
      <div className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-6">
        <div className="flex gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700 rounded"></div> Trống</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-600 rounded"></div> Đã bán</div>
        </div>
        
        <button 
          onClick={handleReset}
          className="bg-red-950 hover:bg-red-900 text-red-500 border border-red-900 px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-2"
        >
          <RefreshCcw size={12} /> Reset Phim Này
        </button>
      </div>
    </div>
  );
};