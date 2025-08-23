import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function ChatButton({ userId }) {
    const navigate = useNavigate();
    const startChat =()=>{
      navigate(`/chat?peer=${userId}`); 
    }
    const { user } = useAuth();

    const handleChat = () => {
    if (!user) {
      alert('Please login to chat with the seller');
      navigate('/login');
      return;
    }
    startChat();

  };
  return (
    <>
      <button
            onClick={handleChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-300 text-yellow-800 rounded-lg font-medium border-2 border-yellow-800 hover:bg-yellow-400 hover:border-yellow-600 hover:scale-101 transition-transform"
            >
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
            </svg>
            <span>Chat</span>
            </button>
    </>
  )
}

export default ChatButton