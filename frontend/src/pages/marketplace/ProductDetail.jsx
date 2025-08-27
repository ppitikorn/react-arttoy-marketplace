import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ReportButton from '../../components/common/ReportButton';
import ChatButton from '../../components/common/ChatButton';
import api from '../../utils/api';
import ProductCard from '../../components/common/ProductCard';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isSeller, setIsSeller] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Generate session ID for anonymous users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  // Track product view
  const trackView = async () => {
    try {
      const response = await api.post(`/api/products/${slug}/view`, {
        userId: user?._id || null,
        sessionId: getSessionId(),
      });

      if (response.data.success) {
        setViewsCount(response.data.viewsCount);
        //console.log(response.data.message);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't show error to user, view tracking is background operation
    }
  };
  const fetchLikeStatus = async () => {
    if (user && slug) {
      try {
        const response = await api.get(`/api/products/${slug}/like-status`);
        setIsLiked(response.data.isLiked);
        setLikesCount(response.data.likesCount);
        //console.log('Fetched like status:', response.data);
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    }
  };
  const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/products/${slug}`);
        setProduct(response.data);
        setViewsCount(response.data.views || 0);
        
        // Track view after product is loaded
        setTimeout(() => trackView(), 1000); // Delay to ensure page is actually viewed
        
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError(error.response?.data?.message || 'Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };
  const fetchRecomProd = async () => {
    if (!product) return;

    try {
      const res = await api.get('/api/products/recommends/item', { params: { limit: 12 } });
      setRecommendedProducts(res.data.items.map(r => r.product));
      //console.log('Recommended products:', recommendedProducts);

    } catch (error) {
      console.error('Error fetching recommended products:', error);
    }
  };
  const checkUserRole = () => {
    if (!product || !product.seller) {
      setIsSeller(false);
      return;
    }
    // Check if user is logged in
    if (!user) {
      setIsSeller(false);
      return;
    }

    const userId = user.id || user._id;
    const sellerId = product.seller._id || product.seller.id;

    if (userId === sellerId) {
      setIsSeller(true);
    } else {
      setIsSeller(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProductDetails();
      fetchLikeStatus();
    }
  }, [slug]);

  useEffect(() => {
  if (product) {
    checkUserRole(); 
    fetchRecomProd();
  }
}, [product, user]);

  // const handleLikeToggle = async () => {
  //   // Check if user is logged in
  //   if (!user) {
  //     alert('Please login to like products');
  //     navigate('/login');
  //     return;
  //   }

  //   // Prevent sellers from liking their own products
  //   if (isSeller) {
  //     alert('You cannot like your own product');
  //     return;
  //   }

  //   setLikeLoading(true);
    
  //   // Optimistic update
  //   const wasLiked = isLiked
  //   const newLikes = wasLiked 
  //     ? product.likes.filter(id => id !== user._id)
  //     : [...product.likes, user._id];
    
  //   setProduct(prev => ({
  //     ...prev,
  //     likes: newLikes
  //   }));

  //   try {
  //     const url = `/api/products/${slug}/like`;
  //     const response = wasLiked ? await api.delete(url) : await api.put(url);
  //     // const { isLiked, likesCount } = response.data || {};
  //     // Update with server response
  //     setProduct(prev => ({
  //       ...prev,
  //       likes: response.data.isLiked 
  //         ? [...prev.likes.filter(id => id !== user._id), user._id]
  //         : prev.likes.filter(id => id !== user._id)
  //     }));
  //     fetchLikeStatus(); // Refresh like status
  //   } catch (error) {
  //     // Revert optimistic update on error
  //     setProduct(prev => ({
  //       ...prev,
  //       likes: product.likes
  //     }));
      
  //     console.error('Error toggling like:', error);
  //     alert('Failed to update like status');
  //   } finally {
  //     setLikeLoading(false);
  //   }
  // };
  // สมมติว่าตอน mount ดึงค่าเริ่มต้นมาก่อน


// ใช้ตอนโหลดรายละเอียดสินค้า/like-status
// setIsLiked(resIsLiked); setLikesCount(resLikesCount);

const handleLikeToggle = async () => {
  if (!user) {
    alert('Please login to like products');
    navigate('/login');
    return;
  }
  if (isSeller) {
    alert('You cannot like your own product');
    return;
  }
  if (likeLoading) return;
  setLikeLoading(true);

  // optimistic
  const prevLiked = isLiked;
  const prevCount = likesCount;
  const nextLiked = !prevLiked;
  const nextCount = prevCount + (prevLiked ? -1 : +1);
  setIsLiked(nextLiked);
  setLikesCount(nextCount);

  try {
    const url = `/api/products/${slug}/like`;
    prevLiked ? await api.delete(url) : await api.put(url);

    // ไม่ต้องเซ็ต product เลย ลด side effects
    // ถ้าอยาก sync ให้ชัวร์ก็เรียก like-status แบบเบา ๆ ก็ได้ แต่ปกติไม่จำเป็น
    // const { data } = await api.get(`/api/products/${slug}/like-status`);
    // setIsLiked(data.isLiked); setLikesCount(data.likesCount);

  } catch (err) {
    // revert ถ้าพลาด
    setIsLiked(prevLiked);
    setLikesCount(prevCount);
    console.error('Error toggling like:', err);
    alert('Failed to update like status');
  } finally {
    setLikeLoading(false);
  }
};

  const handleMarkAsSold = async (e) => {
    e.preventDefault();
    if (loading) return;

    const value = e.target.value;
    //console.log('Marking as sold:', value);
    //console.log('product.isSold:', product.isSold);
    setLoading(true);

    if (!isSeller) {
      alert('Only the seller can mark this product as sold');
      return;
    }
    //axios patch request to mark product as sold
    try {
      await api.patch(`/api/products/${product.slug}/sold`);
      setProduct(prev => ({
        ...prev,
        isSold: true
      }));
      alert(`Set as ${value}`);
    } catch (error) {
      console.error('Error marking product as sold:', error);
      alert('Failed to mark product as sold');
    } finally {
      setLoading(false);
      fetchProductDetails(); // Refresh product details
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4C4C] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-600">{error}</p>
        <Link to="/products" className="mt-4 bg-[#FF4C4C] hover:bg-red-600 text-white px-4 py-2 rounded">
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Product Not Found</h2>
        <Link to="/products" className="mt-4 bg-[#FF4C4C] hover:bg-red-600 text-white px-4 py-2 rounded">
          Back to Products
        </Link>
      </div>
    );  }
  
  return (
    <div className="min-h-screen bg-yellow-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-[#FF4C4C]">Home</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-[#FF4C4C]">Products</Link></li>
            <li>/</li>
            <li className="text-gray-900 truncate">{product.title}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={product.images[activeImage]}
                  alt={product.title}
                  className="w-full h-96 object-contain"
                />
              </div>
              
              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                        activeImage === index ? 'border-[#FF4C4C]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex">{product.title}</h1>
                <div className="flex items-center mt-2 flex-wrap gap-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    product.rarity === 'Limited' ? 'bg-red-100 text-red-600' :
                    product.rarity === 'Secret' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {product.rarity}
                  </span>
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                    {product.condition}
                  </span>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-full">
                    {product.category}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{product.details}</p>
              </div>

              <div className="text-4xl font-bold text-[#FF4C4C]">
                ฿{product.price.toLocaleString()}
              </div>

              {/* Seller Information */}
              <div className="border-t border-b border-gray-200 py-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Seller</h2>
                <Link
                  to={`/profile/${product?.seller?.username}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <img
                    src={product?.seller?.avatar || 'https://placehold.co/400'}
                    alt={product?.seller?.name}
                    className="w-12 h-12 rounded-full border border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product?.seller?.name}</p>
                    <p className="text-sm text-gray-500">@{product?.seller?.username}</p>
                  </div>
                  {product?.seller?.emailVerified && (
                    <svg
                      className="w-5 h-5 text-blue-500"
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
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isSeller && (
                  <>
                    {/* Like Button */}
                    <button
                      onClick={handleLikeToggle}
                      disabled={likeLoading}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isLiked
                          ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                      } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {likeLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                      ) : (
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            isLiked ? 'text-red-500 fill-current' : 'text-gray-400'
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          fill={isLiked ? "currentColor" : "none"}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      )}
                      <span>{isLiked ? 'Liked' : 'Like'}</span>
                      {likesCount > 0 && (
                        <span className="bg-white text-gray-700 px-2 py-0.5 rounded-full text-xs border">
                          {likesCount}
                        </span>
                      )}
                    </button>
                    {/* Contact Button - Temporarily disabled */}
                    <ChatButton userId={product?.seller?._id} />
                  </>
                )}
                {isSeller && (
                  <div className="mt-4">
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      onClick={() => navigate(`/products/edit/${product.slug}`)}
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
                    <span>Edit Product</span>
                  </button>
                    <button
                      className={`w-full flex items-center justify-center gap-2 py-3 ${product.isSold ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg font-medium  transition-colors mt-2`}
                      onClick={handleMarkAsSold}
                      value={product.isSold ? 'available' : 'sold'}
                    >
                      {/* <svg
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
                          d="M9 12h6m-3-3v6m8.485-10.485a9 9 0 11-12.728 12.728A9 9 0 0118.485 4.515z"
                        />
                      </svg> */}
                      <span>{product.isSold ? '✅Set as Available' : '❌Set as Sold'}</span>
                    </button>
                </div>
                )}
              </div>
              {/* Report Button */}
              {!isSeller && <ReportButton productId={product._id} productTitle={product.title}/>}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{likesCount}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{viewsCount}</div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewsCount > 0 ? ((likesCount / viewsCount) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-gray-500">Like Rate</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Product Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md mt-6 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span
                  key={tag._id}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md mt-6 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Similar Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-gray-700">
                {recommendedProducts.map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
            </div>
          </div>
        {/* Back to Products Button */}
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

export default ProductDetail;