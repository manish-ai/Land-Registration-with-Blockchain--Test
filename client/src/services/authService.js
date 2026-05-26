const GOV_API = 'http://localhost:4002/api';
const AUTH_KEY = 'landregistry_auth';

export const getSession = () => {
    const data = sessionStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
};

export const setSession = (data) => {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(data));
};

export const clearSession = () => {
    sessionStorage.removeItem(AUTH_KEY);
};

export const isLoggedIn = () => !!getSession();

export const getWalletAddress = () => {
    const s = getSession();
    return s ? s.walletAddress : null;
};

export const getRole = () => {
    const s = getSession();
    return s ? s.role : null;
};

export const getName = () => {
    const s = getSession();
    return s ? s.name : null;
};

export const sendOtp = async (identifier, type) => {
    try {
        const res = await fetch(`${GOV_API}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, type }),
        });
        return await res.json();
    } catch (err) {
        return { error: 'Government auth service unavailable. Is the Gov Portal running on port 4002?' };
    }
};

export const verifyOtp = async (identifier, type, otp) => {
    try {
        const res = await fetch(`${GOV_API}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, type, otp }),
        });
        const data = await res.json();
        if (data.success) {
            setSession({ token: data.token, walletAddress: data.walletAddress, role: data.role, name: data.name });
        }
        return data;
    } catch (err) {
        return { error: 'Government auth service unavailable. Is the Gov Portal running on port 4002?' };
    }
};

export const logout = async () => {
    const s = getSession();
    if (s && s.token) {
        try {
            await fetch(`${GOV_API}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: s.token }),
            });
        } catch (_) {}
    }
    clearSession();
    window.location.href = '/';
};
