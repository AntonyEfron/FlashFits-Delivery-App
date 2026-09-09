import axios from "axios";
import * as SecureStore from "expo-secure-store";
// import {BACKEND_URL} from "@env";
// import {BACKEND_URL} from "../app.config.ts";
import Constants from "expo-constants";

const BACKEND_URL =
  Constants.expoConfig?.extra?.BACKEND_URL ||
  Constants.manifest?.extra?.BACKEND_URL ||
  "http://192.168.29.230:5000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api/`,
  timeout: 10000,
});

// // Attach token if it exists
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Do not trigger token refresh for public / auth endpoints
    const isPublicEndpoint = originalRequest.url?.includes('auth/verify-otp') || 
                             originalRequest.url?.includes('auth/refresh') ||
                             originalRequest.url?.includes('/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error("No refresh token");

        const baseURL = `${BACKEND_URL}/api/`;
        const res = await axios.post(`${baseURL}deliveryRider/auth/refresh`, { refreshToken });
        
        const token = res.data?.token || res.data?.data?.token;
        const newRefreshToken = res.data?.refreshToken || res.data?.data?.refreshToken;

        if (token) {
          await SecureStore.setItemAsync('token', token);
          if (newRefreshToken) await SecureStore.setItemAsync('refreshToken', newRefreshToken);
          
          processQueue(null, token);
          isRefreshing = false;
          
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        } else {
          throw new Error("Invalid token refresh response");
        }
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
