import axios from 'axios';

// Use relative /api URL in production so Vercel can proxy over HTTPS
const API = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://13.60.246.95:5000/api');


/* ================= AUTH ================= */
export const loginAPI = `${API}/auth/login`;
export const refreshAPI = `${API}/auth/refresh`;
export const logoutAPI = `${API}/auth/logout`;
export const logoutAllAPI = `${API}/auth/logout-all`;
export const registerStartAPI = `${API}/auth/register/start`;
export const registerVerifyAPI = `${API}/auth/register/verify`;
export const registerResendAPI = `${API}/auth/register/resend`;
export const forgotPasswordAPI = `${API}/auth/forgot-password`;
export const resetPasswordAPI = `${API}/auth/reset-password`;
export const verifyEmailAPI = `${API}/auth/verify-email`;
export const resendVerificationAPI = `${API}/auth/resend-verification`;

/* ================= USERS ================= */
export const addUserAPI = `${API}/users/add`;
export const getAllUsersAPI = `${API}/users/all`;
export const getUserByIdAPI = (id) => `${API}/users/${id}`;
export const editUserAPI = `${API}/users/edit`;
export const changeEmailRequestAPI = `${API}/users/change-email-request`;
export const changeEmailVerifyAPI = `${API}/users/change-email-verify`;
export const deleteUserAPI = `${API}/users/delete`;
export const reactivateUserAPI = `${API}/users/reactivate`;
export const hardDeleteUserAPI = `${API}/users/hard-delete`;

/* ================= JOBS ================= */
export const createJobAPI = `${API}/jobs/create`;
export const getAllJobsAPI = `${API}/jobs/all`;
export const getJobByIdAPI = (id) => `${API}/jobs/${id}`;
export const getJobsByUserAPI = (userId) => `${API}/jobs/user/${userId}`;
export const editJobAPI = `${API}/jobs/edit`;
export const cancelJobAPI = `${API}/jobs/cancel`;
export const deleteJobAPI = `${API}/jobs/delete`;
export const collectRequestAPI = `${API}/jobs/collect/request`;
export const collectVerifyAPI = `${API}/jobs/collect/verify`;

/* ================= PRICING ================= */
export const createPriceAPI = `${API}/pricing/create`;
export const getAllPricesAPI = `${API}/pricing/all`;
export const lookupPriceAPI = (size, type, side) =>
  `${API}/pricing/lookup?size=${size}&type=${type}&side=${side}`;
export const getPriceByIdAPI = (id) => `${API}/pricing/${id}`;
export const editPriceAPI = `${API}/pricing/edit`;
export const deletePriceAPI = `${API}/pricing/delete`;
export const seedPricesAPI = `${API}/pricing/seed`;

/* ================= PAYMENTS ================= */
export const createOrderAPI = `${API}/payments/create-order`;
export const verifyPaymentAPI = `${API}/payments/verify`;
export const markPaidAPI = `${API}/payments/mark-paid`;
export const markDuesPaidAPI = `${API}/payments/penalties/mark-paid`;
export const getPaymentByIdAPI = (id) => `${API}/payments/${id}`;
export const getPaymentByJobAPI = (jobId) => `${API}/payments/job/${jobId}`;
export const getPaymentsByUserAPI = (userId) => `${API}/payments/user/${userId}`;
export const webhookAPI = `${API}/payments/webhook`;

/* ================= FILES ================= */
export const uploadFileAPI = `${API}/files/upload`;

/* ================= CONFIG ================= */
export const getConfigAPI = `${API}/config`;
export const updateConfigAPI = `${API}/config`;
export const getPublicConfigAPI = `${API}/config/public`;

/* ================= PENALTIES ================= */
export const getAllPenaltiesAPI = `${API}/penalties/all`;
export const getUserPenaltiesAPI = (userId) => `${API}/penalties/user/${userId}`;
export const waivePenaltyAPI = `${API}/penalties/waive`;
export const createPenaltyOrderAPI = `${API}/payments/penalties/create-order`;


