import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    rarity: '',
    tags: []
  });

  const categories = ["Figure", "Action Figure", "Blind Box", "Plush Toys", "Art Work", "OTHER"];
  const rarityOptions = ["Common", "Secret", "Limited"];

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.brand) queryParams.append('brand', filters.brand);
      if (filters.rarity) queryParams.append('rarity', filters.rarity);
      if (filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));

      const response = await axios.get(`http://localhost:5000/api/products?${queryParams}`);
      setProducts(response.data);
      console.log('Fetched products:', response.data);
      console.log('Filters applied:', filters);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 text-gray-800">
      {/* Search and Filters Section */}
      <div className="text-center mb-6 border-b border-gray-200 pb-4 bg-white shadow-sm rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Product List</h2>
        </div>
      <div className="max-w-7xl mx-auto mb-8 space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            className="p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#FF4C4C]"
            value={filters.rarity}
            onChange={(e) => handleFilterChange('rarity', e.target.value)}
          >
            <option value="">All Rarities</option>
            {rarityOptions.map(rarity => (
              <option key={rarity} value={rarity}>{rarity}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4C4C] border-t-transparent"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product._id} 
              product={product}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProductList;