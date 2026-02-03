import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/mockSocket';
import { LogEntry, SocketMessage, SocketMessageType, StatsData } from '../types';

interface SocketContextType {
  isConnected: boolean;
  logs: LogEntry[];
  stats: StatsData;
  sendMessage: (type: SocketMessageType, payload: any) => void;
  lastMessage: SocketMessage | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const [stats, setStats] = useState<StatsData>({
    activeUsers: 0,
    occupancyRate: 0,
    ticketsSold: 0,
    totalRevenue: 0
  });

  // Helper to append logs (limited to last 50 to prevent memory issues)
  const addLog = useCallback((direction: 'IN' | 'OUT', message: SocketMessage) => {
    setLogs(prev => {
      const newLogs = [{ direction, message }, ...prev];
      return newLogs.slice(0, 50);
    });
  }, []);

  useEffect(() => {
    // 1. Initialize Connection
    socketService.connect(
      (msg: SocketMessage) => {
        // Incoming Message Handler
        setLastMessage(msg);
        addLog('IN', msg);

        // Handle Global Stats Updates automatically in context
        if (msg.type === SocketMessageType.STATS_UPDATE) {
          setStats(msg.payload);
        }
      },
      (status: boolean) => setIsConnected(status)
    );

    // 2. Perform Handshake / Auth automatically
    sendMessage(SocketMessageType.AUTH_REQUEST, { token: 'ADMIN_SECRET' });

    return () => {
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const sendMessage = useCallback((type: SocketMessageType, payload: any) => {
    const msg: SocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };
    
    addLog('OUT', msg);
    socketService.send(type, payload);
  }, [addLog]);

  return (
    <SocketContext.Provider value={{ isConnected, logs, sendMessage, lastMessage, stats }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};