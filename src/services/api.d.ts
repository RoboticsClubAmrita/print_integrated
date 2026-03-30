declare const api: import("axios").AxiosInstance;

export declare const loginAPI: string;
export declare const logoutAPI: string;
export declare const forgotPasswordAPI: string;
export declare const resetPasswordAPI: string;

export declare const addUserAPI: string;
export declare const getAllUsersAPI: string;
export declare const getUserByIdAPI: (id: string) => string;
export declare const editUserAPI: string;
export declare const deleteUserAPI: string;

export declare const uploadFileAPI: string;

export declare const createJobAPI: string;
export declare const getAllJobsAPI: string;
export declare const getJobByIdAPI: (id: string) => string;
export declare const getJobsByUserAPI: (userId: string) => string;
export declare const editJobAPI: string;
export declare const cancelJobAPI: string;
export declare const deleteJobAPI: string;

export declare const createPriceAPI: string;
export declare const getAllPricesAPI: string;
export declare const lookupPriceAPI: (size: string, type: string, side: string) => string;
export declare const getPriceByIdAPI: (id: string) => string;
export declare const editPriceAPI: string;
export declare const deletePriceAPI: string;
export declare const seedPricesAPI: string;

export declare const createOrderAPI: string;
export declare const verifyPaymentAPI: string;
export declare const getPaymentByIdAPI: (id: string) => string;
export declare const getPaymentByJobAPI: (jobId: string) => string;
export declare const getPaymentsByUserAPI: (userId: string) => string;

export declare const webhookAPI: string;


export declare const authService: {
    login: (credentials: any) => Promise<any>;
    signup: (userData: any) => Promise<any>;
    logout: () => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: ({ token, password, confirmPassword }: any) => Promise<any>;
};
export declare const userService: {
    add: (userData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (userId: string) => Promise<any>;
    edit: (userData: any) => Promise<any>;
    delete: (userId: string) => Promise<any>;
};
export declare const fileService: {
    upload: (formData: any) => Promise<any>;
};
export declare const jobService: {
    create: (jobData: any) => Promise<any>;
    getAll: (params?: any) => Promise<any>;
    getById: (jobId: string) => Promise<any>;
    getByUser: (userId: string, params?: any) => Promise<any>;
    edit: (jobData: any) => Promise<any>;
    cancel: (jobData: any) => Promise<any>;
    delete: (jobData: any) => Promise<any>;
};
export declare const pricingService: {
    create: (priceData: any) => Promise<any>;
    getAll: (params?: any) => Promise<any>;
    lookup: (params: { size: string; type: string; side: string }) => Promise<any>;
    getById: (priceId: string) => Promise<any>;
    edit: (priceData: any) => Promise<any>;
    delete: (priceId: string) => Promise<any>;
    seed: () => Promise<any>;
};
export declare const paymentService: {
    createOrder: (orderData: any) => Promise<any>;
    verify: (paymentData: any) => Promise<any>;
    getById: (paymentId: string) => Promise<any>;
    getByJob: (jobId: string) => Promise<any>;
    getByUser: (userId: string, params?: any) => Promise<any>;
};
export declare const printService: {
    upload: (formData: any) => Promise<any>;
    createJob: (jobData: any) => Promise<any>;
};
export declare const hardwareService: {
    createLocation: (data: any) => Promise<any>;
    getLocations: () => Promise<any>;
    deleteLocation: (id: string) => Promise<any>;
    createPrinter: (data: any) => Promise<any>;
    getPrinters: (locationId: string) => Promise<any>;
    updatePrinterStatus: (id: string, status: string) => Promise<any>;
    deletePrinter: (id: string) => Promise<any>;
    createStack: (data: any) => Promise<any>;
    getStacks: (locationId: string) => Promise<any>;
    updateStackStatus: (id: string, status: string) => Promise<any>;
    deleteStack: (id: string) => Promise<any>;
};
export default api;