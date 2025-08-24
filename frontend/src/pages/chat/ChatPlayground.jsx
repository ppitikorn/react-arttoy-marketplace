// frontend/src/pages/chat/ChatPlayground.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { FaRegImage } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { uploadChatImage } from "../../utils/uploadChatImage"; // <- ชื่อไฟล์/ฟังก์ชันตามนี้

export default function ChatPlayground() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [pendingImages, setPendingImages] = useState([]); // meta รูปที่อัปโหลดแล้ว (ยังไม่ส่ง)
  const [uploading, setUploading] = useState(false);      // สถานะอัปโหลด
  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const listRef = useRef(null);
  const { user } = useAuth();
  const me = user?.id;
  const [params] = useSearchParams();
  const peerFromQuery = params.get("peer");

  const { socket, joinConversation, leaveConversation, sendMessage, markRead } = useChat();

  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";

  // ------------------------ Track Read Message------------------------
  useEffect(() => {
    if (!endRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          console.log("👀 Seen last message → mark as read");
          markRead({ conversationId, until: new Date() });
        }
      },
      { threshold: 0.1 } // เห็น 10% ของ element ก็พอ
    );

    observer.observe(endRef.current);

    return () => observer.disconnect();
  }, [conversationId, markRead]);

  // ------------------------ Sidebar: load conversations ------------------------
  useEffect(() => {
    (async () => {
      const res = await api.get("/api/chat/conversations");
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setUsers(items);

      if (peerFromQuery) {
        const match = items.find((it) => it.peer?._id === peerFromQuery);
        if (match) {
          setSelectedUser(match);
        } else {
          const r = await api.post("/api/chat/conversations", { peerId: peerFromQuery });
          const cid = r.data.conversationId || r.data._id;
          const placeholder = {
            conversationId: cid,
            peer: { _id: peerFromQuery, name: "", email: "", avatar: null },
            lastMessageText: "",
            lastMessageAt: null,
            unread: 0,
          };
          setUsers((prev) => [placeholder, ...prev]);
          setSelectedUser(placeholder);
        }
        // ล้าง query ?peer=...
        const url = new URL(window.location.href);
        url.searchParams.delete("peer");
        window.history.replaceState({}, "", url.toString());
      } else {
        if (items.length > 0) setSelectedUser(items[0]);
      }
    })();
  }, [peerFromQuery]);

  // ------------------------ Load messages on selectedUser change ------------------------
  useEffect(() => {
    if (!selectedUser?.peer?._id) return;
    let alive = true;
    (async () => {
      setMessages([]); // clear flash
      setPendingImages([]); // ล้างพรีวิวรูปค้างจากห้องก่อนหน้า

      const res = await api.post("/api/chat/conversations", { peerId: selectedUser?.peer?._id });
      const cid = res.data.conversationId || res.data._id;
      if (!alive) return;
      setConversationId(cid);

      const messagesRes = await api.get(`/api/chat/messages?conversationId=${cid}`);
      const arr = Array.isArray(messagesRes.data) ? messagesRes.data : [];
      if (!alive) return;
      setMessages(arr);
    })();
    return () => {
      alive = false;
    };
  }, [selectedUser]);

  // ------------------------ Join / Leave room ------------------------
  useEffect(() => {
    if (!conversationId) return;
    console.log("[join] try", conversationId);
    joinConversation(conversationId, (ack) => {
      console.log("[join ack]", ack);
    });
    return () =>
      leaveConversation(conversationId, (ack) => {
        console.log("[leave ack]", ack);
      });
  }, [joinConversation, leaveConversation, conversationId]);

  // ------------------------ Socket listeners ------------------------
  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (String(msg.conversationId) === String(conversationId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [socket, conversationId]);
  useEffect(() => {
    if (!socket || !conversationId) return;

    const onRead = ({ userId, until }) => {
      setMessages(prev => {
        const untilTime = new Date(until).getTime();
        return prev.map(m => {
          if (!m?.createdAt) return m;
          const t = new Date(m.createdAt).getTime();
          if (t <= untilTime) {
            const rb = Array.isArray(m.readBy) ? m.readBy : [];
            // ถ้าไม่มี userId นี้ใน readBy ก็เติมเข้าไป
            if (!rb.some(id => String(id) === String(userId))) {
              return { ...m, readBy: [...rb, userId] };
            }
          }
          return m;
        });
      });
    };

    socket.on('message:read', onRead);
    return () => socket.off('message:read', onRead);
  }, [socket, conversationId]);

  useEffect(() => {
    if (!socket) return;
    const onConvUpdate = (u) => {
      if (!u?.conversationId) return;
      setUsers((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        const cid = String(u.conversationId);
        const idx = prev.findIndex((it) => String(it.conversationId) === cid);
        if (idx === -1) return prev;
        const isActive = String(conversationId) === cid;
        const updated = {
          ...prev[idx],
          lastMessageText: u.lastMessageText || prev[idx].lastMessageText || "",
          lastMessageAt: u.lastMessageAt || prev[idx].lastMessageAt,
          unread: isActive ? 0 : Number(prev[idx].unread || 0) + 1,
        };
        if (
          idx === 0 &&
          updated.lastMessageText === prev[0].lastMessageText &&
          String(updated.lastMessageAt) === String(prev[0].lastMessageAt) &&
          updated.unread === prev[0].unread
        ) {
          return prev;
        }
        const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return next;
      });
    };
    socket.on("conversation:update", onConvUpdate);
    return () => socket.off("conversation:update", onConvUpdate);
  }, [socket, conversationId]);

  // ------------------------ Auto scroll to bottom ------------------------
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // ------------------------ Handlers ------------------------
  function handleUserClick(user) {
    setSelectedUser(user);
    setUsers((prev) =>
      prev.map((u) => (u.conversationId === user.conversationId ? { ...u, unread: 0 } : u))
    );
    markRead({ conversationId: user.conversationId, until: new Date() });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = message.trim();
    const hasText = text.length > 0;
    const hasImages = pendingImages.length > 0;
    if (!conversationId || (!hasText && !hasImages)) return;

    sendMessage({ conversationId, text, images: pendingImages }, (ack) => {
      console.log("[send ack]", ack);
      if (!ack?.ok) return alert(ack?.error || "Send failed");
      setMessage("");
      setPendingImages([]); // เคลียร์พรีวิวหลังส่งสำเร็จ
    });
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      // จำกัดครั้งละ 4 รูป (ถ้าต้องการ)
      const toUpload = files.slice(0, 4 - pendingImages.length);
      const metas = [];
      for (const f of toUpload) {
        const meta = await uploadChatImage(f);
        console.log("[uploadChatImage]", meta);
        metas.push(meta);
      }
      setPendingImages((prev) => [...prev, ...metas]);
    } catch (err) {
      alert(err.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePendingImage(publicId) {
    setPendingImages((prev) => prev.filter((it) => it.publicId !== publicId));
  }
  const peerId = selectedUser?.peer?._id;
  const lastMyIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (String(messages[i]?.senderId) === String(me)) return i;
    }
    return -1;
  })();

  // ------------------------ Render ------------------------
  return (
    <div className="min-h-[80vh] py-3 bg-yellow-100">
      <div className="flex h-[600px] w-full max-w-5xl mx-auto mt-8 rounded-2xl border bg-white shadow overflow-hidden">
        {/* Sidebar: User List */}
        <aside className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {users?.map((u) => {
              const time = fmtTime(u.lastMessageAt);
              const lasttext = u.lastMessageText ? `${u.lastMessageText} · ${time}` : "";
        
              return (
                <div
                  key={u?.conversationId}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-200 ${
                    selectedUser &&
                    String(selectedUser?.conversationId) === String(u.conversationId)
                      ? "bg-gray-200"
                      : ""
                  }`}
                  onClick={() => handleUserClick(u)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                    {u.peer?.avatar ? (
                      <img
                        src={u.peer?.avatar}
                        alt={u.peer?.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      u.peer?.name?.[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-gray-700">{u.peer?.name}</div>
                    <div className="text-xs text-gray-500 truncate">{lasttext}</div>
                  </div>
                  {u.unread > 0 && (
                    <div className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded rounded-full">{u.unread}</div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Chat Container */}
        <section className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b p-4 bg-white">
            <Link to={`/profile/${selectedUser?.peer?.username}`}>
              <div className="flex items-center gap-3 p-1">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                  {selectedUser?.peer?.avatar ? (
                    <img
                      src={selectedUser?.peer?.avatar}
                      alt={selectedUser?.peer?.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUser?.peer?.name?.[0]
                  )}
                </div>
                <div>
                  <div className="font-medium text-black">{selectedUser?.peer?.name}</div>
                </div>
              </div>
            </Link>
            {/* <button className="text-xs text-gray-400 hover:text-red-500">รายงาน</button> */}
          </header>

          {/* Alert/Info */}
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 text-xs flex items-center gap-2">
            โปรดระวังมิจฉาชีพหลอกให้แอดไลน์ไอดีหรือแสกน QR Code
          </div>

          {/* Messages */}
          <ul className="flex-1 overflow-y-auto p-6 space-y-0.5" ref={listRef}>
          {messages.map((m, idx) => {
            const time = fmtTime(m.createdAt);
            const isMine = String(m.senderId) === String(me);
            const hasImages = Array.isArray(m.images) && m.images.length > 0;
            const isLastMyMessage = idx === lastMyIndex;

            // read receipt
            const readBy = Array.isArray(m.readBy) ? m.readBy.map(String) : [];
            const isReadByPeer = readBy.includes(String(peerId));

            return (
              <li
                key={m?._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[80%] gap-1">
                  {/* รูปภาพ */}
                  {hasImages && (
                    <div
                      className={`grid gap-2 ${
                        m.images.length === 1
                          ? "grid-cols-1"
                          : m.images.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2"
                      }`}
                    >
                      {m.images.map((img) => (
                        <a
                          key={img.publicId}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={img.url}
                            alt="chat-img"
                            className="rounded-xl max-h-64 object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* กล่องข้อความ */}
                  {m.text && (
                    <div
                      className={[
                        "rounded-2xl px-4 py-2 text-sm inline-block max-w-full break-words",
                        isMine
                          ? "bg-yellow-300 text-gray-900 self-end"
                          : "bg-gray-100 text-gray-800 self-start",
                      ].join(" ")}
                    >
                      {m.text}
                    </div>
                  )}

                  {/* เวลา + สถานะ (อยู่บรรทัดใหม่ ไม่ดันบับเบิล) */}
                  <span
                    className={`text-xs text-gray-500 ${
                      isMine ? "text-right self-end" : "text-left self-start"
                    }`}
                  >
                    {isMine && isLastMyMessage && (
                      <>
                        <span className="ml-1">{time} น. · {isReadByPeer ? "อ่านแล้ว" : "ส่งแล้ว"}</span>
                      </>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
          <div ref={endRef} className="h-1" />
        </ul>

          {/* Send Message */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t p-4 bg-white">
          {/* ปุ่มเลือกรูป */}
          <label
            className={`p-2 text-gray-800 text-2xl hover:text-indigo-600 cursor-pointer shrink-0 ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
            title="เพิ่มรูป"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onPickFiles}
            />
            <FaRegImage />
          </label>

          {/* กล่องพิมพ์ + พรีวิวรูป (อยู่ข้างในกล่องเดียวกัน) */}
          <div className="flex-1">
            <div className="rounded-2xl border border-gray-300 bg-gray-50 px-3 py-2">
              {/* แถวพรีวิวรูป */}
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingImages.map((img) => (
                    <div
                      key={img.publicId}
                      className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shadow-sm"
                    >
                      <img
                        src={img.url}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingImage(img.publicId)}
                        className="absolute -top-2 -right-2 bg-black/70 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-black/85"
                        title="ลบรูปนี้"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ช่องพิมพ์ข้อความ */}
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={uploading ? "กำลังอัปโหลดรูป…" : "พิมพ์ข้อความ…"}
                className="w-full bg-transparent outline-none text-sm text-black placeholder:text-gray-400"
                disabled={uploading}
              />
            </div>
          </div>

          {/* ปุ่มส่ง */}
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0"
            disabled={uploading || (!message.trim() && pendingImages.length === 0)}
          >
            ส่ง
          </button>
        </form>
        </section>
      </div>
    </div>
  );
}
