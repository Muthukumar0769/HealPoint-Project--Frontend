import axios from "axios";

//----Main axios instance for all API Request------
console.log("API URL:", import.meta.env.VITE_API_URL);

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

//----Separate axios instance for Refresh API request to avoid infinite loops------

const refreshAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token!);
  });
  failedQueue = [];
};

//-----Request Interceptors - Runs before every outgoing request-----

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && !config.url?.includes("/auth/logout")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//-------Response Interceptors --------

API.interceptors.response.use((response) => response,

  async (error) => {
    const originalRequest = error.config;
    const hadToken = !!localStorage.getItem("accessToken");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      hadToken &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/logout")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await refreshAPI.post("/auth/refresh");
        const newAccessToken = res.data?.accessToken;

        if (!newAccessToken) throw new Error("No access token returned");

        localStorage.setItem("accessToken", newAccessToken);
        API.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return API(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // ONLY logout if backend confirms refresh is invalid
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("authChanged"));

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

//----Separate export for Images----------

export const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

export default API;