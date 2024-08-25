import React, { useState, useEffect, useCallback, useRef} from 'react';
import { PlusCircle, Users, MessageSquare, LogOut, ChevronDown } from 'lucide-react';
import { Strophe, $pres, $msg, $iq  } from 'strophe.js';

const Chat = ({ connection, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  //const [groups, setGroups] = useState(['Family', 'Work']);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newContact, setNewContact] = useState('');
  const [newGroup, setNewGroup] = useState('');

  // Store the handler references
  const groupMessageHandlerRef = useRef(null);
  const messageHandlerRef = useRef(null);
  const presenceHandlerRef = useRef(null);

  // User presence
  const [userPresence, setUserPresence] = useState('available');
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);

  // Contact details
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [selectedContactDetails, setSelectedContactDetails] = useState(null);

  const fetchContactDetails = useCallback((jid) => {
    const contact = contacts.find(c => c.jid === jid);

    if (contact) {
      setSelectedContactDetails({
        jid: contact.jid,
        name: contact.name,
        status: contact.status,
        statusMessage: contact.statusMessage
      });
      setShowContactDetails(true);
    } else {
      const group = groups.find(g => g.jid === jid);
      if (group) {
        setSelectedContactDetails({
          jid: group.jid,
          name: group.name
        });
        setShowContactDetails(true);
      } else {
        console.error('Contact not found in roster');
      }
    }
  }, [contacts, groups]);
  
  
  const changeUserPresence = (newPresence) => {
    setUserPresence(newPresence);
    setShowPresenceMenu(false);

    if (connection) {
      let pres;
      if (newPresence === 'available') {
        pres = $pres();
      } else if (newPresence === 'offline') {
        pres = $pres({type: 'unavailable'});
      } else {
        pres = $pres().c('show').t(newPresence).up();
      }
      connection.send(pres);
    }
  };


  const presenceColors = {
    'available': 'bg-green-500',
    'away': 'bg-yellow-500',
    'dnd': 'bg-red-500',
    'xa': 'bg-orange-500',
    'offline': 'bg-gray-500'
  };

  const presenceLabels = {
    'available': 'Disponible',
    'away': 'Ausente',
    'dnd': 'No Disponible',
    'xa': 'Ocupado',
    'offline': 'Desconectado'
  };

  const fetchGroups = useCallback(() => {
    if (connection) {
      const iq = $iq({type: 'get'})
        .c('query', {xmlns: 'jabber:iq:private'})
        .c('storage', {xmlns: 'storage:bookmarks'});
      
      connection.sendIQ(iq, (iqResult) => {
        const conferences = iqResult.getElementsByTagName('conference');
        const groupList = Array.from(conferences).map(conf => ({
          jid: conf.getAttribute('jid'),
          name: conf.getAttribute('name') || Strophe.getNodeFromJid(conf.getAttribute('jid'))
        }));
  
        setGroups(groupList);
      }, (error) => {
        console.error('Error fetching groups:', error);
      });
    }
  }, [connection]);  
  
  
  

  const fetchRoster = useCallback(() => {
    if (connection) {
      const iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
      
      connection.sendIQ(iq, (iqResult) => {
        const items = iqResult.getElementsByTagName('item');
        const rosterContacts = Array.from(items).map(item => ({
          jid: item.getAttribute('jid'),
          name: item.getAttribute('name') || Strophe.getNodeFromJid(item.getAttribute('jid')),
          status: 'offline'
        }));

        rosterContacts.forEach(contact => {
          connection.send($pres({ to: contact.jid, type: 'probe' }));
        });
        
        setContacts(rosterContacts);
  
      }, (error) => {
        console.error('Error fetching roster:', error);
      });
    }
  }, [connection]);

  const joinRoom = useCallback((roomJid) => {
    if (connection) {
      const nick = Strophe.getNodeFromJid(connection.jid);
      const presence = $pres({to: `${roomJid}/${nick}`})
        .c('x', {xmlns: 'http://jabber.org/protocol/muc'});
      connection.send(presence);
    }
  }, [connection]);

  const onPresence = useCallback((presence) => {
    const from = presence.getAttribute('from');
    const type = presence.getAttribute('type');
    const show = presence.getElementsByTagName('show')[0]?.textContent;
    const bareJid = Strophe.getBareJidFromJid(from);
    const statusElement = presence.getElementsByTagName('status')[0];
    const statusMessage = statusElement ? statusElement.textContent : '';

    let status;
    if (type === 'unavailable') {
      status = 'offline';
    } else if (show) {
      status = show;
    } else {
      status = 'available';
    }

    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.jid === bareJid
          ? { ...contact, status, statusMessage }
          : contact
      )
    );

  
    return true;
  }, []);

  
  const onMessage = useCallback((msg) => {
    const from = msg.getAttribute('from');
    const type = msg.getAttribute('type');
    const body = msg.getElementsByTagName('body')[0];
  
    if ((type === "chat" || type === "groupchat") && body) {
      const messageText = body.textContent;
      const fromJid = type === "groupchat" ? Strophe.getBareJidFromJid(from) : from;
      const senderNick = type === "groupchat" ? Strophe.getResourceFromJid(from) : null;
  
      setMessages(prev => {
        const isDuplicate = prev.some(m => 
          m.text === messageText && 
          m.sender === (type === "groupchat" ? senderNick : 'bot') && 
          m.chat === Strophe.getBareJidFromJid(fromJid)
        );
        if (!isDuplicate) {
          return [...prev, { 
            text: messageText, 
            sender: type === "groupchat" ? senderNick : 'bot', 
            chat: Strophe.getBareJidFromJid(fromJid)
          }];
        }
        return prev;
      });
    }
  
    return true;
  }, []);
  
  
  useEffect(() => {
    if (connection) {
      console.log('Setting up message handler and presence handlers, fetching roster, and groups');
      
      // Remove the previous handler if it exists
      if (messageHandlerRef.current) {
        connection.deleteHandler(messageHandlerRef.current);
      }
      

      // Add the new handler and store its reference
      messageHandlerRef.current = connection.addHandler(onMessage, null, 'message', 'chat');
      groupMessageHandlerRef.current = connection.addHandler(onMessage, null, 'message', 'groupchat');
      presenceHandlerRef.current = connection.addHandler(onPresence, null, 'presence');
      
      connection.send($pres());

      fetchRoster();
      fetchGroups();
    }

    return () => {
      if (connection) {
        if (messageHandlerRef.current) {
          connection.deleteHandler(messageHandlerRef.current);
        }
        if (groupMessageHandlerRef.current) {
          connection.deleteHandler(groupMessageHandlerRef.current);
        }
        if (presenceHandlerRef.current) {
          connection.deleteHandler(presenceHandlerRef.current);
        }
      }
    };
  }, [connection, onMessage,onPresence, fetchRoster, fetchGroups]);


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat) {
      let message;
      if (groups.some(group => group.jid === selectedChat)) {
        // Mensaje de grupo
        message = $msg({to: selectedChat, type: 'groupchat'})
        .c('body')
        .t(newMessage);
        //console.log('message de Grupo==>> ', message);
      } else {
        // Mensaje individual
        message = $msg({to: selectedChat, type: 'chat'})
          .c('body')
          .t(newMessage);
        //console.log('message ==>> ', message);
      }
      
      connection.send(message);
      
      // Solo añadimos el mensaje a la UI para mensajes individuales
      // Para grupos, esperamos a que el servidor nos lo devuelva
      if (!groups.some(group => group.jid === selectedChat)) {
        setMessages(prev => [...prev, { text: newMessage, sender: 'user', chat: selectedChat }]);
      }
      setNewMessage('');
    }
  };
  


  const handleAddContact = (e) => {
    e.preventDefault();
    if (newContact.trim() && !contacts.includes(newContact)) {
      const jid = `${newContact}@alumchat.lol`;
  
      // Send a subscription request
      const presenceSubscribe = $pres({to: jid, type: 'subscribe'});
      connection.send(presenceSubscribe);
  
      // Update the UI
      setContacts([...contacts, newContact]);
      setNewContact('');
      setShowAddContact(false);
  
      console.log(`Subscription request sent to ${jid}`);
    }
  };
  
  // Handle incoming presence stanzas
  connection.addHandler((presence) => {
    const from = presence.getAttribute('from');
    const type = presence.getAttribute('type');
    
    // const now = new Date();
    // console.log('Current time:', now);
    // console.log(`Received presence: ${type} from ${from}`);


  
    if (type === 'subscribed') {
      console.log(`${from} accepted your subscription request`);
      // You might want to update your UI here
    } else if (type === 'error') {
      console.log(`Error in subscription with ${from}`);
      // Handle the error (e.g., show a message to the user)
    }
  
    return true;
  }, null, 'presence');
  


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

    changeUserPresence('offline');
    onLogout();
  };

  const handleChatSelection = (jid) => {
    setSelectedChat(jid);
    if (groups.some(group => group.jid === jid)) {
      joinRoom(jid);
    }
  };
  
  // Code for the ContactDetailsModal component

  const ContactDetailsModal = ({ contact, onClose }) => {
    if (!contact) return null;
    const tempStatus = contact.status;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          <strong>
            {contact.name || 'no-name'}  
          </strong>
          </h3>
        {contact.jid && <p><strong>JID:</strong> {contact.jid}</p>}
        {contact.status && <p><strong>Status:</strong> {presenceLabels[tempStatus]}</p>}
        {contact.statusMessage && <p><strong>Message:</strong> {contact.statusMessage}</p>}
        <div className="flex justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">Close</button>
        </div>
      </div>
      </div>
    );
  };
  
  

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">

      <div className="p-4 border-b relative">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => setShowPresenceMenu(!showPresenceMenu)}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${presenceColors[userPresence]}`}></div>
            <span className="flex-grow">{presenceLabels[userPresence]}</span>
            <ChevronDown size={18} />
          </div>
          {showPresenceMenu && (
            <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10">
              {Object.entries(presenceLabels).map(([key, label]) => (
                <div 
                  key={key}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => changeUserPresence(key)}
                >
                  <div className={`w-3 h-3 rounded-full mr-2 ${presenceColors[key]}`}></div>
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">NetChat</h2>
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
              onClick={() => handleChatSelection(contact.jid)}
            >
              <div 
                className={`w-2 h-2 rounded-full mr-2 ${presenceColors[contact.status] || 'bg-gray-500'}`} 
                title={presenceLabels[contact.status] || 'Desconocido'}
              ></div>
              <MessageSquare size={18} className="mr-2 text-gray-500" />
              {contact.name}
            </div>
          ))}
          <h3 className="font-medium mb-2 mt-4">Groups</h3>
          {groups.map((group, index) => (
            <div 
              key={index} 
              className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => handleChatSelection(group.jid)}
            >
              <Users size={18} className="mr-2 text-gray-500" />
              {group.name}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 p-4">
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
              <h2 className="text-xl font-semibold">
                {selectedChat}    
                {selectedChat && selectedChat.includes('@') && (
                    <span 
                      className="ml-2 text-sm text-blue-500 cursor-pointer"
                      onClick={() => fetchContactDetails(selectedChat)}
                    >
                      (View Details)
                    </span>
                  )}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages
                .filter(message => message.chat === selectedChat)
                .map((message, index) => (
                  <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                      {groups.some(group => group.jid === selectedChat) && message.sender !== 'user' && (
                        <span className="font-bold">{message.sender}: </span>
                      )}
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

      {showContactDetails && (
        <ContactDetailsModal
          contact={selectedContactDetails}
          onClose={() => setShowContactDetails(false)}
        />
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