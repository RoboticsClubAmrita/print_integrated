import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, CreditCard, ChevronLeft, Trash2, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fileService, jobService, paymentService, pricingService } from '../services/api';

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [config, setConfig] = useState({
        size: 'A4',
        type: 'bw',
        side: 'single',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState<'UPLOAD' | 'CONFIG' | 'PAYMENT' | 'SUCCESS'>('UPLOAD');
    const [error, setError] = useState('');
    const [pricePerPage, setPricePerPage] = useState<number>(0);
    const [isPriceLoading, setIsPriceLoading] = useState(false);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) validateAndSetFile(droppedFile);
    }, []);

    const validateAndSetFile = (selectedFile: File) => {
        setError('');
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a valid file type (PDF, DOCX, JPG, PNG)');
            return;
        }

        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setFile(selectedFile);
        setStep('CONFIG');
    };

    React.useEffect(() => {
        const fetchPrice = async () => {
            setIsPriceLoading(true);
            try {
                const priceResult = await pricingService.lookup({
                    size: config.size,
                    type: config.type,
                    side: config.side,
                });
                const remotePrice = priceResult?.DATA?.price || priceResult?.price || 0;
                setPricePerPage(remotePrice);
            } catch (err) {
                console.error("Failed to fetch dynamic price:", err);
                setPricePerPage(0);
            } finally {
                setIsPriceLoading(false);
            }
        };
        fetchPrice();
    }, [config]);

    const estimatedCost = 10 * pricePerPage; // Total = price * pages * copies (hardcoded 10 pages)

    const handleFileUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError('');

        try {
            // Step 1: Upload the file to backend
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const userId = user?._id || user?.id || user?.userId || user?.user_id;

            const extractId = (obj: any): string | null => {
                if (!obj) return null;
                if (typeof obj === 'string' && obj.length === 24) return obj;
                if (obj.fileId) return obj.fileId;
                if (obj.jobId) return obj.jobId;
                if (obj.orderId) return obj.orderId;
                if (obj._id) return obj._id;
                if (obj.id) return obj.id;
                if (typeof obj === 'object') {
                    for (const key of Object.keys(obj)) {
                        const res = extractId(obj[key]);
                        if (res) return res;
                    }
                }
                return null;
            };

            if (!userId) {
                setError('You must be logged in to upload a file. Please log in again.');
                setIsUploading(false);
                return;
            }

            const formData = new FormData();
            if (userId) {
                formData.append('userId', userId);
            }
            formData.append('file', file);
            const uploadResult = await fileService.upload(formData);
            console.log('File uploaded:', uploadResult);

            // Step 2: Fetch live price from backend at submit time
            let finalPrice: number = pricePerPage; // use already-loaded state
            try {
                const priceResult = await pricingService.lookup({
                    size: config.size,
                    type: config.type,
                    side: config.side,
                });
                const remotePrice = priceResult?.DATA?.price || priceResult?.price;
                if (remotePrice !== undefined && remotePrice !== null) {
                    finalPrice = Number(remotePrice);
                }
            } catch (priceErr) {
                console.warn('Live price fetch failed, using cached value:', priceErr);
            }

            if (!finalPrice || finalPrice <= 0) {
                setError('Could not determine print price. Please try changing the settings and try again.');
                setIsUploading(false);
                return;
            }

            // const totalCost = Number(finalPrice) * 10; // price per page × 10 pages

            // Step 3: Create a print job in the backend
            // Field names must match backend CREATE_FIELDS whitelist exactly
            const jobResult = await jobService.create({
                userId: userId,
                fileId: extractId(uploadResult),
                pageType: config.size,                                          // A4, A3...
                colorMode: config.type === 'colour' ? 'COLOR' : 'BW',          // must be 'BW' or 'COLOR'
                printSide: config.side === 'double' ? 'DOUBLE' : 'SINGLE',     // must be 'SINGLE' or 'DOUBLE'
                copies: 1,
                totalPagesToPrint: 10,                                          // backend uses this to calc totalCost
                // totalCost is NOT sent — backend auto-calculates it from pricing table
            });
            console.log('Job created (FULL RESPONSE):', JSON.stringify(jobResult, null, 2));

            // Extract jobId — backend returns { MESSAGE, DATA: { job_id, referenceId } }
            const jobId =
                jobResult?.DATA?.job_id ||
                jobResult?.DATA?.job?._id ||
                jobResult?.DATA?._id ||
                jobResult?.job_id ||
                jobResult?._id ||
                null;

            console.log('Extracted jobId:', jobId);

            if (!jobId) {
                setError('Failed to create print job. Please try again.');
                setIsUploading(false);
                return;
            }

            // Step 4: Create a Razorpay payment order via backend (only jobId required)
            const orderResult = await paymentService.createOrder({
                jobId: jobId,
            });
            console.log('Payment order created:', orderResult);

            // Step 5: Open Razorpay checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderResult?.DATA?.key || orderResult?.DATA?.razorpayKeyId || orderResult?.key || orderResult?.razorpayKeyId || 'rzp_test_SQzDN9kyfa3o0H',
                amount: (orderResult?.DATA?.order?.amount || orderResult?.DATA?.amount || orderResult?.order?.amount || orderResult?.amount || finalPrice * 100),
                currency: 'INR',
                name: 'PrintPost',
                description: `Print Job: ${file.name}`,
                order_id: extractId(orderResult),
                handler: async function (response: any) {
                    try {
                        // Step 6: Verify payment with backend
                        await paymentService.verify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            jobId: jobId,
                        });
                        setStep('SUCCESS');
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                        setError('Payment verification failed. Please contact support.');
                    }
                    setIsUploading(false);
                },
                prefill: {
                    name: 'Student',
                    email: 'student@example.com',
                },
                theme: {
                    color: '#6366f1',
                },
                modal: {
                    ondismiss: function () {
                        setIsUploading(false);
                    },
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                setError('Payment failed: ' + response.error.description);
                setIsUploading(false);
            });
            rzp.open();

        } catch (err: any) {
            console.error('Upload/Payment error:', err.response?.data || err);
            setError(err.response?.data?.MESSAGE || err.response?.data?.message || err.message || 'Error processing request');
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">New Print Job</h1>
            </header>

            <main className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === 'UPLOAD' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass p-10 rounded-3xl"
                        >
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={onDrop}
                                className="border-4 border-dashed border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface/50 transition-all cursor-pointer group"
                                onClick={() => document.getElementById('fileInput')?.click()}
                            >
                                <input
                                    type="file"
                                    id="fileInput"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                                />
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Upload className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Select a file to print</h2>
                                <p className="text-text-muted text-center max-w-sm">
                                    Drag and drop your document here, or click to browse files from your computer
                                </p>
                            </div>
                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'CONFIG' && (
                        <motion.div
                            key="config"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            <div className="glass p-8 rounded-3xl space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center shadow-inner">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold truncate max-w-[200px]">{file?.name}</p>
                                            <p className="text-xs text-text-muted">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep('UPLOAD')} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-text-muted flex items-center gap-2">
                                            <Settings2 className="w-4 h-4" /> Print Settings
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 flex flex-col">
                                                <span className="text-xs ml-1">Size</span>
                                                <select
                                                    value={config.size}
                                                    onChange={(e) => setConfig({ ...config, size: e.target.value })}
                                                    className="bg-surface border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                                                >
                                                    <option value="A4">A4</option>
                                                    <option value="A3">A3</option>
                                                    <option value="Letter">Letter</option>
                                                    <option value="Legal">Legal</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5 flex flex-col">
                                                <span className="text-xs ml-1">Type</span>
                                                <select
                                                    value={config.type}
                                                    onChange={(e) => setConfig({ ...config, type: e.target.value })}
                                                    className="bg-surface border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                                                >
                                                    <option value="bw">B&W</option>
                                                    <option value="colour">colour</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <span className="text-xs ml-1">Side</span>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setConfig({ ...config, side: 'single' })}
                                                className={`px-4 py-3 rounded-xl border font-bold transition-all ${config.side === 'single' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-surface border-white/10 text-text-muted hover:border-white/20'}`}
                                            >
                                                single
                                            </button>
                                            <button
                                                onClick={() => setConfig({ ...config, side: 'double' })}
                                                className={`px-4 py-3 rounded-xl border font-bold transition-all ${config.side === 'double' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-surface border-white/10 text-text-muted hover:border-white/20'}`}
                                            >
                                                double
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="text-xs ml-1">Price per page</span>
                                        <div className="bg-surface border border-white/10 rounded-xl px-4 py-3 font-bold text-primary flex items-center justify-between">
                                            {isPriceLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : `₹${pricePerPage}.00`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass p-8 rounded-3xl">
                                    <h3 className="text-xl font-bold mb-6">Payment Summary</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-text-muted">
                                            <span>Base Price</span>
                                            <span>₹{estimatedCost}.00</span>
                                        </div>
                                        <div className="flex justify-between text-text-muted">
                                            <span>Service Fee</span>
                                            <span>₹0.00</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-4" />
                                        <div className="flex justify-between text-2xl font-bold">
                                            <span>Total</span>
                                            <span className="text-primary">₹{estimatedCost}.00</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleFileUpload}
                                        disabled={isUploading}
                                        className="w-full mt-8 bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Pay & Print
                                            </>
                                        )}
                                    </button>
                                </div>
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-400">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === 'SUCCESS' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-20 rounded-3xl flex flex-col items-center justify-center text-center"
                        >
                            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8">
                                <CheckCircle2 className="w-12 h-12 text-green-400" />
                            </div>
                            <h2 className="text-4xl font-bold mb-4">Payment Successful!</h2>
                            <p className="text-text-muted text-lg max-w-md mb-10">
                                Your print job has been sent to the queue. You can track its status on the dashboard.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-white/10 hover:bg-white/20 border border-white/10 px-10 py-4 rounded-2xl font-bold transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default UploadPage;
