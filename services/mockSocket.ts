import { Seat, SeatStatus, SocketMessage, SocketMessageType, StatsData, Movie, Customer, FoodItem } from '../types';

/**
 * MOCK SERVER LOGIC
 * Quản lý trạng thái Ghế, Phim và Khách Hàng
 */

class MockSocketService {
  private listeners: ((msg: SocketMessage) => void)[] = [];
  private connectionStatusListener: ((status: boolean) => void) | null = null;
  private intervalId: any;
  private statsIntervalId: any;
  
  // Dữ liệu Phim mặc định
  private movies: Movie[] = [
    {
      id: '1',
      title: "Mai",
      genre: "Tâm lý, Tình cảm",
      duration: "131 phút",
      rating: 4.8,
      poster: "https://upload.wikimedia.org/wikipedia/vi/8/86/Mai_movie_poster.jpg",
      trailerUrl: "https://www.youtube.com/embed/3Re-XN2JvRg?si=autoplay=1&mute=0",
      color: "from-yellow-900 to-slate-900"
    },
    {
      id: '2',
      title: "Dune: Part Two",
      genre: "Khoa học viễn tưởng",
      duration: "166 phút",
      rating: 4.9,
      poster: "https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg",
      trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w?si=autoplay=1&mute=0",
      color: "from-orange-900 to-slate-900"
    }
  ];

