import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, MessageSquare, LogOut } from 'lucide-react';
import { Strophe, $pres, $msg } from 'strophe.js';

const Chat = ({ connection, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState(['Family', 'Work']);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newContact, setNewContact] = useState('');
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => {
    if (connection) {
      console.log('connection ==>> ', connection);
      connection.addHandler(onMessage, null, 'message', 'chat');
    }
  }, [connection]);

  
  const onMessage = (msg) => {
    const from = msg.getAttribute('from');
    const type = msg.getAttribute('type');
    const body = msg.getElementsByTagName('body')[0];

    if (type === "chat" && body) {
      const messageText = body.textContent;
      setMessages(prev => [...prev, { text: messageText, sender: 'bot', chat: Strophe.getBareJidFromJid(from) }]);
    }

    return true;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat) {
      const message = $msg({to: selectedChat, type: 'chat'})
        .c('body')
        .t(newMessage);
      
      connection.send(message);

      setMessages([...messages, { text: newMessage, sender: 'user', chat: selectedChat }]);
      setNewMessage('');
    }
  };  

  const handleAddContact = (e) => {
    e.preventDefault();
    if (newContact.trim() && !contacts.includes(newContact)) {
      // Send subscription request
      const presence = $pres({to: newContact + "@alumchat.lol", type: "subscribe"});
      connection.send(presence);

      setContacts([...contacts, newContact]);
      setNewContact('');
      setShowAddContact(false);
    }
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (newGroup.trim() && !groups.includes(newGroup)) {
      setGroups([...groups, newGroup]);
      setNewGroup('');
      setShowCreateGroup(false);
    }
  };

  const handleLogout = () => {
    if (connection) {
      connection.disconnect();
    }
    onLogout();
  };


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Chats</h2>
          <button 
            onClick={() => setShowAddContact(true)} 
            className="flex items-center text-blue-500 mb-2"
          >
            <PlusCircle size={18} className="mr-2" /> Add Contact
          </button>
          <button 
            onClick={() => setShowCreateGroup(true)} 
            className="flex items-center text-blue-500 mb-2"
          >
            <Users size={18} className="mr-2" /> Create Group
          </button>
          



        </div>
        <div className="px-4 pb-4">
          <h3 className="font-medium mb-2">Contacts</h3>
          {contacts.map((contact, index) => (
            <div 
              key={index} 
              className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => setSelectedChat(contact + "@alumchat.lol")}
            >
              <MessageSquare size={18} className="mr-2 text-gray-500" />
              {contact}
            </div>
          ))}
          <h3 className="font-medium mb-2 mt-4">Groups</h3>
          {groups.map((group, index) => (
            <div 
              key={index} 
              className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => setSelectedChat(group)}
            >
              <Users size={18} className="mr-2 text-gray-500" />
              {group}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 w-full p-4">
        <button 
            onClick={handleLogout} 
            className="flex items-center text-red-500"
          >
            <LogOut size={18} className="mr-2" /> Logout
          </button>
        </div>

      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="bg-white p-4 border-b">
              <h2 className="text-xl font-semibold">{selectedChat}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages
                .filter(message => message.chat === selectedChat)
                .map((message, index) => (
                  <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
            <form onSubmit={handleAddContact}>
              <input
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="border rounded p-2 mb-4 w-full"
                placeholder="Contact name"
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowAddContact(false)} className="mr-2 px-4 py-2 text-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="border rounded p-2 mb-4 w-full"
                placeholder="Group name"
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="mr-2 px-4 py-2 text-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;