import axios from "axios";
import * as SecureStore from "expo-secure-store";
// import {BACKEND_URL} from "@env";
// import {BACKEND_URL} from "../app.config.ts";
import Constants from "expo-constants";

const api = axios.create({
  baseURL: `${Constants.expoConfig.extra.BACKEND_URL}/api/`,
  timeout: 10000,
});

// // Attach token if it exists
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
