// src/context/ChatContext.jsx
import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const getToken = () => localStorage.getItem("token");

  const socket = useMemo(() => {
    return io(import.meta.env.VITE_API_URL, {
      auth: { token: getToken() },
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
    });
  }, []);

  // auto-join user room (server จะอ่าน userId จาก JWT)
  useEffect(() => {
    const onConnect = () => {
      console.log("Socket connected", socket.id);
    };
    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, [socket]);

  // helpers ที่หน้าอื่นเรียกใช้ได้
  const value = {
    socket,
    joinConversation: (conversationId, cb) =>
      socket.emit("conversation:join", conversationId, cb),
    leaveConversation: (conversationId, cb) =>
      socket.emit("conversation:leave", conversationId, cb),
    sendMessage: (payload, cb) => socket.emit("message:send", payload, cb),
    markRead: (payload, cb) => socket.emit("message:read", payload, cb),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within <ChatProvider>");
  return ctx;
}
