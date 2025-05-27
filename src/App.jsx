import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Profile from './pages/profile/Profile';
import ProductList from './pages/marketplace/ProductList';
import ProductDetail from './pages/marketplace/ProductDetail';
import ChatPage from './pages/chat/ChatPage';
import PostProduct from './pages/marketplace/PostProduct';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OAuthCallback from './pages/auth/OAuthCallback';
import Admin from './pages/Admin';

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
              <Route path="/marketplace" element={<ProductList />} />
              <Route path="/marketplace/:id" element={<ProductDetail />} />
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
                path="/chat/:sellerId" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
                />
            </Routes>
          </Layout>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
