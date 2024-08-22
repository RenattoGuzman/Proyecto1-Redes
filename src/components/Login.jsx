import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Strophe } from 'strophe.js';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const logo = '/Logo.svg';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const conn = new Strophe.Connection('ws://alumchat.lol:7070/ws/');

    conn.connect(username + '@alumchat.lol', password, (status) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log('Strophe is connected.');
        onLogin(conn);  // Pasar la conexión al componente padre
      } else if (status === Strophe.Status.AUTHFAIL) {
        setError('Authentication failed');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <div className='flex items-center mb-4'>
          <h1 className="text-4xl font-bold mr-2">NetChat</h1>
          <img src={logo} alt="NetChat Logo" className="w-14 h-14" />  
        </div>
        <h2 className="text-2xl font-bold mb-4">por Renatto Guzmán</h2>
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 block h-7 w-full rounded-md border-blue-300 shadow-md"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block h-7 w-full rounded-md border-blue-300 shadow-md"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;