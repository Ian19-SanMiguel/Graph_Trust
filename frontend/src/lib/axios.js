import axios from "axios";

const devApiBaseUrl = "http://localhost:5000/api";
const prodApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? devApiBaseUrl : prodApiBaseUrl,
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
