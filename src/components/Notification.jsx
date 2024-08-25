import React, { useState, useEffect } from 'react';

const Notification = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const audio = new Audio('/noti_sound.mp3');
    audio.play();

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'message' ? 'bg-blue-500' : type === 'invitation' ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded shadow-lg`}>
      {message}
    </div>
  );
};

export default Notification;