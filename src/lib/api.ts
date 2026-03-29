import axios from "axios";

// Create an axios instance with default config
export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://real-estate-backend-blond.vercel.app/api",
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic to handle 401 if needed globally, but mostly handled in AuthContext
    }
    return Promise.reject(error);
  },
);
