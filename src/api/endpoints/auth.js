import client from "../client.js";

export const authEndpoints = {
    login: (credentials) => client.post("china/ch-login", credentials),
    sendOtp: (payload) => client.post("china/ch-send-otp", payload),
    verifyOtp: (payload) => client.post("china/ch-verify-otp", payload),
    logout: () => client.post("/auth/logout"),
    me: () => client.get("/auth/me"),
};
