# 🧸 Arttoy Marketplace

A modern web platform for **buying, selling, and trading art toys and collectibles**.  
Built with **React + Vite** for the frontend and **Node.js** for the backend API.

---

## 🚀 Features

- 🔐 User authentication with JWT and OAuth support  
- 💬 Real-time chat functionality between users  
- 🛍️ Product marketplace with advanced filtering and search  
- 🏷️ Brand and tag management system  
- 🛠️ Admin dashboard for platform management  
- 👤 User profiles and activity tracking  
- ☁️ Image upload and management via Cloudinary  
- 📱 Responsive design for all devices  

---

## 🧰 Tech Stack

### 🌐 Frontend

- React  
- Vite (for fast development and optimized builds)  
- Context API (state management)  
- React Router (navigation)  
- Modern CSS for responsive layout  

### 🖥️ Backend API

- Node.js  
- Express.js  
- MongoDB (via Mongoose)  
- JWT for authentication  
- Passport.js for OAuth  
- Cloudinary for image handling  

---

## 🔌 API Endpoints

### 🔑 Authentication

- `POST /api/auth/login` — User login  
- `POST /api/auth/register` — User registration  
- `GET /api/auth/oauth/callback` — OAuth callback handler  

### 🧸 Products

- `GET /api/products` — Get all products  
- `GET /api/products/:id` — Get specific product  
- `POST /api/products` — Create new product  
- `PUT /api/products/:id` — Update product  
- `DELETE /api/products/:id` — Delete product  

### 👤 Profile

- `GET /api/profile` — Get user profile  
- `PUT /api/profile` — Update user profile  

### 🛡️ Admin Routes

- `GET /api/admin/users` — Get all users  
- `GET /api/admin/brands` — Manage brands  
- `GET /api/admin/tags` — Manage tags  
- `GET /api/admin/products` — Manage products  

### 🏷️ Brands & Tags

- `GET /api/brands` — Get all brands  
- `GET /api/tags` — Get all tags  


git clone https://github.com/ppitikorn/react-arttoy

