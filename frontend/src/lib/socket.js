import { io } from "socket.io-client";

const defaultSocket = import.meta.env.DEV ? "http://localhost:6969" : (typeof window !== "undefined" ? window.location.origin : "");
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocket;

let socketInstance = null;

const getStoredToken = () => {
  try {
    const raw = localStorage.getItem("devconnect_auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.accessToken || null;
    }
  } catch {}
  return null;
};

export const getSocket = (authData = {}) => {
  const token = authData.token || getStoredToken();
  const fullAuth = { ...authData, ...(token ? { token } : {}) };

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: fullAuth,
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  } else if (token && socketInstance.auth?.token !== token) {
    socketInstance.auth = { ...socketInstance.auth, ...fullAuth };
  }
  return socketInstance;
};

export const connectSocket = (authData = {}) => {
  const token = authData.token || getStoredToken();
  const fullAuth = { ...authData, ...(token ? { token } : {}) };

  if (socketInstance) {
    socketInstance.auth = { ...socketInstance.auth, ...fullAuth };
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
    return socketInstance;
  }
  return getSocket(fullAuth);
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
