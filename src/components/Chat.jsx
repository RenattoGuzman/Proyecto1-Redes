import React, { useState } from 'react';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, sender: 'user' }]);
      setNewMessage('');
      // Simulate a response (replace with actual chat logic)
      setTimeout(() => {
        setMessages(prev => [...prev, { text: 'This is a response', sender: 'bot' }]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="bg-white p-4">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-l-lg p-2"
            placeholder="Type a message..."
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-lg">Send</button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
