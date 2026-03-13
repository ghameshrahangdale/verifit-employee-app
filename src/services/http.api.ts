import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URL
const BASE_URL = "http://192.168.1.3:3000/";
// const BASE_URL = "https://verifiit-nextjs.vercel.app/";

// Axios instance
const http = axios.create({
  baseURL: BASE_URL,
  // timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 * Add token automatically to every request
 */
http.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * Handle common API errors
 */
http.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          console.log("Unauthorized - Please login again");
          await AsyncStorage.removeItem("authToken");
          break;

        case 403:
          console.log("Forbidden request");
          break;

        case 500:
          console.log("Server error");
          break;

        default:
          console.log("API Error:", error.response.data?.message);
      }
    } else if (error.request) {
      console.log("No response from server");
    } else {
      console.log("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default http;