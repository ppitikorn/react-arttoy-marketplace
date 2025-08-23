// frontend/src/pages/chat/ChatPlayground.jsx
import { useEffect, useRef, useState } from "react";
import { Link ,useSearchParams} from 'react-router-dom';
import io from "socket.io-client";
import api from "../../utils/api";
import { FaRegImage } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import { useChat } from "../../context/ChatContext";

export default function ChatPlayground() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const listRef = useRef(null);
  const { user } = useAuth(); 
  const me = user?.id;
  const [params] = useSearchParams();
  const peerFromQuery = params.get("peer"); 

  const { socket, joinConversation, leaveConversation, sendMessage, markRead } = useChat();

  const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";

  //peerId from ChatButton
  useEffect(() => {
  (async () => {
    const res = await api.get("/api/chat/conversations");//GET SIDEBAR
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    setUsers(items);

    if (peerFromQuery) {
      // หาแถวที่ peer._id ตรง
      const match = items.find(it => it.peer?._id === peerFromQuery);
      if (match) {
        setSelectedUser(match);
      } else {
        // ยังไม่เคยคุย → สร้างห้อง แล้วตั้งค่า selected ทันที
        const r = await api.post("/api/chat/conversations", { peerId: peerFromQuery });
        const cid = r.data.conversationId || r.data._id;

        // ใส่รายการใหม่เข้า sidebar (placeholder)
        const placeholder = {
          conversationId: cid,
          peer: { _id: peerFromQuery, name: "", email: "", avatar: null },
          lastMessageText: "",
          lastMessageAt: null,
          unread: 0,
        };
        setUsers(prev => [placeholder, ...prev]);
        setSelectedUser(placeholder);
      }

      // (ทางเลือก) เคลียร์ query ออกจาก URL หลังประมวลผล
      const url = new URL(window.location.href);
      url.searchParams.delete("peer");
      window.history.replaceState({}, "", url.toString());
    } else {
      // ไม่มี peer ใน URL → เลือกอันแรกเป็นค่าเริ่มต้น
      if (items.length > 0) setSelectedUser(items[0]);
    }
  })();
}, [peerFromQuery]);

  // เมื่อเลือก user → create/get conversation + โหลดข้อความล็อตแรก
  useEffect(() => {
    if (!selectedUser?.peer?._id) return;

    let alive = true;
    (async () => {
      // ล้างข้อความเก่าก่อนกัน flash จากห้องเดิม
      setMessages([]);

      // สร้าง/หา conversation (upsert)
      const res = await api.post("/api/chat/conversations", {
        peerId: selectedUser?.peer?._id,
      });

      // รองรับทั้งรูปแบบ { conversationId } หรือส่ง document ทั้งก้อน
      const cid = res.data.conversationId || res.data._id;
      if (!alive) return;
      setConversationId(cid);

      // โหลดข้อความล็อตแรก
      const messagesRes = await api.get(`/api/chat/messages?conversationId=${cid}`);
      const arr = Array.isArray(messagesRes.data) ? messagesRes.data : [];
      if (!alive) return;
      setMessages(arr);
    })();

    return () => { alive = false; };
  }, [selectedUser]);

  // join/leave room เมื่อ conversationId เปลี่ยน
  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId, () => {});
    return () => {
      leaveConversation(conversationId, () => {});
    };
  }, [joinConversation, leaveConversation, conversationId]);


  // subscribe รับข้อความใหม่ (ครั้งเดียว) แล้วค่อยกรองด้วย conversationId ปัจจุบัน
  useEffect(() => {
    const onNew = (msg) => {
      if (String(msg.conversationId) === String(conversationId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [socket, conversationId]);


  //UPDATE preview sidebar
  useEffect(() => {
  const onConvUpdate = (u) => {
    if (!u?.conversationId) return; // กัน payload แปลก
    setUsers((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;

      const cid = String(u.conversationId);
      const idx = prev.findIndex(it => String(it.conversationId) === cid);

      // ไม่เจอ: (อาจยังไม่โหลดห้องนี้) — จะ refetch หรือสร้าง placeholder ก็ได้
      if (idx === -1) {
        // ทางเลือก A: ไม่ทำอะไร รอรอบถัดไป
        return prev;
      }

      const isActive = String(conversationId) === cid;

      // สร้างออบเจ็กต์ใหม่ (ห้ามแก้ของเดิม)
      const updated = {
        ...prev[idx],
        lastMessageText: u.lastMessageText || prev[idx].lastMessageText || '',
        lastMessageAt: u.lastMessageAt || prev[idx].lastMessageAt,
        unread: isActive ? 0 : Number(prev[idx].unread || 0) + 1,
      };

      // ถ้าข้อมูลไม่เปลี่ยนจริง ๆ และมันอยู่บนสุดแล้ว → ไม่ต้องเปลี่ยน reference เพื่อลด re-render
      if (
        idx === 0 &&
        updated.lastMessageText === prev[0].lastMessageText &&
        String(updated.lastMessageAt) === String(prev[0].lastMessageAt) &&
        updated.unread === prev[0].unread
      ) {
        return prev;
      }

      // ย้ายแถวนั้นขึ้นบนสุดแบบ immutable
      const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      return next;
    });
  };

  socket.on('conversation:update', onConvUpdate);
  return () => socket.off('conversation:update', onConvUpdate);
}, [socket, conversationId]);


  // Scroll to bottom Messages
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function handleUserClick(user) {
    setSelectedUser(user);
    setUsers((prev) =>
    prev.map((u) =>
      u.conversationId === user.conversationId ? { ...u, unread: 0 } : u
    )
  );
  markRead({ conversationId: user.conversationId, until: new Date() });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;
    sendMessage(
      { conversationId, text: message },
      (ack) => {
        if (!ack?.ok) {
          alert(ack?.error || "Send failed");
        }
      }
    );
    setMessage("");
  }

  return (
    <div className="flex h-[600px] w-full max-w-5xl mx-auto mt-8 rounded-2xl border bg-white shadow overflow-hidden">
      {/* Sidebar: User List */}
      <aside className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          {/* <button onClick={() => (console.log("Users:", users), console.log("SelectedUser:", selectedUser),console.log("Messages:", messages))} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">log</button> */}
          <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users?.map((u) => {
            const time = fmtTime(u.lastMessageAt);
            const lasttext = `${u.lastMessageText} · ${time}`;
            return (
              <div
                key={u.peer?._id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-200 ${selectedUser && selectedUser?.peer?._id === u.peer?._id ? "bg-gray-200" : ""}`}
                onClick={() => handleUserClick(u)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white">
                {u.peer?.avatar ? 
                  <img
                    src={u.peer?.avatar}
                    alt={u.peer?.name}
                    referrerPolicy="no-referrer"
                    className="rounded-full overflow-hidden object-cover"
                  /> 
                  : 
                  u.peer?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-gray-700">{u.peer?.name}</div>
                <div className="text-xs text-gray-500 truncate">{u.lastMessageText}</div>
              </div>
            </div>
            )
          })}
        </div>
      </aside>

      {/* Main Chat Container */}
      <section className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b p-4 bg-white">
          <Link to={`/profile/${selectedUser?.peer?.username}`}>
            <div className="flex items-center gap-3 p-1">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white">
                {selectedUser?.peer?.avatar ? 
                    <img
                      src={selectedUser?.peer?.avatar}
                      alt={selectedUser?.peer?.name}
                      referrerPolicy="no-referrer"
                      className="rounded-full"
                    /> 
                    : 
                    selectedUser?.peer?.name?.[0]}
              </div>
              <div>
                <div className="font-medium text-black">{selectedUser?.peer?.name}</div>
                {/* <div className="text-xs text-gray-500">ออนไลน์</div> */}
              </div>
            </div>
          </Link>
          <button className="text-xs text-gray-400 hover:text-red-500">รายงาน</button>
        </header>

        {/* Alert/Info */}
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 text-xs flex items-center gap-2">
          โปรดระวังมิจฉาชีพหลอกให้แอดไลน์ไอดีหรือแสกน QR Code
        </div>

        {/* Messages */}
        <ul className="flex-1 overflow-y-auto p-6 space-y-3" ref={listRef}>
  {messages.map((m) => {
    const time = fmtTime(m.createdAt);
    const isMine = m.senderId == me;

    return (
      <li key={m?._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="flex flex-col max-w-[80%]">
          <div
            className={[
              "rounded-2xl px-4 py-2 text-sm",
              isMine ? "bg-yellow-300 text-gray-900" : "bg-gray-100 text-gray-800",
            ].join(" ")}
          >
            {m.text}
          </div>
          <span className={`text-xs text-gray-500 mt-1 ${isMine ? "text-right" : "text-left"}`}>
            {time} น.
          </span>
        </div>
      </li>
    );
  })}
</ul>


        {/* Send Message */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-4 bg-white">
          <button type="button" className="p-2 text-gray-800 text-2xl hover:text-indigo-600"><FaRegImage /></button>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ…"
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 text-black"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            ส่ง
          </button>
        </form>
      </section>
    </div>
  );
}
