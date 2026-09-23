import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // The session is an httpOnly cookie, so the browser only attaches it when
  // the request is explicitly credentialed. There is no Authorization header
  // to set -- and nothing in localStorage for an XSS payload to steal.
  withCredentials: true,
});

// A 401 from these is the expected answer to bad credentials, not an expired
// session, so they must not trigger the redirect below.
const AUTH_ATTEMPT_PATHS = ["/api/auth/login", "/api/auth/register"];

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const isAuthAttempt = AUTH_ATTEMPT_PATHS.some((path) => requestUrl.includes(path));

    if (status === 401 && !isAuthAttempt) {
      // The session expired or was revoked while the tab was open. Without
      // this the page keeps rendering a signed-in shell that silently returns
      // nothing; a reload lands on /login with a clean AuthContext.
      const { pathname } = window.location;
      if (pathname !== "/login" && pathname !== "/signup") {
        window.location.assign("/login");
      }
    } else if (status === 500) {
      console.error("Server error. Please try again later.");
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
