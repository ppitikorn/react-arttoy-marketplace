// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import './App.css';

// ------- Lazy pages --------
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));

const Profile = lazy(() => import('./pages/profile/Profile'));
const Seller = lazy(() => import('./pages/profile/Seller'));

const ProductList = lazy(() => import('./pages/marketplace/ProductList'));
const ProductDetail = lazy(() => import('./pages/marketplace/ProductDetail'));
const PostProduct = lazy(() => import('./pages/marketplace/PostProduct'));
const ProductEdit = lazy(() => import('./pages/marketplace/ProductEdit'));

const ChatPlayground = lazy(() => import('./pages/chat/ChatPlayground'));

// Admin area
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProduct'));
const AdminTags = lazy(() => import('./pages/admin/AdminTags'));
const AdminReport = lazy(() => import('./pages/admin/AdminReport'));
const AdminReport2 = lazy(() => import('./pages/admin/AdminReport2'));
const AdminReport3 = lazy(() => import('./pages/admin/AdminReport3'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Layout>
            <Suspense fallback={<div className="p-4">Loading…</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />

                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:slug" element={<ProductDetail />} />

                <Route path="/profile/:username" element={<Seller />} />
                <Route
                  path="/products/edit/:slug"
                  element={
                    <ProtectedRoute>
                      <ProductEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-product"
                  element={
                    <ProtectedRoute>
                      <PostProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPlayground />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRole="admin">
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="brands" element={<AdminBrands />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="tags" element={<AdminTags />} />
                  <Route path="reports" element={<AdminReport />} />
                  <Route path="reports2" element={<AdminReport2 />} />
                  <Route path="reports3" element={<AdminReport3 />} />
                </Route>
              </Routes>
            </Suspense>
          </Layout>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
