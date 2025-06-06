import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      
      // Update axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user info
      const fetchUser = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/auth/me');
          setUser(res.data.user);
          navigate('/marketplace'); // Redirect to marketplace after successful auth
        } catch (error) {
          console.error('Error fetching user:', error);
          navigate('/login'); // Redirect to login if there's an error
        }
      };

      fetchUser();
    } else {
      navigate('/login');
    }
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">
        Processing authentication...
      </div>
    </div>
  );
};

export default OAuthCallback;