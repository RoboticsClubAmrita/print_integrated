import axios from 'axios';

const API_BASE_URL = 'http://13.60.246.95/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    signup: async (userData: any) => {
        // Finalizing payload to match EXACT controller requirements:
        // { collegeId, name, email, phone, password, role }
        const payload = {
            collegeId: userData.collegeId,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role || 'STUDENT',
            phone: userData.phone || "" // Adding empty phone to be 100% safe
        };

        console.log("Sending Payload to /users/add:", { ...payload, password: '***' });

        const response = await api.post('/users/add', payload);
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async ({ token, password, confirmPassword }: any) => {
        // Matching backend: resetToken, newPassword, confirmPassword
        const response = await api.post('/auth/reset-password', {
            resetToken: token,
            newPassword: password,
            confirmPassword: confirmPassword
        });
        return response.data;
    }
};

export default api;
