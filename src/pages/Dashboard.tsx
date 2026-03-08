import { useState, useEffect } from "react";
import { Package, Truck, Clock, ArrowLeft, ExternalLink, RefreshCcw, RotateCcw, ShieldCheck, MapPin, CreditCard, Calendar, User, MessageSquare, Star, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ordersService, returnsService, reviewsService, profilesService } from "@/services/supabase";
import { checkRateLimit, getRateLimitRemaining } from "@/utils/rateLimit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function PatronDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<any | null>(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [profile, setProfile] = useState<any>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [addressForm, setAddressForm] = useState({
        full_name: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Pakistan"
    });

    // Return states
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any | null>(null);
    const [returnReason, setReturnReason] = useState("");
    const [returnDetails, setReturnDetails] = useState("");
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    const fetchProfileData = async () => {
        if (!user) return;
        try {
            const data = await profilesService.getById(user.id);
            setProfile(data);
            if (data) {
                setAddressForm({
                    full_name: data.full_name || user.user_metadata?.full_name || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    postal_code: data.postal_code || "",
                    country: data.country || "Pakistan"
                });
            }
        } catch (e) {
            console.error("Profile fetch error:", e);
        }
    };

    const handleSaveAddress = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            await profilesService.update(user.id, {
                ...addressForm,
                updated_at: new Date().toISOString()
            });
            toast({ title: "Sanctum Updated", description: "Your physical coordinates have been archived." });
            fetchProfileData();
        } catch (e) {
            toast({ variant: "destructive", title: "Archive Failed", description: "The botanical spirits could not preserve your location." });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const fetchOrders = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await ordersService.getMyOrders(user.id);
            setOrders(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Ritual Interrupted", description: "Failed to load your ritual history." });
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async () => {
        if (!selectedOrderForFeedback || !user) return;

        // Rate Limit: 1 feedback every 5 minutes per order to prevent spam
        const rateLimitKey = `feedback_${user.id}_${selectedOrderForFeedback.id}`;
        if (!checkRateLimit(rateLimitKey, 300000)) {
            const remaining = getRateLimitRemaining(rateLimitKey, 300000);
            toast({
                variant: "destructive",
                title: "Critique Throttled",
                description: `The botanical archives require time to process your energy. Please wait ${Math.ceil(remaining / 60)} minutes.`
            });
            return;
        }

        setIsSubmittingFeedback(true);

        try {
            const firstItem = selectedOrderForFeedback.items?.[0];

            await reviewsService.create({
                product_id: firstItem?.id || null,
                user_id: user.id,
                user_name: user.user_metadata?.full_name || "Lorean Patron",
                user_email: user.email,
                rating: feedbackRating,
                comment: feedbackComment,
                status: 'pending'
            });

            toast({
                title: "Insights Received",
                description: "Your botanical feedback has been successfully archived."
            });

            setSelectedOrderForFeedback(null);
            setFeedbackComment("");
            setFeedbackRating(5);
        } catch (error) {
            console.error("Feedback error:", error);
            toast({
                variant: "destructive",
                title: "Critique Failed",
                description: "The botanical archives could not store your insights."
            });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const submitReturnRequest = async () => {
        if (!selectedOrderForReturn) return;
        setIsSubmittingReturn(true);

        try {
            await returnsService.createRequest({
                user_id: user.id,
                order_id: `LRN-${selectedOrderForReturn.id.slice(0, 8)}`,
                customer_email: user?.email,
                customer_name: user?.user_metadata?.full_name || "Lorean Patron",
                reason: returnReason,
                details: returnDetails,
                amount: Number(selectedOrderForReturn.total_amount),
                status: 'pending'
            });

            toast({
                title: "Reversal Initiated",
                description: "Your request for ritual reversal has been broadcast."
            });

            setSelectedOrderForReturn(null);
            setReturnReason("");
            setReturnDetails("");
        } catch (error) {
            console.error("Return error:", error);
            toast({
                variant: "destructive",
                title: "Reversal Failed",
                description: "The botanical portal rejected your request."
            });
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchProfileData();

        if (user) {
            const channel = ordersService.subscribeToOrders((payload) => {
                if (payload.eventType === 'UPDATE' && payload.new.user_id === user.id) {
                    setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
                }
            });

            return () => {
                ordersService.unsubscribe(channel);
            };
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-20 gap-4">
                <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
                <p className="font-serif italic text-muted-foreground/60">Consulting archives...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30">
            {/* Ethereal Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.05, 0.08, 0.05],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[160px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.03, 0.06, 0.03],
                        x: [0, -40, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[140px]"
                />
            </div>

            <Navbar />

            <main className="max-w-6xl mx-auto px-6 pt-40 pb-32 relative">
                <header className="mb-24 lg:mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4 text-primary mb-2">
                            <span className="w-12 h-[1px] bg-primary/40" />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] leading-none">Patron Repository</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-serif tracking-tighter leading-[0.9] text-foreground">
                            Identity: <br />
                            <span className="text-primary italic font-light">{user?.user_metadata?.full_name || "Venerated Patron"}</span>
                        </h1>
                        <p className="text-muted-foreground font-light text-xl max-w-xl leading-relaxed opacity-70">
                            A sanctum for your botanical acquisitions and archived ritualistic history.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    {/* Profile & Address Portal */}
                    <aside className="lg:col-span-4 space-y-12">
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-12 rounded-[3.5rem] border border-border/10 space-y-12 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
                                <img src="/favicon.png" className="w-40 h-40 object-contain grayscale" alt="" />
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center p-2">
                                        <img src="/favicon.png" className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <h3 className="text-2xl font-serif italic text-primary">Identity Artifacts</h3>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 leading-relaxed">
                                    Archive your manifestations for swift checkout.
                                </p>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <UILabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2">Manifested Name</UILabel>
                                    <Input
                                        value={addressForm.full_name}
                                        onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })}
                                        className="h-16 rounded-[2rem] bg-muted/5 border-border/5 px-8 text-sm focus:bg-muted/10 transition-all font-light shadow-inner"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <UILabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2">Physical Coordinates</UILabel>
                                    <Input
                                        value={addressForm.address}
                                        onChange={e => setAddressForm({ ...addressForm, address: e.target.value })}
                                        className="h-16 rounded-[2rem] bg-muted/5 border-border/5 px-8 text-sm focus:bg-muted/10 transition-all font-light shadow-inner"
                                        placeholder="Sanctum Address / Street / House"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <UILabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2">Settlement</UILabel>
                                        <Input
                                            value={addressForm.city}
                                            onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                            className="h-16 rounded-[2rem] bg-muted/5 border-border/5 px-8 text-sm focus:bg-muted/10 transition-all font-light shadow-inner"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <UILabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2">Province</UILabel>
                                        <Input
                                            value={addressForm.state}
                                            onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                                            className="h-16 rounded-[2rem] bg-muted/5 border-border/5 px-8 text-sm focus:bg-muted/10 transition-all font-light shadow-inner"
                                            placeholder="State"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <UILabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2">Postal Rune</UILabel>
                                        <Input
                                            value={addressForm.postal_code}
                                            onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                                            className="h-16 rounded-[2rem] bg-muted/5 border-border/5 px-8 text-sm focus:bg-muted/10 transition-all font-light shadow-inner"
                                            placeholder="Zip Code"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <UILabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2">Domain</UILabel>
                                        <Input
                                            value={addressForm.country}
                                            readOnly
                                            className="h-16 rounded-[2rem] bg-muted/5 border-none px-8 text-[11px] uppercase font-black tracking-widest opacity-40 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveAddress}
                                disabled={isSavingProfile}
                                className="w-full h-18 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all duration-700 relative z-10 overflow-hidden group"
                            >
                                {isSavingProfile ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (
                                    <span className="flex items-center justify-center gap-4">
                                        Preserve Artifacts <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                                    </span>
                                )}
                            </Button>
                        </motion.section>
                    </aside>

                    {/* Ritual History List */}
                    <div className="lg:col-span-8 space-y-20">
                        <div className="flex items-end justify-between border-b border-border/5 pb-10">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-serif tracking-tight">Ritual History</h2>
                                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">The Chronology of Your Essence</p>
                            </div>
                            <Badge variant="outline" className="rounded-full py-2 px-6 border-border/10 text-[10px] font-black tracking-widest bg-muted/20">
                                {orders.length} Records found
                            </Badge>
                        </div>

                        {orders.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-32 text-center space-y-12 glass rounded-[5rem] border-white/5"
                            >
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                                    <div className="w-32 h-32 bg-muted/10 rounded-full flex items-center justify-center relative border border-white/5">
                                        <Package className="w-12 h-12 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <p className="font-serif italic text-4xl leading-tight">Your archive awaits <br /> its first record.</p>
                                    <p className="text-muted-foreground/50 text-[11px] uppercase tracking-[0.4em] font-medium max-w-sm mx-auto leading-loose">The paths to botanical enlightenment are open to those who seek them.</p>
                                </div>
                                <Button onClick={() => navigate("/shop")} className="h-16 px-14 rounded-full bg-primary text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(var(--primary),0.2)] hover:scale-105 transition-all duration-500">Begin Investigation</Button>
                            </motion.div>
                        ) : (
                            <div className="space-y-16 lg:space-y-24">
                                {orders.map((order, orderIdx) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ delay: orderIdx * 0.1, duration: 0.8 }}
                                        className="group relative"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-12 pb-20 border-b border-border/5 relative z-10">
                                            <div className="space-y-10 flex-1">
                                                <div className="flex items-center flex-wrap gap-6">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 font-mono">Archive No. {order.short_id || order.id.slice(0, 8)}</span>
                                                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border shadow-sm ${order.status === 'delivered'
                                                        ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-primary/5 text-primary border-primary/20'
                                                        }`}>
                                                        {order.status}
                                                    </div>
                                                    <div className="h-1 w-1 bg-border/20 rounded-full" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 leading-none">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-8">
                                                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex flex-col gap-4 w-32 group/item cursor-pointer" onClick={() => navigate(`/product/${item.slug || item.id}`)}>
                                                            <div className="aspect-[4/5] rounded-[2rem] bg-muted/10 border border-white/5 overflow-hidden transition-all duration-[1s] group-hover/item:border-primary/30 group-hover/item:shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative">
                                                                <img src={item.image || '/placeholder.png'} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover/item:mix-blend-normal group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-[1.5s]" alt="" />
                                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-700" />
                                                            </div>
                                                            <div className="space-y-1 px-1">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] truncate text-muted-foreground/60 group-hover/item:text-primary transition-colors duration-500">{item.name}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 3 && (
                                                        <div className="w-32 aspect-[4/5] rounded-[2rem] bg-muted/5 border border-dashed border-border/20 flex flex-col items-center justify-center gap-2 group/more cursor-pointer hover:bg-muted/10 transition-colors">
                                                            <span className="text-2xl font-serif italic text-muted-foreground/30 group-hover/more:text-primary transition-colors">+{order.items.length - 3}</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">Essences</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-end gap-12 min-w-[200px]">
                                                <div className="text-right space-y-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">Ritual Value</p>
                                                    <p className="text-5xl font-serif italic text-foreground tracking-tighter leading-none pr-1">Rs. {order.total_amount}</p>
                                                </div>
                                                <div className="flex flex-col gap-4 w-full">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => navigate(`/track/${order.short_id || order.id.slice(0, 8)}`)}
                                                        className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] border-border text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-700 shadow-sm"
                                                    >
                                                        Track Portal
                                                    </Button>
                                                    {order.status === 'delivered' && (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-10 w-full p-0 text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-primary/70 transition-all flex items-center justify-center gap-3 group/btn"
                                                            onClick={() => setSelectedOrderForFeedback(order)}
                                                        >
                                                            <motion.div whileHover={{ scale: 1.2 }} className="transition-transform">
                                                                <MessageSquare className="w-4 h-4" />
                                                            </motion.div>
                                                            Submit Archive Insight
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Dialog */}
                <AnimatePresence>
                    {selectedOrderForFeedback && (
                        <Dialog open={!!selectedOrderForFeedback} onOpenChange={(open) => !open && setSelectedOrderForFeedback(null)}>
                            <DialogContent className="max-w-2xl rounded-[3.5rem] border-border/10 bg-background/95 backdrop-blur-3xl p-16 overflow-hidden">
                                <DialogHeader className="space-y-8 text-center">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-primary/20 relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                                        <Sparkles className="w-10 h-10 text-primary relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <DialogTitle className="text-4xl font-serif italic text-foreground">Archive Insight</DialogTitle>
                                        <DialogDescription className="text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground/40 leading-relaxed max-w-sm mx-auto">
                                            Document the botanical manifestation of this essence for the great repository.
                                        </DialogDescription>
                                    </div>
                                </DialogHeader>

                                <div className="space-y-12 py-8">
                                    <div className="flex justify-center gap-6">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setFeedbackRating(star)}
                                                className="transition-all duration-500 hover:scale-125"
                                            >
                                                <Star
                                                    className={`w-12 h-12 transition-colors duration-500 ${star <= feedbackRating ? "fill-primary text-primary" : "text-muted-foreground/10"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <Textarea
                                        placeholder="Whisper your experiences into the archive..."
                                        className="min-h-[180px] rounded-[3rem] bg-muted/5 border-border/5 p-10 text-sm font-light leading-relaxed resize-none focus:bg-muted/10 transition-all shadow-inner"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                    />

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            className="w-full h-18 rounded-full bg-primary text-white text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all"
                                            onClick={submitFeedback}
                                            disabled={isSubmittingFeedback || !feedbackComment}
                                        >
                                            {isSubmittingFeedback ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Preserve Insights"}
                                        </Button>
                                        <p className="text-[9px] text-center text-muted-foreground/30 uppercase tracking-[0.5em] font-black">Manifestation is irreversible.</p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>

                {/* Return Dialog */}
                <AnimatePresence>
                    {selectedOrderForReturn && (
                        <Dialog open={!!selectedOrderForReturn} onOpenChange={(open) => !open && setSelectedOrderForReturn(null)}>
                            <DialogContent className="max-w-2xl rounded-[3.5rem] border-rose-500/10 bg-background/95 backdrop-blur-3xl p-16 overflow-hidden">
                                <DialogHeader className="space-y-8 text-center">
                                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-rose-500/20 relative">
                                        <div className="absolute inset-0 bg-rose-500/10 blur-2xl rounded-full animate-pulse" />
                                        <RotateCcw className="w-10 h-10 text-rose-500 relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <DialogTitle className="text-4xl font-serif italic text-rose-500">Ritual Dissolution</DialogTitle>
                                        <DialogDescription className="text-[11px] uppercase tracking-[0.4em] font-black text-rose-400/40 leading-relaxed max-sm mx-auto">
                                            Initiating the ceremonial return of the manifested essence.
                                        </DialogDescription>
                                    </div>
                                </DialogHeader>

                                <div className="space-y-10 py-8">
                                    <Select value={returnReason} onValueChange={setReturnReason}>
                                        <SelectTrigger className="h-18 rounded-[2rem] bg-muted/5 border-border/5 px-10 text-[11px] font-black uppercase tracking-[0.3em] focus:ring-rose-500/20 transition-all shadow-inner">
                                            <SelectValue placeholder="Reason for Dissolution" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[2rem] border-border/10 bg-background/95 backdrop-blur-3xl">
                                            <SelectItem value="Scent mismatch" className="text-[11px] uppercase font-bold tracking-[0.2em] p-6 cursor-pointer hover:bg-primary/5">Aromatic Dissonance</SelectItem>
                                            <SelectItem value="Allergic reaction" className="text-[11px] uppercase font-bold tracking-[0.2em] p-6 cursor-pointer hover:bg-primary/5">Constitutional Reaction</SelectItem>
                                            <SelectItem value="Vessel damage" className="text-[11px] uppercase font-bold tracking-[0.2em] p-6 cursor-pointer hover:bg-primary/5">Vessel Fracture</SelectItem>
                                            <SelectItem value="Other" className="text-[11px] uppercase font-bold tracking-[0.2em] p-6 cursor-pointer hover:bg-primary/5">Unforeseen Path</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Textarea
                                        placeholder="Detail the circumstances of this ritual reversal..."
                                        className="min-h-[180px] rounded-[3rem] bg-muted/5 border-border/5 p-10 text-sm font-light leading-relaxed resize-none focus:bg-muted/10 shadow-inner"
                                        value={returnDetails}
                                        onChange={(e) => setReturnDetails(e.target.value)}
                                    />

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            className="w-full h-18 rounded-full bg-foreground text-background text-[12px] font-black uppercase tracking-[0.4em] hover:bg-rose-600 transition-all duration-700 shadow-2xl"
                                            onClick={submitReturnRequest}
                                            disabled={isSubmittingReturn || !returnReason}
                                        >
                                            {isSubmittingReturn ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Request Reversal"}
                                        </Button>
                                        <p className="text-[9px] text-center text-muted-foreground/30 uppercase tracking-[0.5em] font-black">Certify your intent for dissolution.</p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );

}

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <p className={`text-[10px] font-black uppercase tracking-widest ${className}`}>{children}</p>
);
