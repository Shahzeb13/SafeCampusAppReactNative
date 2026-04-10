import axios from 'axios';
import { API_BASE_URL } from '../config/api';
// We'll use a variable to store the token for interceptors
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    // 1. Authenticate the request
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // 2. Fix: For multipart/FormData, we MUST NOT have a hardcoded Content-Type 
    // especially for urleconded fallback bugs. 
    // React Native FormData has a '_parts' property.
    // if (config.data && (config.data instanceof FormData || config.data._parts)) {
    //   // Deleting it lets Axios (and the browser/native layer) 
    //   // automatically generate the correct boundary string.
    //   delete config.headers['Content-Type'];
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
