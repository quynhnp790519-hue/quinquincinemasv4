// --- ĐỊNH NGHĨA GIAO THỨC SOCKET (SOCKET PROTOCOL) ---

export enum SocketMessageType {
  // Bắt tay (Handshake)
  CONNECT = 'CONNECT',
  CONNECTED = 'CONNECTED',
  
  // Xác thực (Authentication)
  AUTH_REQUEST = 'AUTH_REQUEST', 
  AUTH_SUCCESS = 'AUTH_SUCCESS', 
  AUTH_FAILURE = 'AUTH_FAILURE',

  // User Auth (Login/Register)
  LOGIN_REQUEST = 'LOGIN_REQUEST',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  REGISTER_REQUEST = 'REGISTER_REQUEST',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',

  // Sự kiện Thời gian thực (Server -> Broadcast)
  SEAT_UPDATE = 'SEAT_UPDATE', 
  NEW_ORDER = 'NEW_ORDER', 
  STATS_UPDATE = 'STATS_UPDATE',
  MOVIES_UPDATE = 'MOVIES_UPDATE', // Server gửi danh sách phim mới nhất
  CUSTOMERS_UPDATE = 'CUSTOMERS_UPDATE', // Server gửi danh sách khách hàng
  FOODS_UPDATE = 'FOODS_UPDATE', // Server gửi danh sách đồ ăn

  // Hành động Admin (Admin -> Server)
  GET_ROOM_STATE = 'GET_ROOM_STATE', // Yêu cầu lấy ghế của 1 phim cụ thể
  ROOM_STATE_RESPONSE = 'ROOM_STATE_RESPONSE', 
  RESET_ROOM = 'RESET_ROOM', 
  RESET_CONFIRMED = 'RESET_CONFIRMED', 
  ADD_MOVIE = 'ADD_MOVIE', // Admin thêm phim mới
  GET_CUSTOMERS = 'GET_CUSTOMERS', // Admin lấy danh sách khách
  GET_FOODS = 'GET_FOODS', // Admin/Client lấy danh sách food

  // Hành động Khách hàng (Customer -> Server)
  GET_MOVIES = 'GET_MOVIES', // Khách lấy danh sách phim
  BOOK_SEAT_REQUEST = 'BOOK_SEAT_REQUEST', 
  BOOK_SEAT_FAILURE = 'BOOK_SEAT_FAILURE', 
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE', 
  LOCKED = 'LOCKED', 
  BOOKED = 'BOOKED', 
  VIP = 'VIP', 
}

export interface Seat {
  id: string; 
  row: string; 
  number: number; 
  status: SeatStatus;
  price: number;
  lockedBy?: string; 
}

export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: number;
  poster: string;     // URL ảnh poster (hoặc Base64)
  trailerUrl: string; // URL video trailer
  color: string;      // Màu chủ đạo cho UI
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Popcorn' | 'Drink' | 'Combo';
  soldCount?: number; // Cho thống kê
}

export interface TicketHistory {
    id: string;
    movieTitle: string;
    seatId: string;
    price: number;
    date: string;
    theater: string;
    foodItems?: { name: string; quantity: number; price: number }[]; // Chi tiết đồ ăn
    foodTotal?: number; // Tổng tiền đồ ăn
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar: string;
    coverImage?: string; // Ảnh bìa profile
    bio?: string;        // Tiểu sử/Slogan
    membershipLevel: 'Standard' | 'VIP' | 'Diamond';
    points: number;
    totalSpent: number;
    history: TicketHistory[];
}

export interface SocketMessage<T = any> {
  type: SocketMessageType;
  payload: T;
  timestamp: number;
  id: string; 
}

export interface StatsData {
  totalRevenue: number; 
  activeUsers: number; 
  ticketsSold: number; 
  occupancyRate: number; 
}

export interface LogEntry {
  direction: 'IN' | 'OUT'; 
  message: SocketMessage;
}

export type View = 'DASHBOARD' | 'LIVE_ROOM' | 'LOGS';