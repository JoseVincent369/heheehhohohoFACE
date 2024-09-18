import React, { useState } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import './generalstyles.css'; // Ensure this file contains the CSS for the back button

const UploadImage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://your-cloud-function-url/uploadImageToImghippo', { // Update this URL
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.url; // Assuming Imghippo returns the image URL in this field
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(file);
      // You can then save this URL to Firestore or handle it as needed
      console.log('Image URL:', imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default UploadImage;
