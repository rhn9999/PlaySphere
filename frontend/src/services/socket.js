import { io } from 'socket.io-client';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    socket.on('connect_error', () => {
      // In development or when backend doesn't run socket.io, silent fallback
    });
  }
  return socket;
};

export const joinMatchRoom = (matchId) => {
  const s = getSocket();
  if (!s.connected) {
    try {
      s.connect();
    } catch {}
  }
  s.emit('join:match', { matchId, room: `match:${matchId}` });
};

export const leaveMatchRoom = (matchId) => {
  if (socket && socket.connected) {
    socket.emit('leave:match', { matchId, room: `match:${matchId}` });
  }
};

export const onReceiveChatMessage = (callback) => {
  const s = getSocket();
  s.on('chat:message', callback);
  return () => s.off('chat:message', callback);
};

export const socketService = {
  connect: () => {
    const s = getSocket();
    if (!s.connected) {
      try {
        s.connect();
      } catch {}
    }
    return s;
  },
  joinMatch: (matchId) => joinMatchRoom(matchId),
  leaveMatch: (matchId) => leaveMatchRoom(matchId),
  sendMessage: (matchId, message) => {
    const s = getSocket();
    s.emit('send:message', { matchId, message, room: `match:${matchId}` });
  },
  onMessage: onReceiveChatMessage
};

