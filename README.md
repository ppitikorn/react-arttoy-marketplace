# 🧸 Arttoy Marketplace

Welcome to Arttoy Marketplace - Your One-Stop Platform for Art Toys and Collectibles!

## 📖 About
An innovative web platform designed for art toy enthusiasts to buy, sell, and trade collectibles. Built with modern web technologies for optimal performance and user experience.

## 🛠️ Technology Stack
### Frontend
- **React + Vite** - For a lightning-fast development experience and optimized production builds
- **Context API** - Efficient state management across components
- **React Router** - Seamless navigation and routing
- **Responsive CSS** - Mobile-first design approach

### Backend
- **Node.js & Express.js** - Robust server-side architecture
- **MongoDB with Mongoose** - Flexible and scalable database solution
- **JWT & Passport.js** - Secure authentication system
- **Cloudinary** - Cloud-based image management

## ⭐ Key Features
- **Secure Authentication**
  - JWT-based authentication
  - OAuth support for social login
  - Protected routes and user sessions

- **Marketplace Functions**
  - Advanced product search and filtering
  - Real-time chat between users
  - Secure transaction handling
  - Image upload and management

- **User Experience**
  - Personalized user profiles
  - Activity tracking
  - Responsive design for all devices
  - Brand and tag filtering system

- **Admin Controls**
  - Comprehensive dashboard
  - User management
  - Product oversight
  - Brand and tag management

## 🚀 Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ppitikorn/react-arttoy-marketplace.git
   cd react-arttoy-marketplace
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a .env file with necessary configurations:
   - Database connection
   - JWT secret
   - OAuth credentials
   - Cloudinary settings

4. **Run the Application**
   ```bash
   npm run dev    # Development mode
   npm run build  # Production build
   ```

## 📡 API Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `GET /api/auth/oauth/callback` - OAuth processing

### Products
- `GET /api/products` - Browse all products
- `GET /api/products/:id` - View specific product
- `POST /api/products` - List new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Remove product

### User Management
- `GET /api/profile` - View profile
- `PUT /api/profile` - Update profile

### Administrative
- `GET /api/admin/users` - User management
- `GET /api/admin/brands` - Brand management
- `GET /api/admin/tags` - Tag management
- `GET /api/admin/products` - Product management

### Categories
- `GET /api/brands` - List all brands
- `GET /api/tags` - List all tags

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.