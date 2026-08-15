import { useState } from 'react';
import API from '../../api/axios';

const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file) => {
    if (!file) return '';
    setUploading(true);
    setError('');
    const token = localStorage.getItem('homechef_token');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await API.post('/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed.');
      return '';
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};

export default useImageUpload;
