// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/common/ProductCard';

const categories = [
  { label: 'Figure', value: 'Figure', img: 'https://images.unsplash.com/photo-1577083516271-e0342c0b4f1b?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Action Figure', value: 'Action Figure', img: 'https://images.unsplash.com/photo-1624298357590-8f2b0b1e2c34?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Blind Box', value: 'Blind Box', img: 'https://images.unsplash.com/photo-1617957743098-7ef0d0e4c619?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Plush Toys', value: 'Plush Toys', img: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Art Work', value: 'Art Work', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop' },
];

export default function Home() {
  const navigate = useNavigate();
  const [rand, setRand] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/products/randoms/item', { signal: ctrl.signal });
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        setRand(items);
      } catch (e) {
      // ✅ เงื่อนไขมอง cancel เป็นเคสปกติ
      if (axios.isCancel?.(e) || e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') {
        // เงียบไว้ ไม่ต้อง log
      } else {
        console.error('randoms error:', e);
      }
    } finally {
      setLoading(false);
    }
  })();
    return () => ctrl.abort();
  }, []);

  return (
    <div className="min-h-screen bg-yellow-50 text-gray-900">
      {/* HERO */}
      <section className="relative">
        <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {<img
            src="https://images.unsplash.com/photo-1618483008052-9d1a0bfbf2b0?q=80&w=1600&auto=format&fit=crop"
            alt="hero"
            className="absolute inset-0 w-full h-full object-cover"
          />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              ค้นพบของเล่นศิลป์ที่ยูนีคจากศิลปินทั่วโลก
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-100">
              ซื้อ–ขายอย่างมั่นใจ | คอมมิวนิตี้คนรักอาร์ตทอย
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center justify-center rounded-xl bg-amber-400 text-black font-semibold px-6 py-3 hover:bg-amber-300 transition"
              >
                สำรวจสินค้า
              </button>
              <button
                onClick={() => navigate('/post-product')}
                className="inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur px-6 py-3 hover:bg-white/20 transition border border-white/30"
              >
                ลงขายผลงาน
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">สำรวจตามหมวดหมู่</h2>
          <Link to="/products" className="text-amber-600 hover:underline text-sm">ดูทั้งหมด</Link>
        </div>
        <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto no-scrollbar pb-2">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => navigate(`/products?category=${encodeURIComponent(c.value)}`)}
              className="min-w-[180px] md:min-w-0 rounded-2xl overflow-hidden bg-white shadow-sm border group text-left"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="p-3 font-semibold">{c.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">ตัวอย่างสินค้า</h2>
          <Link to="/products" className="text-amber-600 hover:underline text-sm">ดูสินค้าเพิ่มเติม</Link>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rand.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
