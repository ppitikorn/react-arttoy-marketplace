import { useState } from 'react';
import { useChat } from '../../context/ChatContext';

const Chat = ({ sellerId, productId, onClose }) => {
  const [message, setMessage] = useState('');
  const { chats, activeChatId, sendMessage } = useChat();
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

  if (!currentChat) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gray-800 rounded-lg shadow-xl z-50">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">Chat with Seller</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="h-96 p-4 overflow-y-auto space-y-4">
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
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;