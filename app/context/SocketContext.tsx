'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }: { children: React.ReactNode; userId: string }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Gateway chạy cùng host với API (port 3001), URL socket không có hậu tố /api
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketUrl = rawApiUrl.replace(/\/api$/, '');
    const token = localStorage.getItem('token');
    const socketInstance = io(socketUrl, {
      auth: token ? { token } : undefined,
      query: { userId },
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};