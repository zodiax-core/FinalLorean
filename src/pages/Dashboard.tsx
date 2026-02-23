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
            // In a more complex app, we'd loop through all items in the order
            // For now, we'll review the first item as a representation of the ritual
            const firstItem = selectedOrderForFeedback.items?.[0];

            await reviewsService.create({
                product_id: firstItem?.id || null, // Assuming item id corresponds to product id
                user_id: user.id,
                user_name: user.user_metadata?.full_name || "Lorean Patron",
                user_email: user.email,
                rating: feedbackRating,
                comment: feedbackComment,
                status: 'pending' // Admin must approve
            });

            toast({
                title: "Insights Received",
                description: "Your botanical feedback has been successfully archived and is awaiting guardian verification."
            });

            setSelectedOrderForFeedback(null);
            setFeedbackComment("");
            setFeedbackRating(5);
        } catch (error) {
            console.error("Feedback error:", error);
            toast({
                variant: "destructive",
                title: "Critique Failed",
                description: "The botanical archives could not store your insights. Please try again."
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
                description: "Your request for ritual reversal has been broadcast to the guardians."
            });

            setSelectedOrderForReturn(null);
            setReturnReason("");
            setReturnDetails("");
        } catch (error) {
            console.error("Return error:", error);
            toast({
                variant: "destructive",
                title: "Reversal Failed",
                description: "The botanical portal rejected your return request. Please try again later."
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
                <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
                <p className="font-serif italic text-muted-foreground animate-pulse">Consulting the botanical archives...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <ShieldCheck className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Patron Portal</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-serif tracking-tight">
                            Welcome, <span className="text-primary italic">{user?.user_metadata?.full_name?.split(' ')[0] || "Patron"}</span>
                        </h1>
                        <p className="text-muted-foreground font-light text-xl">Review your botanical lineage and active rituals.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="h-14 px-8 rounded-full border-2 gap-2" onClick={fetchOrders}>
                            <RefreshCcw className="w-4 h-4" /> Refresh Status
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Left Rail: Patron Intel */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="glass p-8 rounded-[3rem] border-border/10 shadow-sm space-y-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Patron Identity</Label>
                                <div className="p-4 rounded-2xl bg-muted/30 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-serif font-bold truncate">{user?.user_metadata?.full_name || "Lorean Patron"}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ritual Shortcuts</Label>
                                <nav className="space-y-2">
                                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-xs gap-3 font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                        <Calendar className="w-4 h-4" /> Schedule Routine
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-xs gap-3 font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                        <MapPin className="w-4 h-4" /> Manage Locations
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-xs gap-3 font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
                                        <CreditCard className="w-4 h-4" /> Payment Artifacts
                                    </Button>
                                </nav>
                            </div>
                        </div>

                        <div className="bg-primary rounded-[2.5rem] p-8 text-primary-foreground space-y-6 shadow-2xl shadow-primary/20">
                            <Clock className="w-8 h-8 opacity-50" />
                            <h3 className="text-2xl font-serif italic">The Inner Circle</h3>
                            <p className="text-xs font-light leading-relaxed opacity-80 uppercase tracking-widest">
                                Patrons receive priority manifestation on upcoming seasonal botanical collections.
                            </p>
                        </div>
                    </div>

                    {/* Right Rail: Orders History */}
                    <div className="lg:col-span-3 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-serif">Ritual <span className="text-primary italic">History</span></h2>
                            <Badge className="bg-muted text-foreground px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest border-none">{orders.length} Records</Badge>
                        </div>

                        {orders.length === 0 ? (
                            <div className="glass p-20 rounded-[4rem] text-center space-y-8 border-border/10">
                                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                                    <Package className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-serif">No Active Rituals</h3>
                                    <p className="text-muted-foreground font-light">Your botanical selection is currently empty.</p>
                                </div>
                                <Button onClick={() => navigate("/shop")} className="h-14 px-10 rounded-full text-lg shadow-xl shadow-primary/20 bg-primary">Begin Journey</Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass rounded-[3rem] border-border/10 overflow-hidden hover:shadow-2xl transition-all duration-500 group"
                                    >
                                        <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8">
                                            <div className="space-y-6 flex-1">
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ritual Ref: {order.short_id || "LRN-" + order.id.slice(0, 8)}</span>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest">
                                                        {order.status}
                                                    </Badge>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{new Date(order.created_at).toLocaleDateString()}</span>
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {order.items?.slice(0, 4).map((item: any) => (
                                                        <div key={item.id} className="group/item">
                                                            <div className="aspect-square rounded-2xl bg-muted/50 overflow-hidden mb-2 border border-border/10">
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-serif p-2 text-center opacity-40 italic">{item.name}</div>
                                                            </div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest truncate">{item.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Qty: {item.quantity}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-end gap-6 text-right">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Ritual Value</p>
                                                    <p className="text-4xl font-serif font-black text-primary">Rs. {order.total_amount}</p>
                                                </div>
                                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                                    <Button
                                                        onClick={() => navigate(`/track/${order.short_id || order.id.slice(0, 8)}`)}
                                                        className="h-12 px-8 rounded-full gap-2 shadow-lg shadow-primary/20"
                                                    >
                                                        <Truck className="w-4 h-4" /> Track Manifestation
                                                    </Button>
                                                    {order.status === 'delivered' && (
                                                        <Button
                                                            variant="outline"
                                                            className="h-12 px-8 rounded-full gap-2 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                                                            onClick={() => setSelectedOrderForFeedback(order)}
                                                        >
                                                            <MessageSquare className="w-4 h-4" /> Share Ritual Feedback
                                                        </Button>
                                                    )}
                                                    {order.status === 'delivered' && (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-12 px-8 rounded-full gap-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                                                            onClick={() => setSelectedOrderForReturn(order)}
                                                        >
                                                            <RotateCcw className="w-4 h-4" /> Request Return
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

                {/* Feedback Dialog Portal */}
                <Dialog open={!!selectedOrderForFeedback} onOpenChange={() => !isSubmittingFeedback && setSelectedOrderForFeedback(null)}>
                    <DialogContent className="max-w-xl rounded-[3.5rem] p-12 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/10">
                        <DialogHeader className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <DialogTitle className="text-3xl font-serif">Share Your <span className="text-primary italic">Experience</span></DialogTitle>
                            <DialogDescription className="text-muted-foreground font-light text-base">
                                Your insights help us refine the botanical rituals for seluruh humanity.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-10 py-6">
                            <div className="space-y-4">
                                <UILabel className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Experiential Accuracy</UILabel>
                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFeedbackRating(star)}
                                            className="transition-transform active:scale-95"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-colors ${feedbackRating >= star ? "fill-primary text-primary shadow-xl shadow-primary/20" : "text-muted/30"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <UILabel className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Observational Comment</UILabel>
                                <Textarea
                                    placeholder="Describe the sensations and outcomes of this botanical essence..."
                                    className="min-h-[150px] rounded-3xl bg-muted/20 border-border/10 focus:bg-background transition-all p-6 font-light leading-relaxed"
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full h-16 rounded-full bg-primary text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 group"
                                onClick={submitFeedback}
                                disabled={isSubmittingFeedback || !feedbackComment.trim()}
                            >
                                {isSubmittingFeedback ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Archive Insights
                                        <Send className="ml-3 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Return Request Portal */}
                <Dialog open={!!selectedOrderForReturn} onOpenChange={() => !isSubmittingReturn && setSelectedOrderForReturn(null)}>
                    <DialogContent className="max-w-xl rounded-[3.5rem] p-12 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/10">
                        <DialogHeader className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto">
                                <RotateCcw className="w-8 h-8 text-rose-500" />
                            </div>
                            <DialogTitle className="text-3xl font-serif">Ritual <span className="text-rose-500 italic">Reversal</span></DialogTitle>
                            <DialogDescription className="text-muted-foreground font-light text-base">
                                We regret that the botanical ritual did not align with your destiny.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 py-6">
                            <div className="space-y-4">
                                <UILabel className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Dissolution Reason</UILabel>
                                <Select value={returnReason} onValueChange={setReturnReason}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-6">
                                        <SelectValue placeholder="Select reason for reversal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Scent mismatch">Scent mismatch</SelectItem>
                                        <SelectItem value="Allergic reaction">Allergic interaction</SelectItem>
                                        <SelectItem value="Vessel damage">Vessel damage</SelectItem>
                                        <SelectItem value="Delayed manifestation">Delayed manifestation</SelectItem>
                                        <SelectItem value="Other path">Other mystical reasons</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <UILabel className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Narrative Details</UILabel>
                                <Textarea
                                    placeholder="Describe the misalignment..."
                                    className="min-h-[120px] rounded-3xl bg-muted/20 border-none p-6 text-sm font-light leading-relaxed"
                                    value={returnDetails}
                                    onChange={(e) => setReturnDetails(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full h-16 rounded-full bg-rose-500 text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/20 group"
                                onClick={submitReturnRequest}
                                disabled={isSubmittingReturn || !returnReason}
                            >
                                {isSubmittingReturn ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Consign Reversal
                                        <Send className="ml-3 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
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
