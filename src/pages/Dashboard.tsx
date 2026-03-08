import { useState, useEffect } from "react";
import {
    Package, Truck, Clock,
    ArrowLeft, ExternalLink, RefreshCcw,
    RotateCcw, ShieldCheck, MapPin,
    CreditCard, Calendar, User, MessageSquare,
    Star, Send, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ordersService, returnsService, reviewsService } from "@/services/supabase";
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
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20">
                <header className="mb-20">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary/60 mb-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Private Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif tracking-tight">
                            Identity: <span className="text-primary italic">{user?.user_metadata?.full_name || "Patron"}</span>
                        </h1>
                        <p className="text-muted-foreground/60 font-light text-base max-w-lg">Manage your botanical lineage and ritual history in one minimalist space.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Simplified Stats/Shortcuts */}
                    <div className="lg:col-span-4 space-y-12">
                        <section className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Archive Links</h3>
                            <nav className="flex flex-col gap-1">
                                {[
                                    { icon: Calendar, label: "Schedule Routine" },
                                    { icon: MapPin, label: "Locations" },
                                    { icon: CreditCard, label: "Artifacts & Payments" },
                                    { icon: MessageSquare, label: "Support Rituals" }
                                ].map((item, i) => (
                                    <button key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-border/50 transition-all text-sm font-medium text-foreground group">
                                        <item.icon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        {item.label}
                                    </button>
                                ))}
                            </nav>
                        </section>

                        <div className="p-8 rounded-[2.5rem] bg-black text-white space-y-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-serif italic text-primary">Inner Circle Access</h3>
                            <p className="text-xs font-light leading-relaxed opacity-60 uppercase tracking-widest">
                                Your Patron status grants priority manifestation on upcoming seasonal botanical collections.
                            </p>
                        </div>
                    </div>

                    {/* Clean Orders History */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="flex items-center justify-between border-b border-border/10 pb-6">
                            <h2 className="text-2xl font-serif">Ritual History</h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{orders.length} Manifestations</span>
                        </div>

                        {orders.length === 0 ? (
                            <div className="py-20 text-center space-y-8">
                                <Package className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                                <div className="space-y-2">
                                    <p className="font-serif italic text-xl">The archives are empty.</p>
                                    <p className="text-muted-foreground text-sm uppercase tracking-widest">Begin your botanical journey today.</p>
                                </div>
                                <Button onClick={() => navigate("/shop")} className="h-12 px-10 rounded-full bg-primary text-xs font-black uppercase tracking-widest">Shop Collection</Button>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {orders.map((order) => (
                                    <div key={order.id} className="group relative">
                                        <div className="flex flex-col md:flex-row justify-between gap-8 pb-10 border-b border-border/10">
                                            <div className="space-y-6 flex-1">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">#{order.short_id || order.id.slice(0, 8)}</span>
                                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'
                                                        }`}>
                                                        {order.status}
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{new Date(order.created_at).toLocaleDateString()}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-4">
                                                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex flex-col gap-1 w-24">
                                                            <div className="aspect-square rounded-xl bg-white border border-border/10 overflow-hidden flex items-center justify-center p-2">
                                                                <img src={item.image || '/placeholder.png'} className="w-full h-full object-contain opacity-80" alt="" />
                                                            </div>
                                                            <p className="text-[8px] font-black uppercase tracking-widest truncate">{item.name}</p>
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 3 && (
                                                        <div className="w-24 aspect-square rounded-xl bg-muted/20 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                                                            +{order.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-end gap-6">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Value</p>
                                                    <p className="text-3xl font-serif italic text-primary">Rs. {order.total_amount}</p>
                                                </div>
                                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => navigate(`/track/${order.short_id || order.id.slice(0, 8)}`)}
                                                        className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 hover:bg-black hover:text-white hover:border-black transition-all"
                                                    >
                                                        Track
                                                    </Button>
                                                    {order.status === 'delivered' && (
                                                        <Button
                                                            variant="link"
                                                            className="h-8 p-0 text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-all justify-end"
                                                            onClick={() => setSelectedOrderForFeedback(order)}
                                                        >
                                                            Submit Insight
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Simplified Feedback Dialog */}
                <Dialog open={!!selectedOrderForFeedback} onOpenChange={() => !isSubmittingFeedback && setSelectedOrderForFeedback(null)}>
                    <DialogContent className="max-w-md rounded-[2.5rem] p-10 bg-white border-none shadow-2xl">
                        <DialogHeader className="text-center space-y-4">
                            <DialogTitle className="text-2xl font-serif italic">Patron Insight</DialogTitle>
                            <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground/60">
                                Share the manifestation of this essence.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 py-4">
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setFeedbackRating(star)} className="transition-transform active:scale-90">
                                        <Star className={`w-8 h-8 transition-colors ${feedbackRating >= star ? "fill-primary text-primary" : "text-border"}`} />
                                    </button>
                                ))}
                            </div>

                            <Textarea
                                placeholder="Describe the ritual outcome..."
                                className="min-h-[120px] rounded-2xl bg-muted/30 border-none p-5 text-sm font-light italic"
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                            />

                            <Button
                                className="w-full h-14 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                                onClick={submitFeedback}
                                disabled={isSubmittingFeedback || !feedbackComment.trim()}
                            >
                                {isSubmittingFeedback ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Archive Insight"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Minimal Return Dialog */}
                <Dialog open={!!selectedOrderForReturn} onOpenChange={() => !isSubmittingReturn && setSelectedOrderForReturn(null)}>
                    <DialogContent className="max-w-md rounded-[2.5rem] p-10 bg-white border-none shadow-2xl">
                        <DialogHeader className="text-center space-y-2">
                            <DialogTitle className="text-2xl font-serif italic">Ritual Reversal</DialogTitle>
                            <DialogDescription className="text-[8px] uppercase tracking-[0.3em] font-black text-rose-400">
                                Dissolving the manifestation.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <Select value={returnReason} onValueChange={setReturnReason}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none px-5 text-xs">
                                    <SelectValue placeholder="Reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Scent mismatch">Scent mismatch</SelectItem>
                                    <SelectItem value="Allergic reaction">Allergic reaction</SelectItem>
                                    <SelectItem value="Vessel damage">Vessel damage</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            <Textarea
                                placeholder="Reason details..."
                                className="min-h-[100px] rounded-2xl bg-muted/30 border-none p-5 text-xs font-light"
                                value={returnDetails}
                                onChange={(e) => setReturnDetails(e.target.value)}
                            />

                            <Button
                                className="w-full h-14 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest"
                                onClick={submitReturnRequest}
                                disabled={isSubmittingReturn || !returnReason}
                            >
                                {isSubmittingReturn ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Initiate Reversal"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>

            <Footer />
        </div>
    );
}

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <p className={`text-[10px] font-black uppercase tracking-widest ${className}`}>{children}</p>
);
