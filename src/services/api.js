import axios from 'axios';

// Use relative /api URL in production so Vercel can proxy over HTTPS
const API = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://13.60.246.95:5000/api');

/* ================= AUTH ================= */
export const loginAPI = `${API}/auth/login`;
export const logoutAPI = `${API}/auth/logout`;
export const forgotPasswordAPI = `${API}/auth/forgot-password`;
export const resetPasswordAPI = `${API}/auth/reset-password`;

/* ================= USERS ================= */
export const addUserAPI = `${API}/users/add`;
export const getAllUsersAPI = `${API}/users/all`;
export const getUserByIdAPI = (id) => `${API}/users/${id}`;
export const editUserAPI = `${API}/users/edit`;
export const deleteUserAPI = `${API}/users/delete`;
export const reactivateUserAPI = `${API}/users/reactivate`;
export const hardDeleteUserAPI = `${API}/users/hard-delete`;

/* ================= FILE ================= */
export const uploadFileAPI = `${API}/files/upload`;

/* ================= JOBS ================= */
export const createJobAPI = `${API}/jobs/create`;
export const getAllJobsAPI = `${API}/jobs/all`;
export const getJobByIdAPI = (id) => `${API}/jobs/${id}`;
export const getJobsByUserAPI = (userId) => `${API}/jobs/user/${userId}`;
export const editJobAPI = `${API}/jobs/edit`;
export const cancelJobAPI = `${API}/jobs/cancel`;
export const deleteJobAPI = `${API}/jobs/delete`;

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
export const getPaymentByIdAPI = (id) => `${API}/payments/${id}`;
export const getPaymentByJobAPI = (jobId) => `${API}/payments/job/${jobId}`;
export const getPaymentsByUserAPI = (userId) => `${API}/payments/user/${userId}`;
export const webhookAPI = `${API}/payments/webhook`;


const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Axios interceptor: attach JWT token to every request ──
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auth Service ──
export const authService = {
    login: async (credentials) => {
        const response = await api.post(loginAPI, credentials);
        const data = response.data;
        if (data?.token) {
            localStorage.setItem('token', data.token);
        }
        if (data?.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        } else if (data?._id || data?.userId || data?.userId) {
            localStorage.setItem('user', JSON.stringify(data));
        }
        return data;
    },
    signup: async (userData) => {
        const payload = {
            collegeId: userData.collegeId,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role || 'STUDENT',
            phone: userData.phone || "",
        };
        const response = await api.post(addUserAPI, payload);
        return response.data;
    },
    logout: async () => {
        const response = await api.post(logoutAPI);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return response.data;
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
        // Use a direct axios configuration to override the api instance's default application/json
        const token = localStorage.getItem('token');
        const response = await axios.post(uploadFileAPI, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
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
    verify: async (paymentData) => {
        const response = await api.post(verifyPaymentAPI, paymentData);
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

// Keep printService for backward compatibility if ever needed
export const printService = {
    upload: fileService.upload,
    createJob: jobService.create,
};

export default api;