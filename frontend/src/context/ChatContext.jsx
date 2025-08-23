// src/context/ChatContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";

const ChatContext = createContext(null);

function onceConnected(socket, fn) {
  if (socket.connected) return fn();
  const on = () => { socket.off("connect", on); fn(); };
  socket.on("connect", on);
}

export function ChatProvider({ children }) {
  const tokenGetter = () => localStorage.getItem("token");

  const socket = useMemo(() => {
    const s = io(import.meta.env.VITE_API_URL, {
      auth: { token: tokenGetter() },
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    // logs (ช่วยดีบัก)
    s.on("connect", () => console.log("[socket] connected", s.id));
    s.on("reconnect", (n) => console.log("[socket] reconnect", n));
    s.on("connect_error", (e) => console.error("[socket] connect_error", e?.message || e));
    s.on("error", (e) => console.error("[socket] error", e));

    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เก็บห้องปัจจุบัน + token ป้องกันการ join ซ้อน/ค้าง
  const currentCidRef = useRef(null);
  const joinSeqRef = useRef(0); // เพิ่มเลขรุ่นของคำสั่ง join ล่าสุด

  // re-join ห้องปัจจุบันอัตโนมัติเมื่อ reconnect
  useEffect(() => {
    const onReconnect = () => {
      const cid = currentCidRef.current;
      if (!cid) return;
      // ใช้กลไกเดียวกับ joinConversation ด้านล่าง
      joinConversation(cid);
    };
    socket.on("reconnect", onReconnect);
    return () => socket.off("reconnect", onReconnect);
  }, [socket]);

  // helper join/leave พร้อม ack + timeout + ยกเลิกของเก่า
  function joinConversation(conversationId, cb) {
    const cid = String(conversationId);
    const mySeq = ++joinSeqRef.current;      // รุ่นของคำสั่งครั้งนี้
    currentCidRef.current = cid;

    onceConnected(socket, () => {
      const timeout = setTimeout(() => {
        if (joinSeqRef.current !== mySeq) return; // คำสั่งเก่าแล้ว
        console.warn("[socket] join timeout -> retry", cid);
        // ลองใหม่อีกรอบ
        joinConversation(cid, cb);
      }, 5000);

      socket.emit("conversation:join", cid, (ack) => {
        clearTimeout(timeout);
        // ถ้าในระหว่างรอ ผู้ใช้เปลี่ยนห้อง → ทิ้ง ack นี้ไป
        if (joinSeqRef.current !== mySeq) return;

        if (!ack?.ok) {
          console.error("[socket] join failed", cid, ack);
          cb?.(ack);
          return;
        }
        console.log("[socket] joined", cid);
        cb?.(ack);
      });
    });
  }

  function leaveConversation(conversationId, cb) {
    const cid = String(conversationId);
    onceConnected(socket, () => {
      socket.emit("conversation:leave", cid, (ack) => {
        // ถ้ากำลังอยู่ห้องนี้จริง ๆ ค่อยเคลียร์ ref
        if (currentCidRef.current === cid) currentCidRef.current = null;
        cb?.(ack);
      });
    });
  }

  function sendMessage(payload, cb) {
    onceConnected(socket, () => {
      socket.emit("message:send", payload, (ack) => cb?.(ack));
    });
  }

  function markRead(payload, cb) {
    onceConnected(socket, () => {
      socket.emit("message:read", payload, (ack) => cb?.(ack));
    });
  }

  return (
    <ChatContext.Provider value={{ socket, joinConversation, leaveConversation, sendMessage, markRead }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within <ChatProvider>");
  return ctx;
}
