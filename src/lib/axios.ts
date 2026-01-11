import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const axiosInstance = axios.create({
  baseURL: '/api', // Adjust if your API routes have a different base
});

// Add a request interceptor to include the Firebase ID token
axiosInstance.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Could not get Firebase ID token.', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
