import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../utils/api.js';
import { format } from 'date-fns';
import { 
  FiEye, FiEdit2, FiTrash2, FiEyeOff, FiAlertTriangle,
  FiSearch, FiFilter, FiBarChart2, FiThumbsUp, FiClock
} from 'react-icons/fi';

const AdminProduct = () => {
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', id: '' });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    dateRange: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    rejected: 0,
    hidden: 0,
    newThisWeek: 0,
    topViewed: [],
    topLiked: []
  });

  useEffect(() => {
    fetchProducts();
    //fetchReports();
    //console.log("Stats :",stats)
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/products');
      setProducts(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      //console.log("Fetched Products:", products);
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/admin/reports');
      setReports(response.data);

    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const calculateStats = (products) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newStats = {
      total: products.length,
      rejected: products.filter(p => p.status === 'Rejected').length,
      hidden: products.filter(p => p.status === 'Hidden').length,
      newThisWeek: products.filter(p => new Date(p.createdAt) > weekAgo).length,
      topViewed: [...products].sort((a, b) => b.views - a.views).slice(0, 5),
      topLiked: [...products].sort((a, b) => b.likes.length - a.likes.length).slice(0, 5)
    };
    setStats(newStats);
  };

  const handleAction = async (type, productId) => {
    try {
      switch (type) {
        case 'delete':
          await api.delete(`/api/admin/products/${productId}`);
          break;
        case 'pending':
          await api.patch(`/api/admin/products/${productId}/status`, { status: 'Pending' });
          break; 
        case 'hide':
          await api.patch(`/api/admin/products/${productId}/status`, { status: 'Hidden' });
          break;        
        case 'publish':
          await api.patch(`/api/admin/products/${productId}/status`, { status: 'Published' });
          break;
        case 'reject':
          await api.patch(`/api/admin/products/${productId}/status`, { status: 'Rejected' });
          break;
      }
      fetchProducts();
      fetchReports();
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800';
      case 'Hidden': return 'bg-gray-100 text-gray-800';
      case 'Rejected': return 'bg-orange-100 text-orange-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.seller.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.category.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || product.status === filters.status;
    const matchesCategory = !filters.category || product.category === filters.category;
    
    if (filters.dateRange === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && matchesStatus && matchesCategory && new Date(product.createdAt) > weekAgo;
    }
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Product Detail Modal
  const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;  

    return (
      <div className="fixed inset-0 bg-black/75  flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{product.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Product Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Product ${index + 1}`}
                className="w-50 h-50 object-cover rounded-lg border"
              />
            ))}
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Product Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Price:</span> ฿{product.price.toLocaleString()}</p>
                <p><span className="font-medium">Category:</span> {product.category}</p>
                <p><span className="font-medium">Brand:</span> {product.brand.name}</p>
                <p><span className="font-medium">Condition:</span> {product.condition}</p>
                <p><span className="font-medium">Rarity:</span> {product.rarity}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${getStatusBadgeClass(product.status)}`}>
                    {product.status}
                  </span>
                </p>
                <p><span className="font-medium">isSold:</span> {product.isSold ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Seller Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Username:</span> {product.seller?.username}</p>
                <p><span className="font-medium">Email:</span> {product.seller?.email}</p>
                <p><span className="font-medium">Posted Date:</span> {format(new Date(product.createdAt), 'PPP')}</p>
                <p><span className="font-medium">Views:</span> {product.views}</p>
                <p><span className="font-medium">Likes:</span> {product.likes?.length || 0}</p>
              </div>
            </div>
          </div>
          {/* Product Description */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{product.details || 'No description provided.'}</p>
          </div>
          {/* Actions */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => {
                handleAction('pending', product._id);
                setShowDetailModal(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set to Pending
            </button>
            <button
              onClick={() => {
                handleAction('publish', product._id);
                setShowDetailModal(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set to Published
            </button>
            <button
              onClick={() => {
                handleAction('hide', product._id);
                setShowDetailModal(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set to Hidden
            </button>
            <button
              onClick={() => {
                handleAction('reject', product._id);
                setShowDetailModal(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set to Rejected
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 text-gray-800">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Products</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FiBarChart2 className="text-2xl text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Rejected Items</p>
              <p className="text-2xl font-bold text-orange-500">{stats.rejected}</p>
            </div>
            <FiAlertTriangle className="text-2xl text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Hidden Items</p>
              <p className="text-2xl font-bold text-gray-500">{stats.hidden}</p>
            </div>
            <FiEyeOff className="text-2xl text-gray-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">New This Week</p>
              <p className="text-2xl font-bold text-green-500">{stats.newThisWeek}</p>
            </div>
            <FiClock className="text-2xl text-green-500" />
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiEye className="mr-2" /> Most Viewed Products
          </h3>
          <div className="space-y-2">
            {stats.topViewed.map(product => (
              <div key={product._id} className="flex items-center justify-between">
                <span className="truncate flex-1">{product.title}</span>
                <span className="text-gray-500">{product.views} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiThumbsUp className="mr-2" /> Most Liked Products
          </h3>
          <div className="space-y-2">
            {stats.topLiked.map(product => (
              <div key={product._id} className="flex items-center justify-between">
                <span className="truncate flex-1">{product.title}</span>
                <span className="text-gray-500">{product.likes?.length || 0} likes</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <select
            className="p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Published">Published</option>
            <option value="Hidden">Hidden</option>
            <option value="Rejected">Rejected</option>
          </select>
          
          <select
            className="p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category/Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">isSold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#FF4C4C] border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={product.images[0]}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">
                            by {product.seller?.username || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.category}</div>
                      <div className="text-sm text-gray-500"> {product.brand.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ฿{product.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.views} views
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.likes?.length || 0} likes
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isSold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.isSold ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900">
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        {product.status ==='Hidden' ?
                          <button
                            alt="Pending"
                            onClick={() => handleAction('pending', product._id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <FiEye className="h-5 w-5" />
                          </button> :
                          <button
                            alt="Hide"
                            onClick={() => handleAction('hide', product._id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <FiEyeOff className="h-5 w-5" />
                          </button>
                        }
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'delete', id: product._id });
                            setShowConfirmModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProduct(null);
          }}
        />
      )}


      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="mb-6">Are you sure you want to perform this action? This cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction(confirmAction.type, confirmAction.id);
                  setShowConfirmModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProduct;