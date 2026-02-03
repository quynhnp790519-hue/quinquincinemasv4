import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Seat, SeatStatus, SocketMessageType, Movie, Customer } from '../types';
import { Smartphone, CheckCircle, AlertCircle, ChevronLeft, Clock, Star, Calendar, PlayCircle, X, Gift, User, QrCode, Ticket, Settings, LogOut, ChevronRight, Lock, Mail, ArrowRight, Moon, Sun, Camera, Edit2, Save, ArrowLeft } from 'lucide-react';

type ViewState = 'LOGIN' | 'REGISTER' | 'MOVIE_LIST' | 'SEAT_SELECTION' | 'SUCCESS' | 'PROFILE_EDIT' | 'SETTINGS';
type TabState = 'MOVIES' | 'OFFERS' | 'PROFILE';

export const CustomerClient: React.FC = () => {
  const { sendMessage, lastMessage, isConnected } = useSocket();
  
  // App State
  const [activeTab, setActiveTab] = useState<TabState>('MOVIES');
  const [view, setView] = useState<ViewState>('LOGIN'); // Mặc định vào màn hình Login
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [authError, setAuthError] = useState('');

  // Data State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<Customer | null>(null);
  
  // Edit Profile State
  const [editingProfile, setEditingProfile] = useState<Partial<Customer>>({});

  const [bookingStatus, setBookingStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [playingTrailer, setPlayingTrailer] = useState<string | null>(null);

  // --- THEME UTILS ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-100',
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-slate-100',
    inputBorder: isDarkMode ? 'border-slate-700' : 'border-slate-200',
    navBg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    navBorder: isDarkMode ? 'border-slate-800' : 'border-slate-200',
  };

  // --- EFFECT: Realtime Clock ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- EFFECT: Socket ---
  useEffect(() => {
    if (isConnected) {
        sendMessage(SocketMessageType.GET_MOVIES, {});
    }
  }, [isConnected, sendMessage]);

  useEffect(() => {
    if (isConnected && view === 'SEAT_SELECTION' && selectedMovie) {
      sendMessage(SocketMessageType.GET_ROOM_STATE, { movieId: selectedMovie.id });
    }
  }, [isConnected, sendMessage, view, selectedMovie]);

  useEffect(() => {
    if (!lastMessage) return;

    // --- AUTH HANDLING ---
    if (lastMessage.type === SocketMessageType.LOGIN_SUCCESS) {
        setUserProfile(lastMessage.payload.customer);
        setView('MOVIE_LIST');
        setAuthError('');
    }

    if (lastMessage.type === SocketMessageType.REGISTER_SUCCESS) {
        setUserProfile(lastMessage.payload.customer);
        setView('MOVIE_LIST');
        setAuthError('');
    }

    if (lastMessage.type === SocketMessageType.LOGIN_FAILURE) {
        setAuthError(lastMessage.payload.message);
    }
    // ---------------------

    if (lastMessage.type === SocketMessageType.MOVIES_UPDATE) {
        setMovies(lastMessage.payload.movies);
    }

    if (lastMessage.type === SocketMessageType.ROOM_STATE_RESPONSE) {
      if (selectedMovie && lastMessage.payload.movieId === selectedMovie.id) {
          setSeats(lastMessage.payload.seats);
      }
    }

    if (lastMessage.type === SocketMessageType.SEAT_UPDATE) {
      const { seatId, status, changedBy, movieId } = lastMessage.payload;
      if (selectedMovie && movieId === selectedMovie.id) {
        setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status } : s));
        if (userProfile && changedBy === userProfile.name && status === SeatStatus.BOOKED) {
            setView('SUCCESS');
            setBookingStatus('idle');
            setSelectedSeat(null);
            // Update local fake profile points for instant feedback
            setUserProfile(prev => prev ? ({...prev, points: prev.points + 100}) : null); 
        }
      }
    }

    if (lastMessage.type === SocketMessageType.BOOK_SEAT_FAILURE) {
        setBookingStatus('error');
        setErrorMsg(lastMessage.payload.message);
        setTimeout(() => setBookingStatus('idle'), 3000);
    }
    
    // Nếu Admin update customer list và có chứa user này, update lại profile
    if (lastMessage.type === SocketMessageType.CUSTOMERS_UPDATE && userProfile) {
        const myProfile = lastMessage.payload.customers.find((c: Customer) => c.id === userProfile.id);
        if (myProfile) setUserProfile(myProfile);
    }

  }, [lastMessage, userProfile, selectedMovie]);

  // --- HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    sendMessage(SocketMessageType.LOGIN_REQUEST, { email, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    sendMessage(SocketMessageType.REGISTER_REQUEST, { 
        name: regName, 
        regEmail, 
        regPassword, 
        phone: regPhone 
    });
  };

  const handleLogout = () => {
    setUserProfile(null);
    setView('LOGIN');
    setEmail('');
    setPassword('');
    setActiveTab('MOVIES');
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setView('SEAT_SELECTION');
    setSeats([]); 
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== SeatStatus.AVAILABLE) return;
    setSelectedSeat(seat.id === selectedSeat ? null : seat.id);
  };

  const confirmBooking = () => {
    if (!selectedSeat || !selectedMovie || !userProfile) return;
    setBookingStatus('processing');
    
    sendMessage(SocketMessageType.BOOK_SEAT_REQUEST, {
      seatId: selectedSeat,
      userId: userProfile.name, // Use real profile name for tracking
      movieId: selectedMovie.id,
      movieTitle: selectedMovie.title
    });
  };

  const handleSaveProfile = () => {
      if (userProfile) {
          setUserProfile({...userProfile, ...editingProfile});
          setView('MOVIE_LIST');
          setActiveTab('PROFILE');
          // Trong thực tế, gửi API cập nhật tại đây
      }
  };

  // --- RENDERERS ---

  const renderLogin = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-center animate-in fade-in zoom-in duration-300">
        <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                <Smartphone size={32} />
            </div>
            <h1 className="text-2xl font-bold">Cinema App</h1>
            <p className="text-slate-400 text-sm">Đặt vé xem phim nhanh chóng</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="text-xs text-slate-400 block mb-1 ml-1">Email</label>
                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-500"/>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="user@gmail.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none text-white"
                        required
                    />
                </div>
            </div>
            <div>
                <label className="text-xs text-slate-400 block mb-1 ml-1">Mật khẩu</label>
                <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-500"/>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none text-white"
                        required
                    />
                </div>
            </div>
            
            {authError && <div className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded">{authError}</div>}

            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2">
                Đăng Nhập <ArrowRight size={16}/>
            </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
            Chưa có tài khoản? <button onClick={() => setView('REGISTER')} className="text-orange-500 font-bold hover:underline">Đăng ký ngay</button>
        </div>
        <div className="mt-8 text-center text-[10px] text-slate-600">
            *Demo: Dùng email <b>user@gmail.com</b> / pass <b>123456</b>
        </div>
    </div>
  );

  const renderRegister = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-center animate-in slide-in-from-right duration-300">
        <h2 className="text-2xl font-bold mb-6">Đăng Ký</h2>
        
        <form onSubmit={handleRegister} className="space-y-3">
            <input 
                type="text" value={regName} onChange={e => setRegName(e.target.value)}
                placeholder="Họ tên đầy đủ"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none"
                required
            />
            <input 
                type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none"
                required
            />
            <input 
                type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)}
                placeholder="Số điện thoại"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none"
                required
            />
             <input 
                type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none"
                required
            />
            
            {authError && <div className="text-red-500 text-xs text-center">{authError}</div>}

            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold text-sm mt-2">
                Đăng Ký Tài Khoản
            </button>
        </form>

        <button onClick={() => setView('LOGIN')} className="mt-4 text-center text-xs text-slate-400 hover:text-white block w-full">
            Đã có tài khoản? Đăng nhập
        </button>
    </div>
  );

  const renderTrailerModal = () => {
    if (!playingTrailer) return null;
    return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col justify-center items-center p-4 animate-in fade-in">
            <button onClick={() => setPlayingTrailer(null)} className="absolute top-4 right-4 text-white hover:text-red-500"><X size={24} /></button>
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-slate-700">
                <iframe width="100%" height="100%" src={playingTrailer} title="Trailer" frameBorder="0" allowFullScreen></iframe>
            </div>
        </div>
    );
  };

  const renderMovieList = () => (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-end mb-2">
          <h2 className={`text-xl font-bold ${theme.text}`}>Phim Đang Chiếu</h2>
          <span className="text-xs text-orange-600 font-bold cursor-pointer">Xem tất cả</span>
      </div>
      {movies.map(movie => (
        <div key={movie.id} onClick={() => handleSelectMovie(movie)} className={`flex ${theme.cardBg} rounded-xl shadow-sm border ${theme.border} overflow-hidden cursor-pointer active:scale-95 transition-all relative group`}>
          <div className="relative w-24 h-32 bg-slate-800">
            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0">
                <button onClick={(e) => { e.stopPropagation(); setPlayingTrailer(movie.trailerUrl); }} className="text-white hover:text-orange-400 bg-black/40 rounded-full p-1 backdrop-blur-sm"><PlayCircle size={24} fill="currentColor" className="opacity-90"/></button>
            </div>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-center">
            <h3 className={`font-bold ${theme.text} text-lg leading-tight mb-1 line-clamp-1`}>{movie.title}</h3>
            <div className={`text-xs ${theme.subText} mb-2 line-clamp-1`}>{movie.genre}</div>
            <div className={`flex items-center gap-3 text-xs ${theme.subText}`}>
               <span className="flex items-center gap-1"><Clock size={12}/> {movie.duration}</span>
               <span className="flex items-center gap-1 text-orange-500 font-bold"><Star size={12} fill="currentColor"/> {movie.rating}</span>
            </div>
            <button className="mt-2 bg-orange-100 text-orange-700 text-[10px] py-1.5 px-3 rounded font-bold self-start">Đặt Vé Ngay</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderOffers = () => (
      <div className={`p-4 space-y-4 pb-24 ${theme.bg} h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300`}>
          <h2 className={`text-xl font-bold ${theme.text} mb-2`}>Kho Ưu Đãi</h2>
          
          {/* Voucher Card */}
          {[1, 2, 3].map(i => (
              <div key={i} className={`${theme.cardBg} rounded-xl p-0 shadow-sm border ${theme.border} overflow-hidden flex`}>
                  <div className={`w-24 bg-orange-500 flex flex-col items-center justify-center text-white p-2 border-r border-dashed ${isDarkMode ? 'border-slate-800' : 'border-white'} relative`}>
                     <div className={`absolute -right-1.5 top-[-6px] w-3 h-3 ${theme.bg} rounded-full`}></div>
                     <div className={`absolute -right-1.5 bottom-[-6px] w-3 h-3 ${theme.bg} rounded-full`}></div>
                     <span className="text-lg font-bold">50%</span>
                     <span className="text-[10px] uppercase">OFF</span>
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-center">
                      <h3 className={`font-bold ${theme.text} text-sm`}>Giảm giá bắp nước Combo 2</h3>
                      <p className={`text-[10px] ${theme.subText} mb-2`}>HSD: 30/05/2024</p>
                      <button className="text-orange-600 text-xs font-bold border border-orange-200 rounded px-3 py-1 self-start hover:bg-orange-50">Dùng Ngay</button>
                  </div>
              </div>
          ))}
      </div>
  );

  const renderProfile = () => {
    if (!userProfile) return null;
    return (
      <div className={`h-full ${theme.bg} overflow-y-auto pb-24 animate-in fade-in slide-in-from-right-4 duration-300`}>
          {/* Header Profile */}
          <div className="relative">
             {/* Cover Image */}
             <div className="h-32 w-full bg-slate-800 overflow-hidden relative">
                 <img src={userProfile.coverImage || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"} className="w-full h-full object-cover opacity-60" alt="Cover"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
             </div>

             <div className="px-6 -mt-12 relative z-10 flex flex-col items-center">
                 <img src={userProfile.avatar} className="w-24 h-24 rounded-full border-4 border-slate-900 shadow-xl" alt="Avatar"/>
                 <h2 className={`font-bold text-xl mt-2 ${theme.text}`}>{userProfile.name}</h2>
                 <p className="text-orange-500 text-xs font-bold uppercase tracking-wider mb-1">{userProfile.membershipLevel} MEMBER</p>
                 <p className={`text-xs ${theme.subText} italic text-center max-w-[80%]`}>{userProfile.bio || "Chưa có tiểu sử"}</p>
             </div>
          </div>

          {/* Stats Card */}
          <div className="px-4 mt-6">
             <div className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.border} p-4 flex justify-between items-center ${theme.text}`}>
                  <div className={`flex flex-col items-center flex-1 border-r ${theme.border}`}>
                      <span className={`text-[10px] ${theme.subText} uppercase`}>Điểm thưởng</span>
                      <span className="font-bold text-lg text-orange-600">{userProfile.points}</span>
                  </div>
                  <div className={`flex flex-col items-center flex-1 border-r ${theme.border}`}>
                      <span className={`text-[10px] ${theme.subText} uppercase`}>Voucher</span>
                      <span className={`font-bold text-lg ${theme.text}`}>3</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                       <QrCode size={24} className={theme.text}/>
                       <span className={`text-[8px] ${theme.subText} mt-1`}>Mã QR</span>
                  </div>
             </div>
          </div>

          <div className="mt-4 px-4 space-y-3">
              <div className={`${theme.cardBg} rounded-xl p-4 shadow-sm border ${theme.border}`}>
                  <h3 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}><Ticket size={16} className="text-orange-500"/> Vé Của Tôi</h3>
                  {userProfile.history.length > 0 ? (
                       <div className="space-y-3">
                           {userProfile.history.slice(0, 3).map(ticket => (
                               <div key={ticket.id} className={`flex gap-3 border-b ${theme.border} pb-3 last:border-0 last:pb-0`}>
                                   <div className="w-12 h-16 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-400">IMG</div>
                                   <div className="flex-1">
                                       <div className={`font-bold text-sm ${theme.text}`}>{ticket.movieTitle}</div>
                                       <div className={`text-xs ${theme.subText}`}>{ticket.theater} • Ghế {ticket.seatId}</div>
                                       <div className={`text-xs ${theme.subText} mt-1`}>{ticket.date}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                  ) : (
                      <div className={`text-center ${theme.subText} text-xs py-2`}>Chưa có lịch sử đặt vé</div>
                  )}
              </div>

              <div className={`${theme.cardBg} rounded-xl overflow-hidden shadow-sm border ${theme.border}`}>
                  <div onClick={() => {setEditingProfile(userProfile); setView('PROFILE_EDIT');}} className={`flex items-center justify-between p-4 border-b ${theme.border} hover:${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} cursor-pointer ${theme.text}`}>
                      <div className="flex items-center gap-3">
                          <User size={18}/>
                          <span className="text-sm font-medium">Thông tin cá nhân</span>
                      </div>
                      <ChevronRight size={16} className={theme.subText}/>
                  </div>
                  <div onClick={() => setView('SETTINGS')} className={`flex items-center justify-between p-4 border-b ${theme.border} hover:${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} cursor-pointer ${theme.text}`}>
                      <div className="flex items-center gap-3">
                          <Settings size={18}/>
                          <span className="text-sm font-medium">Cài đặt</span>
                      </div>
                      <ChevronRight size={16} className={theme.subText}/>
                  </div>
                  <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-50 cursor-pointer text-red-500">
                      <div className="flex items-center gap-3">
                          <LogOut size={18}/>
                          <span className="text-sm font-medium">Đăng xuất</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  };

  const renderProfileEdit = () => {
      return (
        <div className={`h-full ${theme.bg} overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col`}>
             <div className={`p-4 ${theme.navBg} border-b ${theme.navBorder} flex items-center gap-3 sticky top-0 z-10`}>
                 <button onClick={() => {setView('MOVIE_LIST'); setActiveTab('PROFILE');}} className={theme.subText}><ChevronLeft/></button>
                 <h2 className={`font-bold text-lg ${theme.text}`}>Chỉnh Sửa Hồ Sơ</h2>
             </div>

             <div className="flex-1 p-4 space-y-6">
                 {/* Avatar Edit */}
                 <div className="flex flex-col items-center">
                     <div className="relative">
                         <img src={editingProfile.avatar || userProfile?.avatar} className="w-24 h-24 rounded-full border-2 border-slate-300" alt="Avatar Preview"/>
                         <button className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                             <Camera size={14}/>
                         </button>
                     </div>
                     <p className={`text-xs ${theme.subText} mt-2`}>Nhấn để thay đổi ảnh đại diện</p>
                 </div>

                 {/* Form Fields */}
                 <div className="space-y-4">
                     <div>
                         <label className={`text-xs font-bold ${theme.subText} uppercase mb-1 block`}>Họ Tên</label>
                         <input 
                            value={editingProfile.name || ''} 
                            onChange={e => setEditingProfile({...editingProfile, name: e.target.value})}
                            className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 text-sm ${theme.text} outline-none focus:border-orange-500`}
                         />
                     </div>
                     <div>
                         <label className={`text-xs font-bold ${theme.subText} uppercase mb-1 block`}>Tiểu sử (Bio)</label>
                         <textarea 
                            value={editingProfile.bio || ''} 
                            onChange={e => setEditingProfile({...editingProfile, bio: e.target.value})}
                            rows={3}
                            className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 text-sm ${theme.text} outline-none focus:border-orange-500`}
                            placeholder="Giới thiệu bản thân..."
                         />
                     </div>
                     <div>
                         <label className={`text-xs font-bold ${theme.subText} uppercase mb-1 block`}>Ảnh Bìa (URL)</label>
                         <input 
                            value={editingProfile.coverImage || ''} 
                            onChange={e => setEditingProfile({...editingProfile, coverImage: e.target.value})}
                            className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 text-sm ${theme.text} outline-none focus:border-orange-500`}
                            placeholder="https://..."
                         />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`text-xs font-bold ${theme.subText} uppercase mb-1 block`}>Số điện thoại</label>
                            <input 
                                value={editingProfile.phone || ''} 
                                onChange={e => setEditingProfile({...editingProfile, phone: e.target.value})}
                                className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 text-sm ${theme.text} outline-none focus:border-orange-500`}
                            />
                        </div>
                        <div>
                            <label className={`text-xs font-bold ${theme.subText} uppercase mb-1 block`}>Email</label>
                            <input 
                                value={editingProfile.email || ''} 
                                disabled
                                className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 text-sm ${theme.subText} bg-opacity-50 cursor-not-allowed`}
                            />
                        </div>
                     </div>
                 </div>
             </div>

             <div className={`p-4 ${theme.navBg} border-t ${theme.navBorder}`}>
                 <button onClick={handleSaveProfile} className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2">
                     <Save size={18}/> Lưu Thay Đổi
                 </button>
             </div>
        </div>
      );
  };

  const renderSettings = () => {
    return (
      <div className={`h-full ${theme.bg} overflow-y-auto animate-in slide-in-from-right duration-300`}>
           <div className={`p-4 ${theme.navBg} border-b ${theme.navBorder} flex items-center gap-3 sticky top-0 z-10`}>
               <button onClick={() => {setView('MOVIE_LIST'); setActiveTab('PROFILE');}} className={theme.subText}><ChevronLeft/></button>
               <h2 className={`font-bold text-lg ${theme.text}`}>Cài Đặt</h2>
           </div>

           <div className="p-4">
               <div className={`${theme.cardBg} rounded-xl border ${theme.border} overflow-hidden`}>
                   <div className={`p-4 flex items-center justify-between border-b ${theme.border}`}>
                       <div className="flex items-center gap-3">
                           {isDarkMode ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-orange-500"/>}
                           <div>
                               <div className={`font-bold text-sm ${theme.text}`}>Giao diện {isDarkMode ? 'Tối' : 'Sáng'}</div>
                               <div className={`text-xs ${theme.subText}`}>Thay đổi giao diện ứng dụng</div>
                           </div>
                       </div>
                       <button 
                         onClick={() => setIsDarkMode(!isDarkMode)}
                         className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-orange-600' : 'bg-slate-300'}`}
                       >
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isDarkMode ? 'left-7' : 'left-1'}`}></div>
                       </button>
                   </div>
               </div>
           </div>
      </div>
    );
  };

  const renderSeatSelection = () => (
      <div className={`flex flex-col h-full ${theme.bg} animate-in slide-in-from-right duration-300`}>
        <div className={`p-4 ${theme.navBg} z-10 shadow-lg border-b ${theme.border}`}>
          <button onClick={() => {setView('MOVIE_LIST'); setSeats([]);}} className={`flex items-center gap-1 ${theme.subText} text-xs mb-2 hover:${theme.text}`}>
            <ChevronLeft size={14}/> Quay lại
          </button>
          <h2 className={`${theme.text} font-bold text-lg`}>{selectedMovie?.title}</h2>
          <div className={`flex items-center gap-2 text-xs ${theme.subText} mt-1`}>
             <Calendar size={12}/> <span>20:00 Hôm nay</span> • Rạp 01
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-4 ${theme.bg} relative`}>
          <div className="w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] mb-8 mx-auto rounded-full opacity-50"></div>
          <div className="flex flex-col gap-3 items-center pb-24">
            {seats.length === 0 ? <div className={`${theme.subText} text-xs mt-10`}>Đang tải ghế...</div> : 
               ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(row => (
                <div key={row} className="flex gap-2">
                    {seats.filter(s => s.row === row).map(seat => (
                    <button key={seat.id} onClick={() => handleSeatClick(seat)} disabled={seat.status === SeatStatus.BOOKED}
                        className={`w-7 h-7 rounded-t-md text-[9px] font-bold transition-all flex items-center justify-center
                        ${seat.status === SeatStatus.BOOKED ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : ''}
                        ${seat.status === SeatStatus.AVAILABLE && selectedSeat !== seat.id ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : ''}
                        ${selectedSeat === seat.id ? 'bg-orange-500 text-white shadow-lg scale-110 ring-2 ring-orange-300' : ''}`}
                    >
                        {seat.status === SeatStatus.BOOKED ? '' : seat.id}
                    </button>
                    ))}
                </div>
                ))
            }
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 ${theme.navBg} p-4 border-t ${theme.border} z-20`}>
           {bookingStatus === 'error' && <div className="mb-2 text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/> {errorMsg}</div>}
           <div className="flex justify-between items-center">
              <div>
                 <div className={`${theme.subText} text-xs`}>Tổng cộng</div>
                 <div className={`text-xl font-bold ${theme.text}`}>{selectedSeat ? (seats.find(s=>s.id===selectedSeat)?.price || 0).toLocaleString('vi-VN') : 0}đ</div>
                 <div className={`text-[10px] ${theme.subText}`}>{selectedSeat || 'Chưa chọn ghế'}</div>
              </div>
              <button onClick={confirmBooking} disabled={!selectedSeat || bookingStatus === 'processing'}
                className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${selectedSeat && bookingStatus !== 'processing' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                {bookingStatus === 'processing' ? 'Đang xử lý...' : 'THANH TOÁN'}
              </button>
           </div>
        </div>
      </div>
  );

  const renderSuccess = () => (
    <div className={`flex flex-col items-center justify-center h-full ${theme.bg} p-6 text-center animate-in zoom-in duration-300`}>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32} className="text-green-600"/></div>
      <h2 className={`text-xl font-bold ${theme.text} mb-2`}>Đặt Vé Thành Công!</h2>
      <p className={`text-sm ${theme.subText} mb-6`}>Bạn đã đặt vé phim <span className={`font-bold ${theme.text}`}>{selectedMovie?.title}</span>.</p>
      <button onClick={() => {setView('MOVIE_LIST'); setActiveTab('PROFILE');}} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-slate-800">Xem Vé Trong Hồ Sơ</button>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${theme.bg} ${theme.text} relative font-sans transition-colors duration-300`}>
        {renderTrailerModal()}

        {/* Status Bar */}
        <div className="h-7 bg-black text-white flex justify-between items-center px-5 text-[12px] font-medium z-40">
           <span>{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
           <div className="flex gap-1.5 items-end h-full pb-1.5">
             <div className="w-3 h-3 bg-white rounded-sm opacity-20"></div>
             <div className="w-3 h-3 bg-white rounded-sm opacity-50"></div>
             <div className="w-4 h-3 bg-white rounded-sm"></div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
           {view === 'LOGIN' && renderLogin()}
           {view === 'REGISTER' && renderRegister()}
           
           {view === 'MOVIE_LIST' && activeTab === 'MOVIES' && renderMovieList()}
           {view === 'MOVIE_LIST' && activeTab === 'OFFERS' && renderOffers()}
           {view === 'MOVIE_LIST' && activeTab === 'PROFILE' && renderProfile()}
           
           {view === 'PROFILE_EDIT' && renderProfileEdit()}
           {view === 'SETTINGS' && renderSettings()}
           
           {view === 'SEAT_SELECTION' && renderSeatSelection()}
           {view === 'SUCCESS' && renderSuccess()}
        </div>

        {/* Bottom Navigation Bar (Hidden on Auth Screens & Sub Screens) */}
        {view === 'MOVIE_LIST' && (
          <div className={`absolute bottom-0 left-0 right-0 h-16 ${theme.navBg} border-t ${theme.navBorder} flex justify-around items-center ${theme.subText} z-30 pb-2`}>
             <button onClick={() => setActiveTab('MOVIES')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'MOVIES' ? 'text-orange-600' : ''}`}>
                 <Smartphone size={22}/>
                 <span className="text-[10px] font-medium">Phim</span>
             </button>
             <button onClick={() => setActiveTab('OFFERS')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'OFFERS' ? 'text-orange-600' : ''}`}>
                 <Gift size={22}/>
                 <span className="text-[10px] font-medium">Ưu đãi</span>
             </button>
             <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'PROFILE' ? 'text-orange-600' : ''}`}>
                 <User size={22}/>
                 <span className="text-[10px] font-medium">Tôi</span>
             </button>
          </div>
        )}
    </div>
  );
};