import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';

const ChatPage = () => {
  const { sellerId } = useParams();
  const location = useLocation();
  const { product } = location.state || {};
  const [message, setMessage] = useState('');
  const { chats, activeChatId, startChat, sendMessage } = useChat();
  
  useEffect(() => {
    if (product && sellerId) {
      startChat(sellerId, product.id);
    }
  }, [product, sellerId]);

  const currentChat = chats[activeChatId];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(activeChatId, {
      text: message,
      sender: 'user', // Replace with actual user ID
      timestamp: new Date()
    });
    setMessage('');
  };

  if (!currentChat || !product) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Product Context */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-lg font-semibold text-white">{product.name}</h2>
              <p className="text-gray-400">Price: ${product.price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Chat with {product.seller.name}</h3>
          </div>

          <div className="h-[calc(100vh-400px)] overflow-y-auto p-4 space-y-4">
            {currentChat.messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-xs opacity-75">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Message about ${product.name}...`}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;