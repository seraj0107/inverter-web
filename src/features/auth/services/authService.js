import { authEndpoints } from "../../../api/endpoints/auth.js";

function normalizeAuthError(error) {
    const response = error?.response;
    if (
        response?.status === 426 ||
        response?.data?.code === "VERSION_MISMATCH"
    ) {
        const mismatch = new Error(
            response.data.message ||
                "This app version is outdated. Please update to continue.",
        );
        mismatch.isVersionMismatch = true;
        return mismatch;
    }
    return error;
}

async function request(call) {
    try {
        const { data } = await call();
        return data;
    } catch (error) {
        throw normalizeAuthError(error);
    }
}

function normalizeLoginResponse(response) {
    const rawToken = response?.token;
    const token =
        typeof rawToken === "string" && rawToken.startsWith("Bearer ")
            ? rawToken.slice(7)
            : rawToken;

    return {
        token,
        user: response?.data ?? response?.user ?? null,
        response,
    };
}

export const authService = {
    login: (credentials) => request(() => authEndpoints.login(credentials)),
    loginWithPassword: async (account, password, version) => {
        const response = await request(() =>
            authEndpoints.login({ account, password, version_number: version }),
        );
        return normalizeLoginResponse(response);
    },
    sendLoginOtp: (phone, version) =>
        request(() =>
            authEndpoints.sendOtp({ phone, version_number: version }),
        ),
    loginWithOtp: async (phone, code, version) => {
        const response = await request(() =>
            authEndpoints.verifyOtp({ phone, code, version_number: version }),
        );
        return normalizeLoginResponse(response);
    },
    getCurrentUser: () => request(() => authEndpoints.me()),
    logout: () => request(() => authEndpoints.logout()),
};
