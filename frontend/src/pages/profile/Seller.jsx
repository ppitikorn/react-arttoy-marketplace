import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import ProductCard from '../../components/common/ProductCard';
import api from '../../utils/api.js';

const Seller = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    totalLikes: 0,
    soldProducts: 0
  });

  useEffect(() => {
    if (username) {
      fetchSellerProfile();
      fetchSellerProducts();
    }
  }, [username]);

  useEffect(() => {
    if (seller && currentUser) {
      setIsOwnProfile(seller.username === currentUser.username);
    }
  }, [seller, currentUser]);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/profile/user/${username}`);
      console.log('Seller profile response:', response.data);
      setSeller(response.data);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      setError(error.response?.data?.message || 'Failed to fetch seller profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get(`/api/products?seller=${username}`);
      setProducts(response.data);
      
      // Calculate stats
      const totalProducts = response.data.length;
      const totalViews = response.data.reduce((sum, product) => sum + (product.views || 0), 0);
      const totalLikes = response.data.reduce((sum, product) => sum + (product.likes?.length || 0), 0);
      const soldProducts = response.data.filter(product => product.isSold).length;
      
      setStats({
        totalProducts,
        totalViews,
        totalLikes,
        soldProducts
      });
    } catch (error) {
      console.error('Error fetching seller products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0f2f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4C4C] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/products" 
            className="bg-[#FF4C4C] hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user @{username} could not be found.</p>
          <Link 
            to="/products" 
            className="bg-[#FF4C4C] hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-[#FF4C4C]">Home</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-[#FF4C4C]">Products</Link></li>
            <li>/</li>
            <li className="text-gray-900">@{seller.username}</li>
          </ol>
        </nav>

        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start">
                <img
                  src={seller.avatar || 'https://placehold.co/400'}
                  alt={seller.name}
                  className="w-32 h-32 rounded-full border-4 border-gray-200 mb-4"
                />
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    {seller.name}
                    {seller.emailVerified && (
                      <svg
                        className="w-6 h-6 text-blue-500"
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
                  </h1>
                  <p className="text-lg text-gray-600 mb-2">@{seller.username}</p>
                  {seller.email && (
                    <p className="text-gray-500">{seller.email}</p>
                  )}
                  {seller.bio && (
                    <p className="text-gray-700 mt-4 max-w-md">{seller.bio}</p>
                  )}
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="flex-1">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                    <div className="text-sm text-gray-500">Products</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
                    <div className="text-sm text-gray-500">Total Views</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
                    <div className="text-sm text-gray-500">Total Likes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stats.soldProducts}</div>
                    <div className="text-sm text-gray-500">Sold</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {!isOwnProfile && currentUser && (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>Chat with {seller.name} (Coming Soon)</span>
                    </button>
                  )}
                  
                  {isOwnProfile && (
                    <Link
                      to="/profile"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span>Edit Profile</span>
                    </Link>
                  )}
                </div>

                {/* Additional Info */}
                {seller.joinedDate && (
                  <div className="mt-6 text-sm text-gray-500">
                    <span>Member since {new Date(seller.joinedDate || seller.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isOwnProfile ? 'My Products' : `${seller.name}'s Products`}
            </h2>
            <p className="text-gray-600 mt-1">
              {stats.totalProducts} product{stats.totalProducts !== 1 ? 's' : ''} listed
            </p>
          </div>

          <div className="p-6">
            {productsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4C4C] border-t-transparent"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="text-gray-800 relative">
                    <ProductCard product={product} isSold={product.isSold} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {isOwnProfile ? 'No products yet' : 'No products listed'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {isOwnProfile 
                    ? 'Start selling by posting your first product!' 
                    : `${seller.name} hasn't listed any products yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Link
                    to="/post-product"
                    className="bg-[#FF4C4C] hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Post Your First Product
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Seller;