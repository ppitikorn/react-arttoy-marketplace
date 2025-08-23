// import { useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';
// import api from '../../utils/api';

// const OAuthCallback = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { setUser } = useAuth();

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const token = params.get('token');

//     if (token) {
//       // Store the token
//       localStorage.setItem('token', token);
      
//       // Update axios default headers
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
//       // Fetch user info
//       const fetchUser = async () => {
//         try {
//           const res = await api.get('/api/auth/me');
//           setUser(res.data.user);
//           navigate('/'); 
//         } catch (error) {
//           console.error('Error fetching user:', error);
//           navigate('/login'); // Redirect to login if there's an error
//         }
//       };

//       fetchUser();
//     } else {
//       navigate('/login');
//     }
//   }, [location, navigate, setUser]);

//   return (
//     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
//       <div className="text-white">
//         Processing authentication...
//       </div>
//     </div>
//   );
// };

// export default OAuthCallback;
// src/pages/auth/OAuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();   // ✅ ใช้ setToken จาก AuthContext

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // รองรับทั้ง ?token=... และกรณีที่ provider ส่ง #token=... มากับ hash
    const urlToken = params.get('token') || new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
    // รองรับ redirect กลับไป path เดิม: ?next=/chat
    const next = params.get('next') || '/';

    if (!urlToken) {
      navigate('/login', { replace: true });
      return;
    }

    // 1) เก็บ token ใน localStorage
    localStorage.setItem('token', urlToken);
    // 2) ตั้ง header ให้ axios instance ทันที (กันช่วงรอ effect)
    api.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;
    // 3) setToken -> กระตุ้น AuthContext ให้ fetch /api/auth/me และ ChatProvider จะสร้าง socket ใหม่
    setToken(urlToken);

    // 4) พาไปหน้า next ทันที (ไม่ต้องรอรีเฟรช)
    navigate(next, { replace: true });
  }, [location.search, navigate, setToken]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">กำลังยืนยันตัวตน…</div>
    </div>
  );
}
