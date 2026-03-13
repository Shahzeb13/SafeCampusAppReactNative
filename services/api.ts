import axios from 'axios';
import { API_BASE_URL } from '../config/api';
// We'll use a variable to store the token for interceptors
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      // Also send in cookies if the backend specifically looks for it
      // though typically for mobile we use Headers.
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
