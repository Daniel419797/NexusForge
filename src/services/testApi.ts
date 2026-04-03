import axios from "axios";

// NOTE: In production, always set these via environment variables.
// The fallback API key below is a development default — rotate it in the Reuse dashboard.
const TEST_API_URL =
  process.env.NEXT_PUBLIC_REUSE_TEST_API_URL ||
  "https://reuse-tnt4.onrender.com/api/v1/p/69e93f31-bce4-4fa3-baa3-e4ed4ba95307";
const API_KEY =
  process.env.NEXT_PUBLIC_REUSE_API_KEY ||
  "pk_yzwBhnYZf1RsT6D1h2x0w1XbSh0MJw4e1CzwEhDxec4";

const testApi = axios.create({
  baseURL: TEST_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
});

// Request interceptor: attach JWT if logged in via test site
testApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("test_accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const getTestApiUrl = () => TEST_API_URL;
export const getApiKey = () => API_KEY;

export default testApi;
