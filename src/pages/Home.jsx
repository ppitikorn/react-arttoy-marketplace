import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative min-h-[60vh] flex items-center bg-cover bg-center bg-no-repeat" 
           style={{ backgroundImage: 'url(https://source.unsplash.com/random/?toys)'}}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
          <h1 className="text-5xl font-bold mb-4">
            Welcome to Arttoy Marketplace
          </h1>
          <p className="text-xl mb-8">
            Discover unique art toys from creators around the world
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Unique Collections
            </h2>
            <p className="text-gray-300">
              Explore one-of-a-kind art toys created by talented artists worldwide.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Secure Transactions
            </h2>
            <p className="text-gray-300">
              Buy and sell with confidence using our secure payment system.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Artist Community
            </h2>
            <p className="text-gray-300">
              Join a vibrant community of art toy creators and collectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;