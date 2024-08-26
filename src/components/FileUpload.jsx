import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

const FileUpload = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Paperclip
        size={20}
        className="cursor-pointer text-gray-500 hover:text-gray-700"
        onClick={() => fileInputRef.current.click()}
      />
    </div>
  );
};

export default FileUpload;