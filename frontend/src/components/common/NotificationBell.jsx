// frontend/src/components/common/NotificationBell.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

// helper เวลา
function timeAgo(dateInput) {
  const d = new Date(dateInput);
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleString();
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { socket } = useChat(); // ใช้ socket เดียวจาก ChatContext

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const bellRef = useRef(null);
  const listRef = useRef(null);

  // โหลดครั้งแรก
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data: list } = await api.get("/api/notifications?limit=20");
        if (!mounted) return;
        // setItems(Array.isArray(list.items) ? list.items : []);
        // const uniq = [];
        //   const seen = new Set();
        //   for (const it of (Array.isArray(list.items) ? list.items : [])) {
        //     if (!seen.has(it._id)) { seen.add(it._id); uniq.push(it); }
        //   }
        //   setItems(uniq);

        // setUnread(typeof c.count === "number" ? c.count : 0);
        const raw = Array.isArray(list.items) ? list.items : [];
        const uniq = [];
        const seen = new Set();
        for (const it of raw) {
          if (!seen.has(it._id)) { seen.add(it._id); uniq.push(it); }
        }
        setItems(uniq);
        // sync ตัวเลข unread ให้ตรงรายการล่าสุด
        setUnread(uniq.reduce((acc, x) => acc + (x.isRead ? 0 : 1), 0));
      } catch (e) {
        console.error("load notifications error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ฟัง socket event
  useEffect(() => {
    if (!token || !socket) return;
    const onNotify = (notif) => {
    // 1) แทนที่ตัวเดิม + ย้ายขึ้นบน
    setItems((prev) => {
      const next = [notif, ...prev.filter((x) => x._id !== notif._id)];
      // 2) คำนวณ unread ใหม่จาก next (ไม่สะสมมั่ว)
      const unreadNext = next.reduce((acc, x) => acc + (x.isRead ? 0 : 1), 0);
      setUnread(unreadNext);
      return next;
    });
  };
    socket.on("notify", onNotify);
    return () => socket.off("notify", onNotify);
  }, [token, socket]);

  // ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      const t = e.target;
      if (!bellRef.current) return;
      const inside =
        bellRef.current.contains(t) || listRef.current?.contains(t);
      if (!inside) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markOneRead(id) {
    try {
      setBusy(true);
      await api.patch(`/api/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((x) => (x._id === id ? { ...x, isRead: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch (e) {
      console.error("markOneRead error:", e);
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    try {
      setBusy(true);
      await api.patch("/api/notifications/mark-all/read");
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch (e) {
      console.error("markAllRead error:", e);
    } finally {
      setBusy(false);
    }
  }

  async function handleItemClick(n) {
    await markOneRead(n._id);
    if (n.refModel === "Conversation" && n.refId) {
      navigate(`/chat?conv=${n.refId}`);
      setOpen(false);
    } else if (n.refModel === "Product" && n.refSlug) {
      //console.log(n);
      navigate(`/products/${n.refSlug}`); // ถ้าใช้ slug ให้ปรับ path
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block">
      {/* Bell */}
      {/* ICON */}
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-xl transition hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
      >
        <span>🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1.5 text-center text-xs font-medium leading-4 text-white shadow">
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="menu"
          className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
            <b className="text-sm">การแจ้งเตือน</b>
            <button
              onClick={markAllRead}
              disabled={busy || unread === 0}
              className={`text-sm font-medium transition ${
                unread === 0
                  ? "cursor-default text-gray-400"
                  : "text-yellow-700 hover:text-yellow-800"
              } bg-transparent`}
            >
              อ่านทั้งหมด
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">กำลังโหลด…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                ยังไม่มีการแจ้งเตือน
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {items.map((n) => (
                  <li
                    key={n._id}
                    role="menuitem"
                    title="คลิกเพื่อมาร์คว่าอ่านแล้ว"
                    onClick={() => {handleItemClick(n)}}
                    className={`cursor-pointer border-b border-slate-100 p-2.5 transition ${
                      busy
                        ? "cursor-wait"
                        : "hover:bg-gray-50 data-[unread=true]:hover:bg-yellow-100/60"
                    } ${n.isRead ? "bg-white" : "bg-yellow-50/60"}`}
                    data-unread={n.isRead ? "false" : "true"}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm">
                        {n.type === "message"
                          ? "💬"
                          : n.type === "like"
                          ? "❤️"
                          : n.type === "product"
                          ? "📦"
                          : "🔔"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {n.title || "แจ้งเตือน"}
                          </div>
                          <div className="ml-2 shrink-0 text-[11px] text-gray-500">
                            {n.createdAt ? timeAgo(n.createdAt) : ""}
                          </div>
                        </div>
                        <div className="truncate text-sm text-slate-700">
                          {n.body || ""}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
