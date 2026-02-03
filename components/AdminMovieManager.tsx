import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { SocketMessageType, Movie } from '../types';
import { Film, Plus, Youtube, Image as ImageIcon, Clock, Star, Save, UploadCloud } from 'lucide-react';

export const AdminMovieManager: React.FC = () => {
  const { sendMessage, lastMessage } = useSocket();
  const [movies, setMovies] = useState<Movie[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [posterPreview, setPosterPreview] = useState(''); // Base64 string
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    sendMessage(SocketMessageType.GET_MOVIES, {});
  }, [sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === SocketMessageType.MOVIES_UPDATE) {
      setMovies(lastMessage.payload.movies);
    }
  }, [lastMessage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPosterPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !trailerUrl) return;

    let finalTrailer = trailerUrl;
    if (trailerUrl.includes('watch?v=')) {
        finalTrailer = trailerUrl.replace('watch?v=', 'embed/');
    }

    const newMoviePayload = {
      title,
      genre,
      duration,
      poster: posterPreview || 'https://via.placeholder.com/300x450?text=No+Poster',
      trailerUrl: finalTrailer,
      rating: 5.0
    };

    sendMessage(SocketMessageType.ADD_MOVIE, newMoviePayload);
    
    // Reset Form
    setTitle('');
    setGenre('');
    setDuration('');
    setPosterPreview('');
    setTrailerUrl('');
    setIsFormOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800 relative">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Film className="text-emerald-500" size={20} />
            <h2 className="font-bold text-white">Quản Lý Phim & Trailers</h2>
        </div>
        <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
        >
            <Plus size={14} /> {isFormOpen ? 'Đóng Form' : 'Thêm Phim Mới'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isFormOpen && (
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Thông tin phim mới</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Tên Phim</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"
                                value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tên phim..." required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Thể loại</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"
                                value={genre} onChange={e => setGenre(e.target.value)} placeholder="Hành động, Hài..." 
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><Clock size={10}/> Thời lượng</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"
                                value={duration} onChange={e => setDuration(e.target.value)} placeholder="120 phút" 
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1"><ImageIcon size={10}/> Poster (Upload)</label>
                            <div className="flex items-center gap-2">
                                <label className="flex-1 cursor-pointer bg-slate-900 border border-slate-700 border-dashed rounded px-2 py-1.5 text-sm text-slate-400 hover:border-emerald-500 flex items-center justify-center gap-2">
                                    <UploadCloud size={14}/> <span>{posterPreview ? 'Đã chọn ảnh' : 'Chọn ảnh...'}</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                                {posterPreview && <img src={posterPreview} alt="Preview" className="h-8 w-8 object-cover rounded border border-slate-600" />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-emerald-400 font-bold mb-1 block flex items-center gap-1"><Youtube size={12}/> Link Trailer (YouTube Embed / MP4)</label>
                        <input 
                            className="w-full bg-slate-900 border border-emerald-900/50 rounded px-2 py-1.5 text-sm text-emerald-200 placeholder:text-slate-600 focus:border-emerald-500 outline-none"
                            value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." required
                        />
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 mt-2">
                        <Save size={14} /> Lưu & Phát Hành
                    </button>
                </form>
            </div>
        )}

        <div className="grid grid-cols-1 gap-3">
            {movies.map((movie) => (
                <div key={movie.id} className="flex bg-slate-800 p-2 rounded-lg border border-slate-700 gap-3">
                    <img src={movie.poster} alt={movie.title} className="w-16 h-24 object-cover rounded bg-slate-700" />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white truncate">{movie.title}</h4>
                            <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-orange-400 flex items-center gap-1">
                                <Star size={10} fill="currentColor"/> {movie.rating}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{movie.genre} • {movie.duration}</p>
                        
                        <div className="mt-2 text-xs bg-slate-900 p-1.5 rounded border border-slate-700 truncate text-slate-500 font-mono">
                            ID: {movie.id}
                        </div>
                    </div>
                </div>
            ))}
            {movies.length === 0 && <div className="text-center text-slate-500 text-xs py-10">Chưa có phim nào.</div>}
        </div>
      </div>
    </div>
  );
};