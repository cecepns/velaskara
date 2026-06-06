import axios from "axios";

export const api = axios.create({
  baseURL: "https://api.kingcreativestudio.my.id/velaskara/api",
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("velaskara_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
