import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Profile from './pages/profile/Profile';
import Seller from './pages/profile/Seller';
import ProductList from './pages/marketplace/ProductList';
import ProductDetail from './pages/marketplace/ProductDetail';
import PostProduct from './pages/marketplace/PostProduct';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OAuthCallback from './pages/auth/OAuthCallback';
import AdminBrands from './pages/admin/AdminBrands';
import AdminProducts from './pages/admin/AdminProduct';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLayout from './components/layout/AdminLayout';
import AdminTags from './pages/admin/AdminTags';
import ProductEdit from './pages/marketplace/ProductEdit';
import AdminReport from './pages/admin/AdminReport';
import AdminReport2 from './pages/admin/AdminReport2';
import './App.css';
function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/products/edit/:slug" element={<ProductEdit />} />
              <Route path="/profile/:username" element={<Seller />} />
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
              {/* <Route 
                path="/chat/:sellerId" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              /> */}

              <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route path="users" element={<AdminUsers />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="tags" element={<AdminTags />} />
                <Route path="reports" element={<AdminReport />} />
                <Route path="reports2" element={<AdminReport2 />} />

              </Route>
            </Routes>
          </Layout>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
