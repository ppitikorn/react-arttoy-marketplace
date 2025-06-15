import React from 'react'
import { Link } from 'react-router-dom';

function ProductCard({ product , isSold = false }) {  
  return (
    <>
    {isSold ? (
        <div className="relative bg-gray-200 rounded-lg shadow-md overflow-hidden opacity-75 flex flex-col h-full">
          {/* Sold overlay */}
          <div className="absolute inset-0 bg-black/75 z-10 flex items-center justify-center">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg transform rotate-12 shadow-lg">
              SOLD
            </div>
          </div>
          {/* Image container with fixed height */}
          <div className="aspect-w-1 aspect-h-1">
              <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover grayscale"
              />
          </div>
          {/* Content container with flex layout to maintain consistent positioning */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Title with fixed height or min-height to ensure consistency */}
            <div className="min-h-[3.5rem]">
              <h3 className="text-lg font-semibold mb-2 text-left line-clamp-2 text-gray-600">{product.title}</h3>
            </div>
            
            {/* Seller info - no longer clickable for sold items */}
            <div className="flex items-center gap-2 mt-2 p-2">
              <img
                src={product.seller.avatar}
                alt={product.seller.name}
                className="w-6 h-6 rounded-full border border-gray-300 grayscale"
              />
              <span className="text-sm text-gray-400">{product.seller.name}</span>
              {product.seller.emailVerified && (
                <svg
                  className="w-4 h-4 text-gray-400"
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
            </div>
            
            {/* Push remaining content to bottom with flex-grow */}
            <div className="mt-auto pt-3">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 font-bold line-through">฿{product.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-400">{product.condition}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{product.category}</span>
                  <span className={`text-sm px-2 py-1 rounded opacity-60 ${
                      product.rarity === 'Limited' ? 'bg-red-100 text-red-600' :
                      product.rarity === 'Secret' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {product.rarity}
                    </span>
              </div>
            </div>
          </div>
        </div> 
      ) : (
        <Link
          key={product._id}
          to={`/products/${product.slug}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-transform transition-shadow duration-300 flex flex-col h-full"
        >
          {/* Image container with fixed height */}
          <div className="aspect-w-1 aspect-h-1">
              <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover"
              />
          </div>              
          {/* Content container with flex layout to maintain consistent positioning */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Title with fixed height or min-height to ensure consistency */}
            <div className="min-h-[3.5rem]">
              <h3 className="text-lg font-semibold mb-2 text-left line-clamp-2">{product.title}</h3>
            </div>
            
            {/* Seller info - always positioned after title */}
            <Link
              to={`/profile/${product.seller.username}`}
              className="flex items-center gap-2 mt-2 hover:bg-gray-300 transition-transform rounded-lg p-2"
              onClick={(e) => e.stopPropagation()}
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
            
            {/* Push remaining content to bottom with flex-grow */}
            <div className="mt-auto pt-3">
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
          </div>
        </Link> 
      )}    
    </>
  )
}

export default ProductCard