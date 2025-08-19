import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import api from '../../utils/api';
import BrandSelect from '../../components/form/BrandSelect';
import { 
  Form, 
  Input, 
  Select, 
  Upload, 
  Button, 
  message, 
  Card, 
  Space,
  InputNumber,
  Typography,
  Pagination
} from 'antd';

const { Option } = Select;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;
  const [availableTags, setAvailableTags] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    rarity: '',
    condition: '',
    tags: [],
    minPrice: null,
    maxPrice: null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  const categories = [
    { label: 'Figure', value: 'Figure' },
    { label: 'Action Figure', value: 'Action Figure' },
    { label: 'Blind Box', value: 'Blind Box' },
    { label: 'Plush Toys', value: 'Plush Toys' },
    { label: 'Art Work', value: 'Art Work' },
    { label: 'OTHER', value: 'OTHER' }
  ];

  const conditions = [
    { label: 'Pre-owned', value: 'Pre-owned' },
    { label: 'Brand New', value: 'Brand New' }
  ];

  const rarityOptions = [
    { label: 'Common', value: 'Common' },
    { label: 'Secret', value: 'Secret' },
    { label: 'Limited Edition', value: 'Limited' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchTags();
  }, [filters]);

  // Reset to first page when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const fetchTags = async () => {
    try {
      const response = await api.get('/api/tags');
      setAvailableTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      message.error('Failed to load tags');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/api/brand');
      console.log('Fetched brands:', response.data);
      setBrands(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load brands and tags');
      }
    };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.brand) queryParams.append('brand', filters.brand);
      if (filters.rarity) queryParams.append('rarity', filters.rarity);
      if (filters.condition) queryParams.append('condition', filters.condition);
      if (filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);

      const response = await api.get(`/api/products/published?${queryParams}`);
      setProducts(response.data);
      console.log('Fetched products:', response.data);
      console.log('Filters applied:', filters);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // First apply search query filter
  const filteredProducts = searchQuery
    ? products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  // Ensure currentPage is within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 text-gray-800 bg-yellow-100">
  <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-20">
    
    {/* Sidebar (Category Filters) */}
    <div className="bg-white p-5 rounded-lg shadow-sm space-y-4">
      <Form layout="vertical">
        <Form.Item label={<span className="font-bold text-lg">ค้นหา</span>}>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold text-lg">หมวดหมู่</span>}>
          <Select
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            placeholder="All Categories"
            className="w-full"
            rootClassName="rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
          >
            <Option value="">All Categories</Option>
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={<span className="font-bold text-lg">สภาพสินค้า</span>}>
          <Select
            value={filters.condition}
            onChange={(value) => handleFilterChange('condition', value)}
            placeholder="All Conditions"
            className="w-full"
            rootClassName="rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
          >
            <Option value="">All Conditions</Option>
            {conditions.map(cond => (
              <Option key={cond.value} value={cond.value}>{cond.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={<span className="font-bold text-lg">ความหายาก</span>}>
          <Select
            value={filters.rarity}
            onChange={(value) => handleFilterChange('rarity', value)}
            placeholder="All Rarities"
            className="w-full"
            rootClassName="rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
          >
            <Option value="">All Rarities</Option>
            {rarityOptions.map(rarity => (
              <Option key={rarity.value} value={rarity.value}>{rarity.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={<span className="font-bold text-lg">แบรนด์</span>}>
          <BrandSelect 
            brands={brands}
            selectedBrand={filters.brand}
            onChange={(value) => handleFilterChange('brand', value)}
          />
        </Form.Item>

        <Form.Item label={<span className="font-bold text-lg">Tags</span>}>
          <Select
            mode="multiple"
            placeholder="Select tags"
            value={filters.tags}
            onChange={(value) => handleFilterChange('tags', value)}
            className="w-full"
            rootClassName="rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
          >
            {availableTags.map(tag => (
              <Option key={tag._id} value={tag._id}>
                {tag.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={<span className="font-bold text-lg">ราคา</span>}>
          <Space className="w-full">
            <InputNumber
              className="w-full"
              placeholder="ต่ำสุด"
              value={filters.minPrice}
              onChange={(value) => handleFilterChange('minPrice', value)}
              formatter={value => `฿${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/฿\s?|(,*)/g, '')}
            />
            <InputNumber
              className="w-full"
              placeholder="สูงสุด"
              value={filters.maxPrice}
              onChange={(value) => handleFilterChange('maxPrice', value)}
              formatter={value => `฿${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/฿\s?|(,*)/g, '')}
            />
          </Space>
        </Form.Item>
      </Form>

    </div>
    {/* Main Content (Products) */}
    <div className="md:col-span-3">
      <h3 className="flex justify-center items-center h-15 text-2xl font-bold " >Product List</h3>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4C4C] border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {filteredProducts
              .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
              .concat(Array(Math.max(0, productsPerPage - filteredProducts.length)).fill(null))
              .map((product, index) => 
                product ? (
                  <ProductCard 
                    key={product._id} 
                    product={product}
                  />
                ) : (
                  <div key={`empty-${index}`} className="h-0" />
                )
              )}
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
};

export default ProductList;