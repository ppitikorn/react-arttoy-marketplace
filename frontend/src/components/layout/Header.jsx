import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { socket } = useChat();

  const handleLogout = () => {
    socket?.disconnect();
    logout();
  };

  return (

     <header className="bg-yellow-200 shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 ">
        <div className="flex justify-between h-16">
          <div className="flex items-center">      
              <Link to="/" className="ml-4 text-xl font-bold text-black hover:text-gray-800">
            <img 
                src="/src/assets/image-Photoroom.png" 
                className=" h-11 w-13 inline-block "
                alt="Arttoy Marketplace"
            />
              BP Art Toy
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/products" className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium" >
              Products
            </Link>
            <Link to="/chat" className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium" >
              Chat
            </Link>

            
            {user ? (
              <>
                <Link to="/post-product" className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">
                  Post Product
                </Link>
                <Link to={`/profile/${user?.username}`} className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">

                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-black hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;