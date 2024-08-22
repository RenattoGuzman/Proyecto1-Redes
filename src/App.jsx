import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import Chat1 from './components/Chat1';

import { Buffer } from 'buffer';
window.Buffer = Buffer;
const App = () => {
  const [connection, setConnection] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (conn) => {
    console.log('conn ==>> ', conn);
    setConnection(conn);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setConnection(null);
    setIsAuthenticated(false);
  };

  console.log('connection ==>> ', connection);


  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/chat" /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/chat" 
          element={
            isAuthenticated ? 
            <Chat connection={connection} onLogout={handleLogout} /> : 
            <Navigate to="/login" />

          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};


export default App;
