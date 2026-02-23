import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Truck, Package, CheckCircle2, Clock,
    AlertCircle, MapPin, Calendar, Smartphone,
    ArrowLeft, Camera, X, RefreshCcw
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ordersService, Order } from "@/services/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TrackOrder = () => {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState(urlId || "");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = "qr-reader";

    const fetchOrder = async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            // Try short ID first, then fallback to slice(0,8) match logic if needed
            let data = await ordersService.getByShortId(id);

            if (!data) {
                // Try matching by the first 8 chars of full UUID if it looks like a hex string
                const allOrders = await ordersService.getAll();
                data = (allOrders as any[])?.find(o => o.id.slice(0, 8) === id) || null;
            }

            setOrder(data);
            if (!data) {
                toast.error("Manifestation not found", {
                    description: "Please check the ritual reference and try again."
                });
            }
        } catch (error) {
            console.error("Tracking error:", error);
            toast.error("Transmission Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (urlId) {
            fetchOrder(urlId);
        }
    }, [urlId]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchId) {
            navigate(`/track/${searchId}`);
            fetchOrder(searchId);
        }
    };

    const startScanner = async () => {
        setIsScanning(true);
        try {
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            scannerRef.current = html5QrCode;

            const qrCodeSuccessCallback = (decodedText: string) => {
                // Handle different URL formats or just the ID
                const idMatch = decodedText.match(/\/track\/([^/]+)/);
                const finalId = idMatch ? idMatch[1] : decodedText;

                stopScanner();
                setSearchId(finalId);
                navigate(`/track/${finalId}`);
                fetchOrder(finalId);
                toast.success("Ritual Decoded");
            };

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            // Prefer back camera
            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback,
                () => { } // silent on errors
            );
        } catch (err) {
            console.error("Scanner start error:", err);
            toast.error("Camera access denied or unavailable");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            } catch (e) {
                console.error("Stop error:", e);
            }
        }
        setIsScanning(false);
        scannerRef.current = null;
    };

    // Auto-stop on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) stopScanner();
        };
    }, []);

    const getStatusStep = (status: string) => {
        const stages = ['pending', 'paid', 'shipped', 'delivered'];
        return stages.indexOf(status.toLowerCase());
    };

    const steps = [
        { label: 'Manifested', icon: Clock, desc: 'Ritual initiated' },
        { label: 'Essence Purified', icon: CheckCircle2, desc: 'Payment verified' },
        { label: 'Transit Ritual', icon: Truck, desc: 'Essence in movement' },
        { label: 'Manifested', icon: Package, desc: 'Ritual complete' }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 pt-32 pb-20">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary/10"
                    >
                        <Search className="w-3 h-3" /> Tracking Portal
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-serif mb-6 uppercase tracking-tighter">
                        Track <span className="text-primary italic">Ritual</span>
                    </h1>
                    <p className="text-muted-foreground text-lg font-light max-w-xl mx-auto leading-relaxed">
                        Enter your ritual reference or scan the manifestation code to see the current state of your essence.
                    </p>
                </div>

                {/* Search / Scan Controls */}
                <div className="glass p-8 rounded-[3rem] border-border/10 shadow-2xl mb-12">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Input
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Manifest Ref (e.g. LRN-XXXXXX)"
                                className="h-16 pl-14 rounded-full border-border/20 bg-background/50 text-base focus-visible:ring-primary shadow-inner"
                            />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={isScanning ? stopScanner : startScanner}
                                variant="outline"
                                className={`h-16 w-16 md:w-auto px-6 rounded-full border-2 gap-2 transition-all ${isScanning ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'hover:border-primary text-foreground'}`}
                            >
                                {isScanning ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                                <span className="hidden md:inline font-black text-[10px] uppercase tracking-widest">{isScanning ? 'Close' : 'Scan'}</span>
                            </Button>
                            <Button type="submit" disabled={loading} className="h-16 px-10 rounded-full bg-primary shadow-xl shadow-primary/20 flex-1 md:flex-none">
                                {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Track Ritual"}
                            </Button>
                        </div>
                    </form>

                    {/* Scanner Container */}
                    <AnimatePresence>
                        {isScanning && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-8 overflow-hidden"
                            >
                                <div className="relative aspect-square md:aspect-video rounded-[2rem] bg-black overflow-hidden border-4 border-primary/20 shadow-2xl">
                                    <div id={scannerContainerId} className="w-full h-full" />
                                    <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-primary/60 rounded-xl pointer-events-none animate-pulse">
                                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-primary/90 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-2xl">
                                        Aim at Manifest Code
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Result */}
                <AnimatePresence mode="wait">
                    {order ? (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            {/* Status Header */}
                            <div className="glass p-10 rounded-[3.5rem] border-border/10 shadow-2xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                                <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 relative">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-serif font-black">{order.short_id || "LRN-" + order.id.slice(0, 8)}</span>
                                            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest">
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-6 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-xs font-medium">{order.city}, {order.country || 'Pakistan'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Total Value</p>
                                        <p className="text-3xl font-serif font-black text-primary">Rs. {Math.round(order.total_amount).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Progress Track */}
                                <div className="relative px-4 pb-4">
                                    <div className="absolute top-[22px] left-12 right-12 h-0.5 bg-muted hidden md:block" />
                                    <div
                                        className="absolute top-[22px] left-12 h-0.5 bg-primary transition-all duration-1000 hidden md:block"
                                        style={{ width: `${Math.min(100, (getStatusStep(order.status) / 3) * 100)}%` }}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                        {steps.map((step, idx) => {
                                            const isActive = idx <= getStatusStep(order.status);
                                            const StepIcon = step.icon;
                                            return (
                                                <div key={idx} className="relative flex flex-row md:flex-col items-center gap-4 md:text-center group">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all duration-500 ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-muted/50 text-muted-foreground'}`}>
                                                        <StepIcon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                                                        <p className="text-[10px] text-muted-foreground italic font-serif">{step.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Shipment Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass p-10 rounded-[3rem] border-border/10 shadow-xl">
                                    <h3 className="font-serif text-2xl mb-8 flex items-center gap-3">
                                        <MapPin className="w-6 h-6 text-primary" /> Delivery Info
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Receiver</p>
                                            <p className="text-sm font-bold">{order.full_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Destination</p>
                                            <p className="text-sm font-medium leading-relaxed">{order.address}, {order.city}</p>
                                        </div>
                                        {order.tracking_number && (
                                            <div>
                                                <p className="text-[9px] font-black text-primary uppercase mb-1">Logistics Ref</p>
                                                <Badge variant="outline" className="text-xs font-mono">{order.tracking_number}</Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="glass p-10 rounded-[3rem] border-border/10 shadow-xl">
                                    <h3 className="font-serif text-2xl mb-8 flex items-center gap-3">
                                        <Package className="w-6 h-6 text-primary" /> Ritual Items
                                    </h3>
                                    <div className="space-y-6">
                                        {order.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-[8px] font-serif p-1 text-center opacity-40">ITEM</div>
                                                    <div>
                                                        <p className="text-xs font-bold">{item.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-serif font-black text-sm">Rs. {(item.price * item.quantity).toFixed(0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        !loading && searchId && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="w-20 h-20 bg-rose-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-10 h-10 text-rose-500" />
                                </div>
                                <h3 className="text-3xl font-serif mb-2">No Ritual Found</h3>
                                <p className="text-muted-foreground font-light max-w-sm mx-auto">
                                    The ritual reference provided does not exist in our manifest records.
                                </p>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
};

export default TrackOrder;
