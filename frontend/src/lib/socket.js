import { io } from "socket.io-client";

const defaultSocket = import.meta.env.DEV ? "http://localhost:6969" : (typeof window !== "undefined" ? window.location.origin : "");
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocket;

let socketInstance = null;

export const getSocket = (authData = {}) => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: authData,
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
};

export const connectSocket = (authData = {}) => {
  if (socketInstance) {
    if (!socketInstance.connected) {
      socketInstance.auth = { ...socketInstance.auth, ...authData };
      socketInstance.connect();
    }
    return socketInstance;
  }
  return getSocket(authData);
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
