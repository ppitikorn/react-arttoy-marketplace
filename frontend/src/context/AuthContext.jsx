// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1) init token จาก localStorage ตั้งแต่แรก
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 2) เมื่อ token เปลี่ยน → set/clear header + fetchUser
  useEffect(() => {
    let alive = true;

    const applyHeader = (t) => {
      if (t) {
        api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    };

    const run = async () => {
      applyHeader(token);

      if (!token) {
        // ไม่มี token = สถานะ guest
        if (alive) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (alive) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        // token ใช้ไม่ได้ → ล้างทิ้ง
        localStorage.removeItem('token');
        applyHeader(null);
        if (alive) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token: t, user: u } = res.data;
      localStorage.setItem('token', t);
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;

      setToken(t);
      setUser(u);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid email or password',
      };
    }
  };

  const register = async (email, password) => {
    try {
      const username = email.split('@')[0];
      const res = await api.post('/api/auth/register', {
        email, password, username, name: username,
      });

      const { token: t, user: u } = res.data;

      localStorage.setItem('token', t);
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;

      setToken(t);
      setUser(u);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);        // <- กระตุ้นให้ ChatProvider ทำลาย socket ทันที
    navigate('/');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me'); // endpoint ที่ส่ง user ปัจจุบัน
      setUser(res.data?.user || null);
      console.log("User refreshed", res.data?.user);
    } catch (e) {
      console.error('refreshUser failed', e);
    }
  };

  const value = { user, loading, login, register, logout, setUser, token ,setToken, refreshUser};

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
