import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);

  const startChat = (sellerId, productId) => {
    const chatId = `${sellerId}_${productId}`;
    if (!chats[chatId]) {
      setChats(prev => ({
        ...prev,
        [chatId]: {
          messages: [],
          sellerId,
          productId,
          lastUpdated: new Date()
        }
      }));
    }
    setActiveChatId(chatId);
  };

  const sendMessage = (chatId, message) => {
    setChats(prev => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        messages: [...prev[chatId].messages, message],
        lastUpdated: new Date()
      }
    }));
  };

  return (
    <ChatContext.Provider value={{ chats, activeChatId, startChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};