  // Dữ liệu Food & Beverage
  private foods: FoodItem[] = [
    { id: 'F1', name: 'Bắp Phô Mai (L)', description: 'Bắp rang vị phô mai thơm ngon, size lớn', price: 79000, category: 'Popcorn', image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400&auto=format&fit=crop' },
    { id: 'F2', name: 'Bắp Caramel (L)', description: 'Bắp rang vị caramel ngọt ngào, size lớn', price: 79000, category: 'Popcorn', image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=400&auto=format&fit=crop' },
    { id: 'F3', name: 'Coca Cola (L)', description: 'Nước ngọt có gas, tươi mát lạnh', price: 35000, category: 'Drink', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop' },
    { id: 'F4', name: 'Combo Solo', description: '1 Bắp (M) + 1 Nước (L)', price: 99000, category: 'Combo', image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=400&auto=format&fit=crop' },
    { id: 'F5', name: 'Combo Couple', description: '1 Bắp (L) + 2 Nước (L)', price: 139000, category: 'Combo', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=400&auto=format&fit=crop' },
  ];

  // Dữ liệu Khách hàng giả lập
  private customers: Customer[] = [
    {
        id: 'CUST001',
        name: 'Nguyễn Văn A',
        phone: '0912345678',
        email: 'user@gmail.com', // Mặc định để test
        avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=0D8ABC&color=fff',
        coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
        bio: 'Yêu thích phim hành động và khoa học viễn tưởng.',
        membershipLevel: 'Diamond',
        points: 2540,
        totalSpent: 5400000,
        history: [
            { id: 'T001', movieTitle: 'Mai', seatId: 'E5', price: 120000, date: '2024-02-20', theater: 'Rạp 01', foodTotal: 0, foodItems: [] },
            { id: 'T002', movieTitle: 'Dune: Part Two', seatId: 'F5', price: 150000, date: '2024-03-01', theater: 'Rạp 02', foodTotal: 0, foodItems: [] }
        ]
    },
    {
        id: 'CUST002',
        name: 'Trần Thị B',
        phone: '0987654321',
        email: 'tranthib@gmail.com',
        avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=d946ef&color=fff',
        coverImage: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd8?q=80&w=600&auto=format&fit=crop',
        bio: 'Phim lãng mạn là chân ái ❤️',
        membershipLevel: 'Standard',
        points: 120,
        totalSpent: 300000,
        history: [
            { id: 'T003', movieTitle: 'Mai', seatId: 'A1', price: 80000, date: '2024-02-15', theater: 'Rạp 01', foodTotal: 0, foodItems: [] }
        ]
    }
  ];

  // Map lưu trữ ghế cho TỪNG phim: Key là movieId, Value là mảng Seat
  private seatsByMovie: Record<string, Seat[]> = {};

  private stats: StatsData = {
    totalRevenue: 12500000, 
    activeUsers: 12,
    ticketsSold: 0,
    occupancyRate: 0
  };

  constructor() {
    this.initializeAllSeats();
  }

  // Khởi tạo ghế cho các phim có sẵn
  private initializeAllSeats() {
    this.movies.forEach(movie => {
        this.seatsByMovie[movie.id] = this.generateSeatsForRoom();
    });
    this.recalculateStats();
  }

  // Tạo một sơ đồ ghế mới ngẫu nhiên
  private generateSeatsForRoom(): Seat[] {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const seatsPerRow = 8;
    const newSeats: Seat[] = [];

    rows.forEach(row => {
      for (let i = 1; i <= seatsPerRow; i++) {
        // Random trạng thái ghế: 10% đã đặt
        const isBooked = Math.random() > 0.9; 
        
        newSeats.push({
          id: `${row}${i}`,
          row,
          number: i,
          status: isBooked ? SeatStatus.BOOKED : SeatStatus.AVAILABLE,
          price: row === 'G' ? 120000 : 80000
        });
      }
    });
    return newSeats;
  }

  private recalculateStats() {
    let sold = 0;
    let totalSeats = 0;
    let revenue = 0;

    Object.values(this.seatsByMovie).forEach(seats => {
        seats.forEach(seat => {
            totalSeats++;
            if (seat.status === SeatStatus.BOOKED) {
                sold++;
                revenue += seat.price;
            }
        });
    });

    this.stats.ticketsSold = sold;
    this.stats.totalRevenue = revenue; 
    // Note: totalRevenue ở đây mới chỉ tính giá vé từ state ban đầu, khi có giao dịch mới sẽ cộng dồn
    this.stats.occupancyRate = totalSeats > 0 ? Math.round((sold / totalSeats) * 100) : 0;
  }

  // --- API ---

  public connect(onMessage: (msg: SocketMessage) => void, onStatus: (status: boolean) => void) {
    this.listeners.push(onMessage);
    this.connectionStatusListener = onStatus;

    setTimeout(() => {
      if (this.connectionStatusListener) this.connectionStatusListener(true);
      
      this.emitToClient({
        type: SocketMessageType.CONNECTED,
        payload: { serverId: 'SRV-CINEMA-HN', version: '2.5.FOOD', message: 'Hệ thống sẵn sàng.' },
        timestamp: Date.now(),
        id: crypto.randomUUID()
      });

      this.startSimulation();
    }, 500);
  }

  public disconnect() {
    this.listeners = [];
    if (this.connectionStatusListener) this.connectionStatusListener(false);
    this.stopSimulation();
  }

  public send(type: SocketMessageType, payload: any) {
    setTimeout(() => {
      this.handleServerLogic(type, payload);
    }, 100);
  }

  // --- Logic Server ---

  private handleServerLogic(type: SocketMessageType, payload: any) {
    const msgId = crypto.randomUUID();

    switch (type) {
      case SocketMessageType.AUTH_REQUEST:
        this.emitToClient({
          type: SocketMessageType.AUTH_SUCCESS,
          payload: { role: payload.token === 'ADMIN_SECRET' ? 'ADMIN' : 'GUEST' },
          timestamp: Date.now(),
          id: msgId
        });
        break;

      // --- LOGIN LOGIC ---
      case SocketMessageType.LOGIN_REQUEST:
        const { email, password } = payload;
        const foundUser = this.customers.find(c => c.email === email);
        
        if (foundUser && password === '123456') {
            this.emitToClient({
                type: SocketMessageType.LOGIN_SUCCESS,
                payload: { customer: foundUser, token: 'fake-jwt-token' },
                timestamp: Date.now(),
                id: msgId
            });
        } else {
            this.emitToClient({
                type: SocketMessageType.LOGIN_FAILURE,
                payload: { message: 'Email hoặc mật khẩu không đúng (Mật khẩu test: 123456)' },
                timestamp: Date.now(),
                id: msgId
            });
        }
        break;

      case SocketMessageType.REGISTER_REQUEST:
        const { name, regEmail, regPassword, phone } = payload;
        
        if (this.customers.some(c => c.email === regEmail)) {
             this.emitToClient({
                type: SocketMessageType.LOGIN_FAILURE, 
                payload: { message: 'Email đã tồn tại trong hệ thống.' },
                timestamp: Date.now(),
                id: msgId
            });
        } else {
            const newUser: Customer = {
                id: `CUST${Date.now()}`,
                name: name,
                email: regEmail,
                phone: phone,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                coverImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
                bio: 'Thành viên mới',
                membershipLevel: 'Standard',
                points: 0,
                totalSpent: 0,
                history: []
            };
            this.customers.push(newUser);
            this.emitToClient({
                type: SocketMessageType.CUSTOMERS_UPDATE,
                payload: { customers: this.customers },
                timestamp: Date.now(),
                id: crypto.randomUUID()
            });
            this.emitToClient({
                type: SocketMessageType.REGISTER_SUCCESS,
                payload: { customer: newUser }, 
                timestamp: Date.now(),
                id: msgId
            });
        }
        break;

      case SocketMessageType.GET_MOVIES:
        this.emitToClient({
          type: SocketMessageType.MOVIES_UPDATE,
          payload: { movies: this.movies },
          timestamp: Date.now(),
          id: msgId
        });
        break;

      case SocketMessageType.GET_FOODS:
        this.emitToClient({
          type: SocketMessageType.FOODS_UPDATE,
          payload: { foods: this.foods },
          timestamp: Date.now(),
          id: msgId
        });
        break;

      case SocketMessageType.GET_CUSTOMERS:
        this.emitToClient({
            type: SocketMessageType.CUSTOMERS_UPDATE,
            payload: { customers: this.customers },
            timestamp: Date.now(),
            id: msgId
        });
        break;

      case SocketMessageType.ADD_MOVIE:
        const newMovie: Movie = {
          ...payload,
          id: Date.now().toString(),
          color: "from-blue-900 to-slate-900"
        };
        this.movies.unshift(newMovie); 
        this.seatsByMovie[newMovie.id] = this.generateSeatsForRoom(); 
        this.emitToClient({
          type: SocketMessageType.MOVIES_UPDATE,
          payload: { movies: this.movies },
          timestamp: Date.now(),
          id: crypto.randomUUID()
        });
        break;

      case SocketMessageType.GET_ROOM_STATE:
        const targetMovieId = payload.movieId || this.movies[0]?.id;
        const targetSeats = this.seatsByMovie[targetMovieId] || [];
        this.emitToClient({
          type: SocketMessageType.ROOM_STATE_RESPONSE,
          payload: { seats: targetSeats, movieId: targetMovieId },
          timestamp: Date.now(),
          id: msgId
        });
        break;

      case SocketMessageType.RESET_ROOM:
        const resetMovieId = payload.movieId;
        if (resetMovieId && this.seatsByMovie[resetMovieId]) {
            this.seatsByMovie[resetMovieId].forEach(s => s.status = SeatStatus.AVAILABLE);
            this.recalculateStats();
            this.emitToClient({
                type: SocketMessageType.RESET_CONFIRMED,
                payload: { message: `Đã reset phòng chiếu phim ID: ${resetMovieId}` },
                timestamp: Date.now(),
                id: msgId
            });
            const refreshedSeats = [...this.seatsByMovie[resetMovieId]].map(seat => ({...seat}));
            this.emitToClient({
                type: SocketMessageType.ROOM_STATE_RESPONSE,
                payload: { seats: refreshedSeats, movieId: resetMovieId },
                timestamp: Date.now(),
                id: crypto.randomUUID()
            });
            this.broadcastStats();
        }
        break;

      case SocketMessageType.BOOK_SEAT_REQUEST:
        this.handleCustomerBooking(payload);
        break;
    }
  }

  private handleCustomerBooking(payload: any) {
    const { seatId, userId, movieId, movieTitle, cartItems, foodTotal } = payload;
    
    const seats = this.seatsByMovie[movieId];
    if (!seats) return;

    const seat = seats.find(s => s.id === seatId);
    
    if (!seat || seat.status === SeatStatus.BOOKED) {
       this.emitToClient({
          type: SocketMessageType.BOOK_SEAT_FAILURE,
          payload: { seatId, message: 'Ghế này vừa có người đặt!' },
          timestamp: Date.now(),
          id: crypto.randomUUID()
       });
       return;
    }

    seat.status = SeatStatus.BOOKED;
    this.recalculateStats();
    
    // Tính tổng tiền (Vé + Food)
    const finalPrice = seat.price + (foodTotal || 0);

    // Cập nhật thống kê Global
    this.stats.totalRevenue += (foodTotal || 0); // Cộng thêm phần food (phần vé đã tính trong recalculateStats khi update trạng thái)

    // Tìm user đặt vé trong DB để update history
    const customerIndex = this.customers.findIndex(c => c.name === userId || c.email === userId || c.id === userId); 
    
    if (customerIndex !== -1) {
        this.customers[customerIndex].history.unshift({
            id: `T${Date.now()}`,
            movieTitle: movieTitle,
            seatId: seat.id,
            price: finalPrice,
            date: new Date().toISOString().split('T')[0],
            theater: 'Rạp 01',
            foodTotal: foodTotal || 0,
            foodItems: cartItems // Lưu danh sách đồ ăn đã đặt
        });
        this.customers[customerIndex].points += Math.floor(finalPrice / 1000);
        this.customers[customerIndex].totalSpent += finalPrice;
        
        this.emitToClient({
            type: SocketMessageType.CUSTOMERS_UPDATE,
            payload: { customers: this.customers },
            timestamp: Date.now(),
            id: crypto.randomUUID()
        });
    }

    this.emitToClient({
      type: SocketMessageType.SEAT_UPDATE,
      payload: { seatId: seat.id, status: SeatStatus.BOOKED, changedBy: userId, movieId: movieId },
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });

    this.emitToClient({
      type: SocketMessageType.NEW_ORDER,
      payload: { 
        event: 'ĐƠN HÀNG MỚI',
        customer: userId,
        movie: movieTitle || 'Không xác định',
        seat: seat.id,
        price: finalPrice,
        time: new Date().toLocaleTimeString(),
        note: foodTotal > 0 ? `+ Đồ ăn (${foodTotal.toLocaleString()}đ)` : ''
      },
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
    
    this.broadcastStats();
  }

  private emitToClient(msg: SocketMessage) {
    this.listeners.forEach(l => l(msg));
  }

  private broadcastStats() {
    this.emitToClient({
      type: SocketMessageType.STATS_UPDATE,
      payload: { ...this.stats },
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
  }

  private startSimulation() {
    this.statsIntervalId = setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1; 
      this.stats.activeUsers = Math.max(5, this.stats.activeUsers + change);
      this.broadcastStats();
    }, 10000);
  }

  private stopSimulation() {
    clearInterval(this.intervalId);
    clearInterval(this.statsIntervalId);
  }
}

export const socketService = new MockSocketService();