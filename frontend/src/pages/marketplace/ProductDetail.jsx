import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  // Mock data - replace with API call
  const product = {
    id: 1,
    name: "Designer Art Toy #1",
    artist: "John Artist",
    price: 299.99,
    description: "A unique designer art toy handcrafted with precision and care. Limited edition piece featuring intricate details and premium materials.",
    images: [
      "https://source.unsplash.com/random/800x800/?toy,art",
      "https://source.unsplash.com/random/800x800/?designer,toy",
      "https://source.unsplash.com/random/800x800/?collectible",
      "https://source.unsplash.com/random/800x800/?artwork",
    ],
    details: {
      material: "Premium Vinyl",
      height: "12 inches",
      weight: "2.5 lbs",
      edition: "Limited Edition (100 pieces)",
      releaseDate: "2025-04-15"
    },
    seller: {
      id: 'seller1',
      name: "John Artist",
      rating: 4.8,
      sales: 156,
      joinedDate: "2024-01-15",
      avatar: "https://source.unsplash.com/random/100x100/?portrait"
    }
  };

  const handleContactSeller = () => {
    navigate(`/chat/${product.seller.id}`, { 
      state: { product }
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
              <p className="text-gray-400">by {product.artist}</p>
            </div>

            <div className="text-2xl font-bold text-blue-400">
              ${product.price.toFixed(2)}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
              <p className="text-gray-300">{product.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(product.details).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                    <dd className="text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <button
              onClick={handleContactSeller}
              className="w-full bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Contact Seller</span>
            </button>

            {/* Seller Information */}
            <div className="border-t border-gray-800 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">About the Seller</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={product.seller.avatar}
                  alt={product.seller.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-medium text-white">{product.seller.name}</h3>
                  <div className="flex items-center text-gray-400">
                    <span className="flex items-center">
                      {product.seller.rating}
                      <svg className="h-5 w-5 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                    <span className="mx-2">•</span>
                    <span>{product.seller.sales} sales</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Member since {new Date(product.seller.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;