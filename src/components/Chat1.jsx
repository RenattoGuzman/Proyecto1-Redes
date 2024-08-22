import React, { useEffect } from 'react';
import { Strophe, $msg } from 'strophe.js';

const Chat = ({ connection, onLogout }) => {

  useEffect(() => {
    // Función para manejar mensajes entrantes
    const onMessage = (msg) => {
      const from = msg.getAttribute('from');
      const body = msg.getElementsByTagName('body')[0];
      const messageText = body ? Strophe.getText(body) : '';
      console.log(`Mensaje recibido de ${from}: ${messageText}`);

      // Devolver 'true' para indicar que el mensaje fue manejado
      return true;
    };

    // Agregar el manejador de mensajes al conectar
    connection.addHandler(onMessage, null, 'message', 'chat');

    // Registrar presencia al conectar
    connection.send($pres().tree());

    // Cleanup al desmontar el componente
    return () => {
      connection.deleteHandler(onMessage);
    };
  }, [connection]);

  return (
    <div>
      <button onClick={onLogout}>Logout</button>
      <p>Conectado como: {connection.jid}</p>
    </div>
  );
};

export default Chat;
