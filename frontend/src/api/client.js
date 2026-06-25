import axios from "axios";

// Vite exposes env vars prefixed with VITE_ on import.meta.env.
// Falls back to localhost:4000 (the Express backend's default port) in dev.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Normalize errors so callers always get a readable message and,
// when present, the structured validation `details` array from the backend.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message = data?.error || error.message || "Something went wrong.";
    const details = data?.details || [];
    return Promise.reject({ message, details, status: error.response?.status });
  }
);

export default client;