const api = axios.create({
    withCredentials: true, // send/receive the HttpOnly refresh-token cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Axios interceptor: attach the access token to every request ──
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Single-flight refresh: a 401 triggers one /auth/refresh call even if
// several requests fail concurrently; every caller awaits the same promise. ──
let refreshPromise = null;

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:sessionExpired'));
}

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = api
            .post(refreshAPI)
            .then((res) => {
                const token = res.data?.accessToken || res.data?.token;
                if (!token) throw new Error('No access token in refresh response');
                localStorage.setItem('token', token);
                return token;
            })
            .catch((err) => {
                clearSession();
                throw err;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

// ── Response interceptor: transparent 401 → refresh → retry-once ──
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url = originalRequest?.url || '';
        const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');

        if (status === 401 && !isAuthRoute && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                await refreshAccessToken();
                return api(originalRequest);
            } catch {
                // fall through — refresh failed, reject with the original error
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth Service ──
export const authService = {
    login: async (credentials) => {
        const response = await api.post(loginAPI, credentials);
        const data = response.data;
        const token = data?.accessToken || data?.token;
        if (token) {
            localStorage.setItem('token', token);
        }
        if (data?.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },
    refresh: async () => refreshAccessToken(),
    logout: async () => {
        try {
            const response = await api.post(logoutAPI);
            return response.data;
        } finally {
            clearSession();
        }
    },
    logoutAll: async () => {
        try {
            const response = await api.post(logoutAllAPI);
            return response.data;
        } finally {
            clearSession();
        }
    },
    registerStart: async ({ collegeId, name, phone, password }) => {
        const response = await api.post(registerStartAPI, { collegeId, name, phone, password });
        return response.data?.DATA ?? response.data;
    },
    registerVerify: async ({ collegeId, email, otp }) => {
        const response = await api.post(registerVerifyAPI, { collegeId, email, otp });
        const data = response.data;
        const token = data?.accessToken || data?.token;
        if (token) localStorage.setItem('token', token);
        if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },
    registerResend: async ({ collegeId, email }) => {
        const response = await api.post(registerResendAPI, { collegeId, email });
        return response.data?.DATA ?? response.data;
    },
    forgotPassword: async (email) => {
        const response = await api.post(forgotPasswordAPI, { email });
        return response.data;
    },
    resetPassword: async ({ token, password, confirmPassword }) => {
        const response = await api.post(resetPasswordAPI, {
            resetToken: token,
            newPassword: password,
            confirmPassword: confirmPassword,
        });
        return response.data;
    },
    verifyEmail: async ({ email, otp }) => {
        const response = await api.post(verifyEmailAPI, { email, otp });
        return response.data;
    },
    resendVerification: async (email) => {
        const response = await api.post(resendVerificationAPI, { email });
        return response.data;
    },
};

// ── User Service ──
export const userService = {
    add: async (userData) => {
        const response = await api.post(addUserAPI, userData);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get(getAllUsersAPI);
        return response.data;
    },
    getById: async (userId) => {
        const response = await api.get(getUserByIdAPI(userId));
        return response.data;
    },
    edit: async (userData) => {
        const response = await api.put(editUserAPI, userData);
        return response.data;
    },
    requestEmailChange: async ({ userId, newEmail }) => {
        const response = await api.post(changeEmailRequestAPI, { userId, newEmail });
        return response.data;
    },
    verifyEmailChange: async ({ userId, otp }) => {
        const response = await api.post(changeEmailVerifyAPI, { userId, otp });
        return response.data;
    },
    delete: async (userId) => {
        const response = await api.delete(deleteUserAPI, { data: { userId } });
        return response.data;
    },
    reactivate: async (userId) => {
        const response = await api.put(reactivateUserAPI, { userId });
        return response.data;
    },
    hardDelete: async (userId) => {
        const response = await api.delete(hardDeleteUserAPI, { data: { userId } });
        return response.data;
    },
};

// ── File Service ──
export const fileService = {
    upload: async (formData) => {
        const response = await api.post(uploadFileAPI, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// ── Job Service ──
export const jobService = {
    create: async (jobData) => {
        const response = await api.post(createJobAPI, jobData);
        return response.data;
    },
    getAll: async (params = {}) => {
        const response = await api.get(getAllJobsAPI, { params });
        return response.data;
    },
    getById: async (jobId) => {
        const response = await api.get(getJobByIdAPI(jobId));
        return response.data;
    },
    getByUser: async (userId, params = {}) => {
        const response = await api.get(getJobsByUserAPI(userId), { params });
        return response.data;
    },
    edit: async (jobData) => {
        const response = await api.put(editJobAPI, jobData);
        return response.data;
    },
    cancel: async (jobData) => {
        const response = await api.patch(cancelJobAPI, jobData);
        return response.data;
    },
    delete: async (jobData) => {
        const response = await api.delete(deleteJobAPI, { data: jobData });
        return response.data;
    },
    collectRequest: async ({ jobId }) => {
        const response = await api.post(collectRequestAPI, { jobId });
        return response.data;
    },
    collectVerify: async ({ jobId, otp }) => {
        const response = await api.post(collectVerifyAPI, { jobId, otp });
        return response.data;
    },
};

// ── Pricing Service ──
export const pricingService = {
    create: async (priceData) => {
        const response = await api.post(createPriceAPI, priceData);
        return response.data;
    },
    getAll: async (params = {}) => {
        const response = await api.get(getAllPricesAPI, { params });
        return response.data;
    },
    lookup: async ({ size, type, side }) => {
        const response = await api.get(lookupPriceAPI(size, type, side));
        return response.data;
    },
    getById: async (priceId) => {
        const response = await api.get(getPriceByIdAPI(priceId));
        return response.data;
    },
    edit: async (priceData) => {
        const response = await api.put(editPriceAPI, priceData);
        return response.data;
    },
    delete: async (priceId) => {
        const response = await api.delete(deletePriceAPI, { data: { priceId } });
        return response.data;
    },
    seed: async () => {
        const response = await api.post(seedPricesAPI);
        return response.data;
    },
};

// ── Payment Service ──
export const paymentService = {
    createOrder: async (orderData) => {
        const response = await api.post(createOrderAPI, orderData);
        return response.data;
    },
    createPenaltyOrder: async (userId) => {
        const response = await api.post(createPenaltyOrderAPI, { userId });
        return response.data;
    },
    verify: async (paymentData) => {
        const response = await api.post(verifyPaymentAPI, paymentData);
        return response.data;
    },
    markPaid: async (jobId) => {
        const response = await api.post(markPaidAPI, { jobId });
        return response.data;
    },
    markDuesPaid: async (userId) => {
        const response = await api.post(markDuesPaidAPI, { userId });
        return response.data;
    },
    getById: async (paymentId) => {
        const response = await api.get(getPaymentByIdAPI(paymentId));
        return response.data;
    },
    getByJob: async (jobId) => {
        const response = await api.get(getPaymentByJobAPI(jobId));
        return response.data;
    },
    getByUser: async (userId, params = {}) => {
        const response = await api.get(getPaymentsByUserAPI(userId), { params });
        return response.data;
    },
};

// ── Hardware Service ──
export const hardwareService = {
    // Locations
    createLocation: async (data) => (await api.post(`${API}/hardware/locations`, data)).data,
    getLocations: async () => (await api.get(`${API}/hardware/locations`)).data,
    deleteLocation: async (id) => (await api.delete(`${API}/hardware/locations/${id}`)).data,
    // Printers
    createPrinter: async (data) => (await api.post(`${API}/hardware/printers`, data)).data,
    getPrinters: async (locationId) => (await api.get(`${API}/hardware/printers/${locationId}`)).data,
    updatePrinterStatus: async (id, status) => (await api.put(`${API}/hardware/printers/${id}/status`, { status })).data,
    deletePrinter: async (id) => (await api.delete(`${API}/hardware/printers/${id}`)).data,
    // Stacks
    createStack: async (data) => (await api.post(`${API}/hardware/stacks`, data)).data,
    getStacks: async (locationId) => (await api.get(`${API}/hardware/stacks/${locationId}`)).data,
    updateStackStatus: async (id, status) => (await api.put(`${API}/hardware/stacks/${id}/status`, { status })).data,
    deleteStack: async (id) => (await api.delete(`${API}/hardware/stacks/${id}`)).data,
};

// ── System Service ──
export const systemService = {
    resetSystem: async () => {
        const response = await api.delete(`${API}/system/reset`);
        return response.data;
    }
};

// ── Config Service (business rules: penalty + scheduling) ──
export const configService = {
    get: async () => (await api.get(getConfigAPI)).data,
    getPublic: async () => (await api.get(getPublicConfigAPI)).data,
    update: async (updates) => (await api.put(updateConfigAPI, updates)).data,
};

// ── Penalty Service (auditable ledger) ──
export const penaltyService = {
    getAll: async (params = {}) => (await api.get(getAllPenaltiesAPI, { params })).data,
    getForUser: async (userId) => (await api.get(getUserPenaltiesAPI(userId))).data,
    waive: async (penaltyId, reason) => (await api.post(waivePenaltyAPI, { penaltyId, reason })).data,
};

export default api;
