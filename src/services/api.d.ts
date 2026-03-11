declare const api: import("axios").AxiosInstance;
export declare const authService: {
    login: (credentials: any) => Promise<any>;
    signup: (userData: any) => Promise<any>;
    logout: () => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: ({ token, password, confirmPassword }: any) => Promise<any>;
};
export default api;
//# sourceMappingURL=api.d.ts.map