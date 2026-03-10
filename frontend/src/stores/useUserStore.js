import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,
	mfaRequired: false,
	mfaTicket: "",

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			set({ user: res.data, loading: false, mfaRequired: false, mfaTicket: "" });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });
			if (res.data?.mfaRequired) {
				set({
					loading: false,
					mfaRequired: true,
					mfaTicket: res.data.mfaTicket || "",
					user: null,
				});
				return { mfaRequired: true };
			}

			set({ user: res.data, loading: false, mfaRequired: false, mfaTicket: "" });
			return { mfaRequired: false };
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
			return { mfaRequired: false, error: true };
		}
	},

	verifyMfaLogin: async (token) => {
		set({ loading: true });
		try {
			const mfaTicket = get().mfaTicket;
			const res = await axios.post("/auth/login-mfa", { mfaTicket, token });
			set({
				user: res.data,
				loading: false,
				mfaRequired: false,
				mfaTicket: "",
			});
			return { success: true };
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Invalid MFA code");
			return { success: false };
		}
	},

	cancelMfaChallenge: () => {
		set({ mfaRequired: false, mfaTicket: "", loading: false });
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null, mfaRequired: false, mfaTicket: "" });
			if (window.location.pathname !== "/login") {
				window.location.assign("/login");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false, mfaRequired: false, mfaTicket: "" });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null, mfaRequired: false, mfaTicket: "" });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
