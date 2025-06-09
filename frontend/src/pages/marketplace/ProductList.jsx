import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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
            <Link
              key={product._id}
              to={`/products/${product.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-transform transition-shadow duration-300"
            >
              <div className="aspect-w-1 aspect-h-1">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
              </div>              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-left ">{product.title}</h3>
                <Link
                  to={`/seller/${product.seller.username}`}
                  className="flex items-center gap-2 mt-2 hover:bg-gray-300 transition-transform rounded-lg p-2"
                >
                  <img
                    src={product.seller.avatar}
                    alt={product.seller.name}
                    className="w-6 h-6 rounded-full border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{product.seller.name}</span>
                  {product.seller.emailVerified && (
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </Link>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#FF4C4C] font-bold">฿{product.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">{product.condition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{product.category}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    product.rarity === 'Limited' ? 'bg-red-100 text-red-600' :
                    product.rarity === 'Secret' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {product.rarity}
                  </span>
                </div>
              </div>
            </Link>
            // <Link
            //     key={product.id}
            //     to={`/products/${product.id}`}
            //     className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
            //     <img
            //       src={product.image}
            //       alt={product.name}
            //       className="w-full h-64 object-cover"
            //     />
            //     <div className="p-4">
          //         <h3 className="text-lg font-medium text-white">{product.name}</h3>
              
          //     {/* Seller Info */}
          //     <Link
          //       to={`/seller/${product.seller.id}`}
          //       className="flex items-center gap-2 mt-2 hover:bg-gray-700 rounded-lg p-2"
          //       onClick={(e) => e.stopPropagation()}
          //     >
          //       <img
          //         src={product.seller.avatar}
          //         alt={product.seller.name}
          //         className="w-6 h-6 rounded-full"
          //       />
          //       <span className="text-sm text-gray-300">{product.seller.name}</span>
          //       {product.seller.isVerified && (
          //         <svg 
          //           className="w-4 h-4 text-blue-500"
          //           fill="currentColor"
          //           viewBox="0 0 20 20"
          //         >
          //           <path
          //             fillRule="evenodd"
          //             d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          //             clipRule="evenodd"
          //           />
          //         </svg>
          //       )}
          //     </Link>

          //     <div className="mt-2 flex items-center justify-between">
          //       <span className="text-purple-400 font-bold">${product.price}</span>
          //       <button
          //         onClick={(e) => toggleLike(e, product.id)}
          //         className="flex items-center space-x-1 text-gray-300 hover:text-purple-400"
          //       >
          //         <svg
          //           className={`w-5 h-5 ${likedProducts.has(product.id) ? 'text-red-500 fill-current' : 'text-gray-300'}`}
          //           xmlns="http://www.w3.org/2000/svg"
          //           viewBox="0 0 24 24"
          //           stroke="currentColor"
          //           fill="none"
          //         >
          //           <path
          //             strokeLinecap="round"
          //             strokeLinejoin="round"
          //             strokeWidth={2}
          //             d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          //           />
          //         </svg>
          //         <span>{product.likes + (likedProducts.has(product.id) ? 1 : 0)}</span>
          //       </button>
          //     </div>
          //   </div>
          // </Link>
          )
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProductList;