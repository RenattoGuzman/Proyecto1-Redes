import React from 'react';

const ContactRequest = ({ from, onAccept, onReject }) => {
  return (
    <div className="fixed top-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
      <p className="mb-4">{from} quiere añadirte como contacto</p>
      <div className="flex justify-end space-x-2">
        <button 
          onClick={onReject}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Rechazar
        </button>
        <button 
          onClick={onAccept}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default ContactRequest;