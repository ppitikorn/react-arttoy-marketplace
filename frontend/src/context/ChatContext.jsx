// src/context/ChatContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const ChatContext = createContext(null);

// ปรับตามใจ
const SEND_COOLDOWN_MS = 800;   // คูลดาวน์ฝั่ง client กันสแปมกดรัว
const MAX_TEXT_LEN     = 2000;  // จำกัดความยาวข้อความ
const ACK_TIMEOUT_MS   = 5000;  // กันกรณี ACK หาย

export function ChatProvider({ children }) {
  const { token } = useAuth();

  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // ห้อง active + ลำดับคำสั่ง join ล่าสุด (กัน race condition)
  const currentCidRef = useRef(null);
  const joinSeqRef = useRef(0);

  // anti-spam state
  const lastSendAtRef = useRef(0);
  const inflightRef = useRef(false);

  // ---------- สร้าง/ทำลาย socket ใหม่ทุกครั้งที่ token เปลี่ยน ----------
  useEffect(() => {
    // ปิดตัวเก่าก่อน (ตอน logout หรือเปลี่ยนผู้ใช้)
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
      setSocket(null);
    }

    // ไม่มี token ยังไม่ต้องสร้าง socket
    if (!token) return;

    const s = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    // logs / debug
    s.on("connect", () => {
      //console.log("[socket] connected:", s.id);
      // re-join ห้องเดิมอัตโนมัติถ้ามี
      const cid = currentCidRef.current;
      if (cid) s.emit("conversation:join", cid, () => {});
    });
    s.on("reconnect", (n) => {
      //console.log("[socket] reconnect", n);
      const cid = currentCidRef.current;
      if (cid) s.emit("conversation:join", cid, () => {});
    });
    s.on("connect_error", (e) =>
      console.error("[socket] connect_error:", e?.message || e)
    );
    s.on("error", (e) => console.error("[socket] error:", e));

    socketRef.current = s;
    setSocket(s);

    // cleanup เมื่อ token เปลี่ยน หรือ unmount
    return () => {
      try {
        s.removeAllListeners();
        s.disconnect();
      } catch {}
    };
  }, [token]);

  // ---------- helper: รอจน socket ต่อแล้วค่อยทำงาน ----------
  function onceConnected(fn) {
    const s = socketRef.current;
    if (!s) return; // ยังไม่ login/ยังไม่สร้าง socket
    if (s.connected) return fn(s);
    const on = () => {
      s.off("connect", on);
      fn(s);
    };
    s.on("connect", on);
  }

  // ---------- Public APIs ----------
  function joinConversation(conversationId, cb) {
    const cid = String(conversationId);
    const mySeq = ++joinSeqRef.current; // รุ่นของคำสั่งครั้งนี้
    currentCidRef.current = cid;

    onceConnected((s) => {
      const t = setTimeout(() => {
        if (joinSeqRef.current !== mySeq) return; // คำสั่งนี้ถูกแทนที่แล้ว
        //console.warn("[socket] join timeout -> retry", cid);
        joinConversation(cid, cb);
      }, ACK_TIMEOUT_MS);

      s.emit("conversation:join", cid, (ack) => {
        clearTimeout(t);
        if (joinSeqRef.current !== mySeq) return; // ผู้ใช้เปลี่ยนห้องไปแล้ว
        if (!ack?.ok) {
          console.error("[socket] join failed", cid, ack);
          return cb?.(ack);
        }
        //console.log("[socket] joined", cid);
        cb?.(ack);
      });
    });
  }

  function leaveConversation(conversationId, cb) {
    const cid = String(conversationId);
    onceConnected((s) => {
      s.emit("conversation:leave", cid, (ack) => {
        if (currentCidRef.current === cid) currentCidRef.current = null;
        cb?.(ack);
      });
    });
  }

  // ตรวจสอบว่า “ส่งได้ตอนนี้ไหม” (ให้ UI นำไป disable ปุ่ม)
  function canSendNow() {
    const now = Date.now();
    if (inflightRef.current) return false;
    if (now - lastSendAtRef.current < SEND_COOLDOWN_MS) return false;
    return true;
  }

  function sendMessage(payload, cb) {
    // validation เล็ก ๆ ฝั่ง client
    const text = (payload?.text || "").trim();
    if (text && text.length > MAX_TEXT_LEN) {
      cb?.({ ok: false, error: "ข้อความยาวเกินกำหนด" });
      return;
    }
    if (!canSendNow()) {
      cb?.({ ok: false, error: "รอสักครู่ก่อนส่งอีกครั้ง" });
      return;
    }

    onceConnected((s) => {
      inflightRef.current = true;
      lastSendAtRef.current = Date.now();

      const ackGuard = setTimeout(() => {
        // กัน ACK หาย—ปลด inflight เพื่อไม่ให้ค้างส่งไม่ได้
        inflightRef.current = false;
      }, ACK_TIMEOUT_MS);

      s.emit("message:send", payload, (ack) => {
        clearTimeout(ackGuard);
        inflightRef.current = false;
        cb?.(ack);
      });
    });
  }

  function markRead(payload, cb) {
    onceConnected((s) => {
      s.emit("message:read", payload, (ack) => cb?.(ack));
    });
  }

  return (
    <ChatContext.Provider
      value={{
        socket,
        joinConversation,
        leaveConversation,
        sendMessage,
        markRead,
        // สำหรับ UI
        canSendNow,
        SEND_COOLDOWN_MS,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within <ChatProvider>");
  return ctx;
}

