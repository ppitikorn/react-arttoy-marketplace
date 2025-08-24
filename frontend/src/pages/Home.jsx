// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';
import ProductCard from '../components/common/ProductCard';

const categories = [
  { label: 'Figure', value: 'Figure', img: 'https://image.makewebcdn.com/makeweb/m_1920x0/yWSGoz9KF/04_POPMART/20240807_141258_889661____5_____1200x1200.jpg' },
  { label: 'Action Figure', value: 'Action Figure', img: 'https://cdn11.bigcommerce.com/s-csqcv5l47s/images/stencil/804x804/products/2407/5540/CAP_AMERICA_SELECT_1__31656.1744998926.jpg?c=1' },
  { label: 'Blind Box', value: 'Blind Box', img: 'https://laz-img-sg.alicdn.com/p/e6c256acd0cc63f85698550c609ff414.jpg' },
  { label: 'Plush Toys', value: 'Plush Toys', img: 'https://m.media-amazon.com/images/I/81ECQgWabfL.jpg' },
  { label: 'Art Work', value: 'Art Work', img: 'https://media.timeout.com/images/106006274/image.jpg' },
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
            src="https://fortunetown.co.th/wp-content/uploads/2023/05/image-5-1024x1024.png"
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
          <h2 className="text-xl sm:text-2xl font-bold ">สำรวจตามหมวดหมู่</h2>
          <Link to="/products" className="text-amber-600 hover:underline text-sm">ดูทั้งหมด</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {/* {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => navigate(`/products?category=${encodeURIComponent(c.value)}`)}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out"
            >
              <div className="aspect-[1/1] overflow-hidden ">
                <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-100 transition " />
              </div>
              <div className="p-3 font-semibold">{c.label}</div>
            </button>
          ))} */}
          {categories.map((c) => (
            <Link
              key={c.value}
              to={`/products?category=${encodeURIComponent(c.value)}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out"
            >
              <div className="aspect-[1/1] overflow-hidden">
                <img
                  src={c.img}
                  alt={c.label}
                  className="w-full h-full object-cover group-hover:scale-100 transition"
                />
              </div>
              <div className="p-3 font-semibold">{c.label}</div>
            </Link>
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
