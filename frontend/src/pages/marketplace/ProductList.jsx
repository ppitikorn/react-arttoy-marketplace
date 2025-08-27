// src/pages/products/ProductList.jsx
import { useState, useEffect, useMemo } from 'react';
import { message, Form, Input, Select, Space, InputNumber, Pagination, Button } from 'antd';

import { useSearchParams } from "react-router-dom";
import { FiFilter, FiX } from 'react-icons/fi';
import api from '../../utils/api';
import BrandSelect from '../../components/form/BrandSelect';
import ProductCard from '../../components/common/ProductCard';

const { Option } = Select;

// 🔹 hook เล็ก ๆ สำหรับ debounce ค่า
function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// 🔹 helper: ลบ key ที่เป็น null/''/undefined
function pickTruthy(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

// 🔹 helper: แปลง search params เป็น filters
const parseFiltersFromSearch = (searchParams) => ({
  category: searchParams.get('category') || '',
  brand: searchParams.get('brand') || '',
  rarity: searchParams.get('rarity') || '',
  condition: searchParams.get('condition') || '',
  // tags รับได้ทั้ง "a,b,c" หรือซ้ำๆหลายพารามิเตอร์ ?tags=a&tags=b
  tags: (() => {
    const multi = searchParams.getAll('tags');
    if (multi && multi.length > 1) return multi;
    const single = searchParams.get('tags');
    return single ? single.split(',').filter(Boolean) : [];
  })(),
  minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
  maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
  q: searchParams.get('q') || '',
});

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // ค้นหา + ฟิลเตอร์
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    rarity: '',
    condition: '',
    tags: [],
    minPrice: null,
    maxPrice: null,
  });

  // เพจหน้า (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  // ✅ debounce ทั้ง filters และ query
  const debouncedFilters = useDebounce(filters, 400);
  const debouncedQuery = useDebounce(searchQuery, 400);

  // options
  const categories = [
    { label: 'Figure', value: 'Figure' },
    { label: 'Action Figure', value: 'Action Figure' },
    { label: 'Blind Box', value: 'Blind Box' },
    { label: 'Plush Toys', value: 'Plush Toys' },
    { label: 'Art Work', value: 'Art Work' },
    { label: 'OTHER', value: 'OTHER' },
  ];
  const conditions = [
    { label: 'Pre-owned', value: 'Pre-owned' },
    { label: 'Brand New', value: 'Brand New' },
  ];
  const rarityOptions = [
    { label: 'Common', value: 'Common' },
    { label: 'Secret', value: 'Secret' },
    { label: 'Limited Edition', value: 'Limited' },
  ];
  const initialFilters = {
    category: '',
    brand: '',
    rarity: '',
    condition: '',
    tags: [],
    minPrice: null,
    maxPrice: null,
  };

  // UI: mobile filter drawer
  const [showFilters, setShowFilters] = useState(false);

  // โหลด brands/tags ครั้งเดียว
  useEffect(() => {
    (async () => {
      try {
        const [brandRes, tagRes] = await Promise.all([api.get('/api/brand'), api.get('/api/tags')]);
        setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
        setAvailableTags(Array.isArray(tagRes.data) ? tagRes.data : []);
      } catch (err) {
        console.error(err);
        message.error('โหลดแบรนด์/แท็กไม่สำเร็จ');
      }
    })();
  }, []);
  // Sync filters <-> URL search params
   useEffect(() => {
    const next = parseFiltersFromSearch(searchParams);
    // อัปเดตทั้ง filters และ searchQuery ถ้ามี q
    setFilters(prev => ({ ...prev, ...next, q: undefined }));
    if (next.q !== undefined) setSearchQuery(next.q);
    // รีเซ็ตหน้าให้เริ่มที่หน้า 1
    setCurrentPage(1);
  }, [searchParams]);
  // ✅ ยิงค้นหา “เมื่อค่าที่ debounce แล้วเปลี่ยน” + ยกเลิกคำขอเก่า
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(
          pickTruthy({
            category: debouncedFilters.category,
            brand: debouncedFilters.brand,
            rarity: debouncedFilters.rarity,
            condition: debouncedFilters.condition,
            tags: debouncedFilters.tags?.length ? debouncedFilters.tags.join(',') : undefined,
            minPrice:
              debouncedFilters.minPrice !== null ? String(debouncedFilters.minPrice) : undefined,
            maxPrice:
              debouncedFilters.maxPrice !== null ? String(debouncedFilters.maxPrice) : undefined,
            // q: debouncedQuery || undefined, // ถ้าเปิดใช้ค้นหา server-side ในอนาคต
          })
        ).toString();

        const res = await api.get(`/api/products/published?${params}`, {
          signal: controller.signal,
        });

        const list = Array.isArray(res.data?.items || res.data) ? (res.data.items || res.data) : [];
        setProducts(list);
        setCurrentPage(1);
        // console.log('Loaded products:', list);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Error fetching products:', err);
          message.error('โหลดสินค้าล้มเหลว');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedFilters /*, debouncedQuery */]);

  // 🔎 filter คำค้นที่ฝั่ง client
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery) return products;
    const q = debouncedQuery.toLowerCase();
    return products.filter((p) => {
      const title = (p.title || p.name || '').toLowerCase();
      return title.includes(q);
    });
  }, [products, debouncedQuery]);

  // จำนวนหน้า
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;

  // กัน currentPage เกิน
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters(initialFilters);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPristine =
    !searchQuery &&
    !filters.category &&
    !filters.brand &&
    !filters.rarity &&
    !filters.condition &&
    (!filters.tags || filters.tags.length === 0) &&
    filters.minPrice == null &&
    filters.maxPrice == null;

  return (
    <div className="min-h-screen bg-yellow-100 text-gray-900">
      {/* Header Section */}
      <div className="sticky top-16 z-30 bg-yellow-100/80 backdrop-blur supports-[backdrop-filter]:bg-yellow-100/70 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Product List</h1>
            <p className="text-sm text-gray-600">
              ทั้งหมด <span className="font-medium text-yellow-700">{filteredProducts.length}</span> รายการ
            </p>
          </div>
          {/* Mobile filter toggle */}
          <button
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-300 hover:bg-yellow-400 text-black transition"
            onClick={() => setShowFilters((s) => !s)}
          >
            {showFilters ? <FiX /> : <FiFilter />}
            ฟิลเตอร์
          </button>
        </div>
      </div>
      <div className="max-w-8xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar (responsive) */}
        <div
          className={[
            "bg-white rounded-xl shadow-sm border border-yellow-200 h-full overflow-y-auto min-h-0",
            "p-4 md:p-5",
            "md:sticky md:top-28 md:self-start",
            // mobile drawer
            "md:block",
            showFilters ? "block" : "hidden",
          ].join(" ")}
        >
          <aside className="md:col-span-1 sticky top-16 h-full">
            <div className="h-full overflow-y-auto min-h-0 pr-2">
              <Form layout="vertical" className="space-y-3">
                <Form.Item label={<span className="font-semibold text-yellow-800">ค้นหา</span>}>
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                    className="rounded-lg border-yellow-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300"
                  />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-yellow-800">หมวดหมู่</span>}>
                  <Select
                    value={filters.category}
                    onChange={(v) => handleFilterChange('category', v)}
                    placeholder="All Categories"
                    allowClear
                    className="w-full"
                  >
                    {categories.map((cat) => (
                      <Option key={cat.value} value={cat.value}>
                        {cat.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-yellow-800">สภาพสินค้า</span>}>
                  <Select
                    value={filters.condition}
                    onChange={(v) => handleFilterChange('condition', v)}
                    placeholder="All Conditions"
                    allowClear
                  >
                    {conditions.map((cond) => (
                      <Option key={cond.value} value={cond.value}>
                        {cond.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-yellow-800">ความหายาก</span>}>
                  <Select
                    value={filters.rarity}
                    onChange={(v) => handleFilterChange('rarity', v)}
                    placeholder="All Rarities"
                    allowClear
                  >
                    {rarityOptions.map((r) => (
                      <Option key={r.value} value={r.value}>
                        {r.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-yellow-800">แบรนด์</span>}>
                  <BrandSelect
                    brands={brands}
                    selectedBrand={filters.brand}
                    onChange={(v) => handleFilterChange('brand', v)}
                  />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-yellow-800">Tags</span>}>
                  <Select
                    mode="multiple"
                    placeholder="Select tags"
                    value={filters.tags}
                    onChange={(v) => handleFilterChange('tags', v)}
                    allowClear
                  >
                    {availableTags.map((tag) => (
                      <Option key={tag._id} value={tag.name}>
                        {tag.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-yellow-800">ราคา</span>}>
                  <div className="flex gap-2">
                    <InputNumber
                      className="flex-1"
                      placeholder="ต่ำสุด"
                      value={filters.minPrice}
                      onChange={(v) => handleFilterChange('minPrice', v ?? null)}
                      formatter={(v) =>
                        v !== null && v !== undefined
                          ? `฿${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                          : ''
                      }
                      parser={(v) => (v ? v.replace(/฿\s?|(,*)/g, '') : '')}
                    />
                    <InputNumber
                      className="flex-1"
                      placeholder="สูงสุด"
                      value={filters.maxPrice}
                      onChange={(v) => handleFilterChange('maxPrice', v ?? null)}
                      formatter={(v) =>
                        v !== null && v !== undefined
                          ? `฿${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                          : ''
                      }
                      parser={(v) => (v ? v.replace(/฿\s?|(,*)/g, '') : '')}
                    />
                  </div>
                </Form.Item>

                <Form.Item>
                  <Space className="w-full justify-between">
                    <Button onClick={handleResetFilters} danger ghost>
                      ล้างค่า
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setShowFilters(false)}
                      className="bg-yellow-400 hover:bg-yellow-500 border-none"
                    >
                      ปิด
                    </Button>
                  </Space>
                  {/* แสดงสรุปฟิลเตอร์ที่เลือก (แบบอ่านง่าย) */}
                  {!isPristine && (
                    <div className="mt-3 text-xs text-gray-600">
                      ฟิลเตอร์ถูกใช้งานอยู่ •{' '}
                      <button
                        onClick={handleResetFilters}
                        className="underline text-yellow-700 hover:text-yellow-800"
                      >
                        เคลียร์ทั้งหมด
                      </button>
                    </div>
                  )}
                </Form.Item>
              </Form>
            </div>
          </aside>
        </div>

        {/* Main */}
        <div className="md:col-span-3">
          {/* ผลลัพธ์ + แถบเครื่องมือ */}
          <div className="mb-4 flex items-center justify-between">
            <div className="hidden md:block text-sm text-gray-600">
              พบ {filteredProducts.length} รายการ
            </div>
            <div className="md:hidden">
              {/* ปุ่มฟิลเตอร์ซ้ำอีกที่ (สำหรับ UX) */}
              <button
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-300 hover:bg-yellow-400 text-black transition"
                onClick={() => setShowFilters(true)}
              >
                <FiFilter /> ปรับฟิลเตอร์
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-yellow-200 rounded-xl py-14 text-center">
              <div className="text-lg font-medium text-gray-700">ไม่พบสินค้า</div>
              <div className="text-sm text-gray-500 mt-1">
                ลองปรับฟิลเตอร์หรือล้างค่าเพื่อค้นหาใหม่
              </div>
              <Button
                className="mt-4 bg-yellow-400 hover:bg-yellow-500 border-none"
                type="primary"
                onClick={handleResetFilters}
              >
                ล้างฟิลเตอร์
              </Button>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* ปรับ grid ให้ responsive มากขึ้น */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {filteredProducts
                  .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                  .map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
              </div>

              <div className="flex justify-center mt-auto pb-4">
                <Pagination
                  current={currentPage}
                  total={filteredProducts.length}
                  pageSize={productsPerPage}
                  onChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  showSizeChanger={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
  );
}
