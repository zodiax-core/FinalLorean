import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { RotateCcw, ShieldCheck, HelpCircle, Search, ArrowRight, CheckCircle2, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ordersService, returnsService, Order } from "@/services/supabase";
import { useNavigate } from "react-router-dom";

const Returns = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState<'info' | 'find' | 'select' | 'success'>('info');
    const [loading, setLoading] = useState(false);
    const [searchData, setSearchData] = useState({ orderId: "", email: "" });
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [returnReason, setReturnReason] = useState("");

    const handleFindOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchData.orderId || !searchData.email) return;

        setLoading(true);
        try {
            // Support both short_id and full UUID
            let order = await ordersService.getByShortId(searchData.orderId);
            if (!order) {
                order = await ordersService.getById(searchData.orderId);
            }

            if (order && order.email?.toLowerCase() === searchData.email.toLowerCase()) {
                setFoundOrder(order);
                setStep('select');
            } else {
                toast({
                    variant: "destructive",
                    title: "Order not found",
                    description: "We couldn't find an order matching those details."
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong while searching for your order."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReturn = async () => {
        if (selectedItems.length === 0) {
            toast({ variant: "destructive", title: "Selection Required", description: "Please select at least one item to return." });
            return;
        }
        setLoading(true);
        try {
            await returnsService.createRequest({
                order_id: foundOrder?.id,
                customer_email: foundOrder?.email,
                items: selectedItems,
                reason: returnReason,
                status: 'pending'
            });
            setStep('success');
            toast({ title: "Return Requested", description: "Your return request has been submitted for review." });
        } catch (error) {
            toast({ variant: "destructive", title: "Submission Failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Progress Indicator */}
                    {step !== 'info' && (
                        <div className="flex justify-center mb-12">
                            <div className="flex items-center gap-4">
                                {['find', 'select', 'success'].map((s, idx) => (
                                    <div key={s} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-primary text-white' :
                                            (['select', 'success'].includes(step) && idx === 0) || (step === 'success' && idx === 1) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        {idx < 2 && <div className={`w-12 h-0.5 mx-2 ${(['select', 'success'].includes(step) && idx === 0) || (step === 'success' && idx === 1) ? 'bg-primary/20' : 'bg-muted'}`} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center"
                            >
                                <div className="mb-16">
                                    <h1 className="text-4xl md:text-6xl font-serif mb-6">Returns & <span className="text-primary italic">Refunds</span></h1>
                                    <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                                        Our "Happiness Guarantee" means if you're not satisfied, neither are we. We offer simple and free returns within 30 days.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <RotateCcw className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-medium">30-Day Window</h3>
                                        <p className="text-sm text-muted-foreground">Return any product within 30 days of receiving it for a full refund.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <ShieldCheck className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-medium">Free Returns</h3>
                                        <p className="text-sm text-muted-foreground">We provide a prepaid shipping label for all returns within Pakistan.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <HelpCircle className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-medium">Instant Support</h3>
                                        <p className="text-sm text-muted-foreground">Our care team is available 24/7 to help you with the returns process.</p>
                                    </div>
                                </div>

                                <div className="bg-card p-12 rounded-[3.5rem] border border-border shadow-2xl max-w-2xl mx-auto">
                                    <h2 className="text-3xl font-serif mb-6 italic">Start a Return</h2>
                                    <p className="text-muted-foreground mb-10 font-light">Enter your details to initiate a return or track your current order status.</p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-12 h-16 border-2 border-primary/20 hover:bg-primary/5 transition-all text-sm font-black uppercase tracking-widest"
                                            onClick={() => navigate('/track')}
                                        >
                                            Track Order
                                        </Button>
                                        <Button
                                            className="rounded-full px-12 h-16 bg-primary shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest hover:scale-105 transition-all"
                                            onClick={() => setStep('find')}
                                        >
                                            Start Process <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'find' && (
                            <motion.div
                                key="find"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-md mx-auto"
                            >
                                <div className="bg-card p-10 rounded-[3rem] border border-border shadow-2xl space-y-8">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-serif italic">Find Your Order</h2>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Verification Required</p>
                                    </div>

                                    <form onSubmit={handleFindOrder} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Order ID / ID (Short)</Label>
                                            <Input
                                                value={searchData.orderId}
                                                onChange={e => setSearchData(p => ({ ...p, orderId: e.target.value }))}
                                                placeholder="LRN-1234"
                                                className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-lg font-serif italic"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</Label>
                                            <Input
                                                type="email"
                                                value={searchData.email}
                                                onChange={e => setSearchData(p => ({ ...p, email: e.target.value }))}
                                                placeholder="your@email.com"
                                                className="h-14 rounded-2xl bg-muted/20 border-none px-6"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setStep('info')}
                                                className="h-14 rounded-2xl flex-1"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="h-14 rounded-2xl flex-[2] bg-primary group"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Locate Ritual</>}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {step === 'select' && foundOrder && (
                            <motion.div
                                key="select"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="bg-card p-10 rounded-[3rem] border border-border shadow-2xl">
                                    <div className="flex items-center justify-between mb-8 border-b border-border/10 pb-6">
                                        <div>
                                            <h2 className="text-2xl font-serif italic">Select Items</h2>
                                            <p className="text-sm text-muted-foreground">Order #{foundOrder.short_id || foundOrder.id.slice(0, 8)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${foundOrder.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                                {foundOrder.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        {foundOrder.items.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    const id = `${item.id}-${idx}`;
                                                    setSelectedItems(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
                                                }}
                                                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedItems.includes(`${item.id}-${idx}`) ? 'border-primary bg-primary/5 shadow-inner' : 'border-border/50 hover:border-primary/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-serif italic text-lg">{item.name}</h4>
                                                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.includes(`${item.id}-${idx}`) ? 'bg-primary border-primary text-white' : 'border-border'
                                                    }`}>
                                                    {selectedItems.includes(`${item.id}-${idx}`) && <CheckCircle2 className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 mb-10">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Reason for Return</Label>
                                        <Textarea
                                            value={returnReason}
                                            onChange={e => setReturnReason(e.target.value)}
                                            placeholder="e.g. Item damaged on arrival, wrong product received, etc."
                                            className="min-h-[120px] rounded-[2rem] bg-muted/20 border-none p-6 text-sm font-light leading-relaxed resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setStep('find')}
                                            className="h-16 rounded-3xl flex-1 text-sm font-bold uppercase tracking-widest"
                                        >
                                            Change Order
                                        </Button>
                                        <Button
                                            onClick={handleSubmitReturn}
                                            disabled={loading || selectedItems.length === 0}
                                            className="h-16 rounded-3xl flex-[2] bg-primary shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Return Request'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-md mx-auto text-center"
                            >
                                <div className="bg-card p-12 rounded-[4rem] border border-border shadow-2xl space-y-8">
                                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-serif italic text-primary">Manifested</h2>
                                        <p className="text-muted-foreground font-light leading-relaxed">
                                            Your return request has been submitted. Our team will review it and send further instructions to <strong>{foundOrder?.email}</strong> within 24-48 hours.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/')}
                                        className="w-full h-16 rounded-[2rem] bg-primary shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest"
                                    >
                                        Return Home
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Returns;
