import axios from 'axios';

// Centralized Axios Instance
// Connects React frontend to Express backend API
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API;
