import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, CreditCard, ChevronLeft, Trash2, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fileService, jobService, paymentService, pricingService } from '../services/api';

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [config, setConfig] = useState({ size: 'A4', type: 'bw', side: 'single' });
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
                const priceResult = await pricingService.lookup({ size: config.size, type: config.type, side: config.side });
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

    const estimatedCost = 10 * pricePerPage;

    const handleFileUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError('');

        try {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const userId = user?._id || user?.id || user?.userId || user?.userId;

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
            if (userId) formData.append('userId', userId);
            formData.append('file', file);
            const uploadResult = await fileService.upload(formData);
            console.log('File uploaded:', uploadResult);

            let finalPrice: number = pricePerPage;
            try {
                const priceResult = await pricingService.lookup({ size: config.size, type: config.type, side: config.side });
                const remotePrice = priceResult?.DATA?.price || priceResult?.price;
                if (remotePrice !== undefined && remotePrice !== null) finalPrice = Number(remotePrice);
            } catch (priceErr) {
                console.warn('Live price fetch failed, using cached value:', priceErr);
            }

            if (!finalPrice || finalPrice <= 0) {
                setError('Could not determine print price. Please try changing the settings and try again.');
                setIsUploading(false);
                return;
            }

            const jobResult = await jobService.create({
                userId, fileId: extractId(uploadResult),
                pageType: config.size,
                colorMode: config.type === 'colour' ? 'COLOR' : 'BW',
                printSide: config.side === 'double' ? 'DOUBLE' : 'SINGLE',
                copies: 1, totalPagesToPrint: 10,
            });
            console.log('Job created (FULL RESPONSE):', JSON.stringify(jobResult, null, 2));

            const jobId = jobResult?.DATA?.jobId || jobResult?.DATA?.job?._id || jobResult?.DATA?._id || jobResult?.jobId || jobResult?._id || null;
            console.log('Extracted jobId:', jobId);

            if (!jobId) {
                setError('Failed to create print job. Please try again.');
                setIsUploading(false);
                return;
            }

            const orderResult = await paymentService.createOrder({ jobId });
            console.log('Payment order created:', orderResult);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderResult?.DATA?.key || orderResult?.DATA?.razorpayKeyId || orderResult?.key || orderResult?.razorpayKeyId || 'rzp_test_SQzDN9kyfa3o0H',
                amount: (orderResult?.DATA?.order?.amount || orderResult?.DATA?.amount || orderResult?.order?.amount || orderResult?.amount || finalPrice * 100),
                currency: 'INR',
                name: 'PrintPost',
                description: `Print Job: ${file.name}`,
                order_id: extractId(orderResult),
                handler: async function (response: any) {
                    try {
                        await paymentService.verify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            jobId,
                        });
                        setStep('SUCCESS');
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                        setError('Payment verification failed. Please contact support.');
                    }
                    setIsUploading(false);
                },
                prefill: { name: 'Student', email: 'student@example.com' },
                theme: { color: '#525252' },
                modal: { ondismiss: function () { setIsUploading(false); } },
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

    const selectClass = "bg-bg-secondary border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition-all duration-200 font-medium";

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <header className="max-w-[1000px] mx-auto flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-10 h-10 rounded-lg bg-bg-secondary border border-border flex items-center justify-center hover:bg-surface-light transition-colors duration-200"
                >
                    <ChevronLeft className="w-5 h-5 text-text-muted" />
                </button>
                <div>
                    <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">New Print Job</h1>
                    <p className="text-sm text-text-muted">Upload documents and configure print settings.</p>
                </div>
            </header>

            <main className="max-w-[1000px] mx-auto">
                {step === 'UPLOAD' && (
                    <div className="card p-8">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDrop}
                            className="border border-dashed border-border rounded-xl p-16 flex flex-col items-center justify-center bg-bg-secondary hover:bg-surface-light transition-colors duration-200 cursor-pointer group"
                            onClick={() => document.getElementById('fileInput')?.click()}
                        >
                            <input type="file" id="fileInput" className="hidden" onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])} />
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                                <Upload className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-text">Select a file to print</h2>
                            <p className="text-text-muted text-center max-w-sm text-sm">
                                Drag and drop your document here, or click to browse files from your computer
                            </p>
                        </div>
                        {error && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-3 text-accent">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 'CONFIG' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold truncate max-w-[200px] text-text">{file?.name}</p>
                                        <p className="text-xs text-text-muted">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button onClick={() => setStep('UPLOAD')} className="text-accent hover:bg-accent/10 p-2 rounded-lg transition-colors duration-200">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                        <Settings2 className="w-4 h-4" /> Print Settings
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 flex flex-col">
                                            <span className="text-xs text-text-muted ml-1">Size</span>
                                            <select value={config.size} onChange={(e) => setConfig({ ...config, size: e.target.value })} className={selectClass}>
                                                <option value="A4">A4</option><option value="A3">A3</option><option value="Letter">Letter</option><option value="Legal">Legal</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 flex flex-col">
                                            <span className="text-xs text-text-muted ml-1">Type</span>
                                            <select value={config.type} onChange={(e) => setConfig({ ...config, type: e.target.value })} className={selectClass}>
                                                <option value="bw">B&W</option><option value="colour">Colour</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-xs text-text-muted ml-1">Side</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setConfig({ ...config, side: 'single' })}
                                            className={`px-4 py-3 rounded-lg border font-medium transition-all duration-200 ${config.side === 'single' ? 'bg-primary border-primary text-white' : 'bg-bg-secondary border-border text-text-muted hover:border-primary/30'}`}
                                        >
                                            Single
                                        </button>
                                        <button
                                            onClick={() => setConfig({ ...config, side: 'double' })}
                                            className={`px-4 py-3 rounded-lg border font-medium transition-all duration-200 ${config.side === 'double' ? 'bg-primary border-primary text-white' : 'bg-bg-secondary border-border text-text-muted hover:border-primary/30'}`}
                                        >
                                            Double
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-xs text-text-muted ml-1">Price per page</span>
                                    <div className="bg-bg-secondary border border-border rounded-lg px-4 py-3 font-semibold text-primary flex items-center justify-between">
                                        {isPriceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `₹${pricePerPage}.00`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="card p-6">
                                <h3 className="text-xl font-semibold mb-5 text-text">Payment Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-text-muted text-sm">
                                        <span>Base Price</span>
                                        <span>{'₹'}{estimatedCost}.00</span>
                                    </div>
                                    <div className="flex justify-between text-text-muted text-sm">
                                        <span>Service Fee</span>
                                        <span>{'₹'}0.00</span>
                                    </div>
                                    <div className="h-px bg-border my-4" />
                                    <div className="flex justify-between text-2xl font-bold">
                                        <span className="text-text">Total</span>
                                        <span className="text-primary">{'₹'}{estimatedCost}.00</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleFileUpload}
                                    disabled={isUploading}
                                    className="w-full mt-8 bg-primary hover:bg-primary/90 text-white font-medium py-3.5 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 disabled:opacity-50 shadow-sm"
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
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-3 text-accent">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="card p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-8">
                            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-[28px] font-bold mb-4 text-text tracking-[-0.02em]">Payment Successful!</h2>
                        <p className="text-text-muted text-base max-w-md mb-10">
                            Your print job has been sent to the queue. You can track its status on the dashboard.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-bg-secondary hover:bg-surface-light border border-border px-10 py-4 rounded-lg font-medium transition-all duration-200 text-text"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UploadPage;
