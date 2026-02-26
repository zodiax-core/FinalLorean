import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ArrowLeft, ShieldCheck, CreditCard,
    Truck, Gift, BadgeCheck, Plus, Minus, Trash2,
    Wallet, Banknote, ShoppingBag, Lock, Loader2, Sparkles, CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ordersService, settingsService, discountsService, notificationService } from "@/services/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";

const Checkout = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { cartItems, updateQuantity, removeFromCart, subtotal, clearCart } = useCart();

    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [promoCode, setPromoCode] = useState("");
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [includeGiftWrap, setIncludeGiftWrap] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [shippingRates, setShippingRates] = useState({ flat_rate: 15, threshold: 150 });
    const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        receiverName: "",
        receiverPhone: "",
        nearestFamousPlace: ""
    });

    useEffect(() => {
        const setupCheckout = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setFormData(prev => ({ ...prev, email: user.email || "" }));
                }

                const rates = await settingsService.getShipping();
                setShippingRates({
                    flat_rate: Number(rates.flat_rate),
                    threshold: Number(rates.threshold)
                });
            } catch (error) {
                console.error("Auth error:", error);
            } finally {
                setLoading(false);
            }
        };
        setupCheckout();
    }, []);

    const shipping = useMemo(() => (subtotal > shippingRates.threshold ? 0 : shippingRates.flat_rate), [subtotal, shippingRates]);
    const tax = useMemo(() => subtotal * 0.08, [subtotal]);

    const discountAmount = useMemo(() => {
        if (!appliedDiscount) return 0;
        if (appliedDiscount.discount_type === 'percentage') {
            return subtotal * (appliedDiscount.discount_value / 100);
        } else {
            return Number(appliedDiscount.discount_value);
        }
    }, [appliedDiscount, subtotal]);

    const giftWrapCost = useMemo(() => (includeGiftWrap ? 5 : 0), [includeGiftWrap]);
    const total = useMemo(() => subtotal + shipping + tax - discountAmount + giftWrapCost, [subtotal, shipping, tax, discountAmount, giftWrapCost]);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);
        try {
            const discountData = await discountsService.getByCode(promoCode);

            if (discountData) {
                // Check expiry
                if (discountData.expiration_date && new Date(discountData.expiration_date) < new Date()) {
                    toast({ variant: "destructive", title: "Code Expired", description: "This promo code has expired." });
                    return;
                }

                // Check usage
                if (discountData.max_uses && discountData.used_count >= discountData.max_uses) {
                    toast({ variant: "destructive", title: "Code Exhausted", description: "This promo code has reached its maximum usage limit." });
                    return;
                }

                setAppliedDiscount(discountData);
                setIsPromoApplied(true);
                toast({
                    title: "Promo Applied!",
                    description: `You received ${discountData.discount_value}${discountData.discount_type === 'percentage' ? '%' : ' Rs.'} off your order.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Invalid Code",
                    description: "This promo code is not valid.",
                });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Sync Error", description: "Failed to validate promo code." });
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!formData.email || !formData.address) {
            toast({ variant: "destructive", title: "Missing Info", description: "Please complete the shipping details." });
            setStep(1);
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const orderPayload = {
                user_id: user?.id || null,
                full_name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postalCode,
                receiver_name: formData.receiverName,
                receiver_phone: formData.receiverPhone,
                nearest_famous_place: formData.nearestFamousPlace,
                subtotal_amount: subtotal,
                shipping_amount: shipping,
                tax_amount: tax,
                discount_amount: discountAmount,
                discount_code: appliedDiscount?.code || null,
                total_amount: total,
                status: 'pending', // All orders start as pending for manifest verification
                payment_method: paymentMethod,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                }))
            };

            const newOrder = await ordersService.create(orderPayload);

            if (isPromoApplied && appliedDiscount) {
                try {
                    await discountsService.incrementUsage(appliedDiscount.id);
                } catch (discountError) {
                    console.error("Discount usage increment failed:", discountError);
                }
            }

            // Create Push Notification for Admin via Edge Function
            try {
                // Trigger Edge Function for FCM
                await supabase.functions.invoke('push-notifications', {
                    body: {
                        type: 'new_order',
                        payload: {
                            title: "New Order Alert",
                            message: `Order #${newOrder?.id?.slice(0, 8)} - Rs. ${total.toFixed(0)}`,
                            url: "/admin/orders"
                        }
                    }
                });
            } catch (notifyError) {
                console.warn("Notification triggers completed with warnings:", notifyError);
            }

            clearCart();

            toast({
                title: "Order Placed Successfully!",
                description: "Your order is confirmed. A confirmation email will be sent shortly.",
            });

            setTimeout(() => navigate("/order-success", { state: { order: newOrder } }), 1500);
        } catch (error: any) {
            console.error("Order error:", error);
            toast({ variant: "destructive", title: "Order Failed", description: error?.message || "An error occurred while placing your order. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-serif text-lg animate-pulse">Preparing your checkout...</p>
            </div>
        );
    }

    if (cartItems.length === 0 && !submitting) {
        return (
            <div className="min-h-screen bg-background text-center py-40 px-4">
                <Navbar />
                <div className="max-w-md mx-auto glass p-12 rounded-[3rem] border-border/30">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-8 text-muted-foreground/30" />
                    <h2 className="text-3xl font-serif mb-6">Your Cart is Empty</h2>
                    <p className="text-muted-foreground mb-10 font-light">You haven't added any items yet.</p>
                    <Button onClick={() => navigate('/shop')} className="w-full h-14 rounded-full text-lg shadow-xl shadow-primary/20">Back to Shop</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* Left Column: Forms */}
                    <div className="flex-1 space-y-12">
                        {/* Indicators */}
                        <div className="flex items-center justify-between max-w-sm mb-12 px-2 sm:px-0">
                            {[
                                { n: 1, l: "Details" },
                                { n: 2, l: "Pay" },
                                { n: 3, l: "Final" }
                            ].map((s) => (
                                <div key={s.n} className="flex flex-col items-center gap-2 md:gap-3">
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-500 ${step >= s.n ? "border-primary bg-primary text-white shadow-lg shadow-primary/30" : "border-border text-muted-foreground"}`}>
                                        {step > s.n ? <BadgeCheck className="w-6 h-6" /> : s.n}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.n ? "text-primary" : "text-muted-foreground/50"}`}>{s.l}</span>
                                </div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step-1"
                                    initial={{ opacity: 0, x: -25 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 25 }}
                                    className="space-y-8"
                                >
                                    <div className="glass p-10 rounded-[3rem] border-border/20 shadow-xl">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <Truck className="w-7 h-7 text-primary" />
                                            </div>
                                            <h2 className="text-3xl font-serif tracking-tight">Shipping <span className="text-primary italic">Intelligence</span></h2>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">First Identity</Label>
                                                <Input
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                    placeholder="Jane"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Last Identity</Label>
                                                <Input
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                    placeholder="Doe"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-6">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Communication Email</Label>
                                            <Input
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="jane@lorean.com"
                                                className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2 mb-6">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Physical Location</Label>
                                            <Input
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="123 Luxury Avenue"
                                                className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2 mb-6">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nearest Famous Place (Landmark)</Label>
                                            <Input
                                                value={formData.nearestFamousPlace}
                                                onChange={e => setFormData({ ...formData, nearestFamousPlace: e.target.value })}
                                                placeholder="Near Eiffel Tower"
                                                className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Receiver's Name</Label>
                                                <Input
                                                    value={formData.receiverName}
                                                    onChange={e => setFormData({ ...formData, receiverName: e.target.value })}
                                                    placeholder="Receiver Name"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Phone Number</Label>
                                                <Input
                                                    value={formData.receiverPhone}
                                                    onChange={e => setFormData({ ...formData, receiverPhone: e.target.value })}
                                                    placeholder="+1 234 567 890"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">City</Label>
                                                <Input
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    placeholder="Paris"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">State</Label>
                                                <Input
                                                    value={formData.state}
                                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                    placeholder="ILE"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Postal</Label>
                                                <Input
                                                    value={formData.postalCode}
                                                    onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                                                    placeholder="75001"
                                                    className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:bg-background transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={() => setStep(2)} className="h-16 w-full rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 group">
                                        Next Phase <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step-2"
                                    initial={{ opacity: 0, x: -25 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 25 }}
                                    className="space-y-8"
                                >
                                    <div className="glass p-10 rounded-[3rem] border-border/20 shadow-xl">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <Lock className="w-7 h-7 text-primary" />
                                            </div>
                                            <h2 className="text-3xl font-serif tracking-tight">Secure <span className="text-primary italic">Investment</span></h2>
                                        </div>

                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-6">
                                            <Label className={`flex items-center gap-6 p-8 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                <RadioGroupItem value="cod" />
                                                <Banknote className="w-6 h-6 text-muted-foreground" />
                                                <div className="flex-1 font-serif text-2xl">Cash on Delivery (COD)</div>
                                            </Label>
                                        </RadioGroup>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={() => setStep(1)} className="h-16 px-10 rounded-full border-2">
                                            <ArrowLeft className="w-5 h-5 mr-3" /> Back
                                        </Button>
                                        <Button onClick={() => setStep(3)} className="h-16 flex-1 rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30">
                                            Final Review
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step-3"
                                    initial={{ opacity: 0, x: -25 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 25 }}
                                    className="space-y-8"
                                >
                                    <div className="glass p-10 rounded-[3rem] border-border/20 shadow-xl overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <ShoppingBag className="w-32 h-32 -rotate-12" />
                                        </div>
                                        <div className="flex items-center gap-4 mb-10 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <Sparkles className="w-7 h-7 text-primary" />
                                            </div>
                                            <h2 className="text-3xl font-serif tracking-tight">Final <span className="text-primary italic">Authentication</span></h2>
                                        </div>

                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                            {cartItems.map((item) => (
                                                <div key={item.id} className="flex gap-6 p-6 rounded-3xl bg-muted/30 border border-border/50 group">
                                                    <img src={item.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg transition-transform group-hover:scale-105" alt="" />
                                                    <div className="flex-1 py-1">
                                                        <h4 className="font-serif text-xl mb-1">{item.name}</h4>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-primary font-bold tracking-tight">Rs. {item.price}</p>
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground/50">Qty: {item.quantity}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-4">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50 hover:bg-primary hover:text-white transition-all"><Minus className="w-3 h-3" /></button>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50 hover:bg-primary hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
                                                            <button onClick={() => removeFromCart(item.id)} className="ml-auto text-muted-foreground hover:text-destructive p-2"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={() => setStep(2)} className="h-16 px-10 rounded-full border-2">
                                            <ArrowLeft className="w-5 h-5 mr-3" /> Back
                                        </Button>
                                        <Button
                                            disabled={submitting}
                                            onClick={handlePlaceOrder}
                                            className="h-16 flex-1 rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary"
                                        >
                                            {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Lock className="w-5 h-5 mr-3" />}
                                            {submitting ? "Processing..." : `Complete - Rs. ${total.toFixed(0)}`}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Dynamic Summary */}
                    <div className="w-full lg:w-[450px]">
                        <div className="sticky top-32 space-y-8">
                            <div className="glass p-10 rounded-[3rem] border-border/20 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                                <h3 className="text-2xl font-serif mb-10 tracking-tight">Order <span className="text-primary italic text-balance">Summary</span></h3>

                                <div className="space-y-6 mb-10">
                                    <div className="flex justify-between text-muted-foreground font-medium text-sm">
                                        <span>Subtotal</span>
                                        <span className="text-foreground">Rs. {subtotal.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground font-medium text-sm">
                                        <span>Shipping</span>
                                        <span className={shipping === 0 ? "text-primary font-bold" : "text-foreground"}>{shipping === 0 ? "Complimentary" : `Rs. ${shipping.toFixed(0)}`}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground font-medium text-sm">
                                        <span>Tax (8%)</span>
                                        <span className="text-foreground">Rs. {tax.toFixed(0)}</span>
                                    </div>
                                    {isPromoApplied && appliedDiscount && (
                                        <div className="flex justify-between text-green-600 font-black uppercase text-[10px] tracking-widest">
                                            <span>Patron Discount ({appliedDiscount.discount_value}{appliedDiscount.discount_type === 'percentage' ? '%' : ' Rs.'})</span>
                                            <span>-Rs. {discountAmount.toFixed(0)}</span>
                                        </div>
                                    )}
                                    <Separator className="bg-border/30" />
                                    <div className="flex justify-between items-end pt-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total</p>
                                            <span className="text-xl font-serif italic">Order Total</span>
                                        </div>
                                        <span className="text-4xl font-serif font-black text-primary">Rs. {total.toFixed(0)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Promo Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="LOREAN15"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            className="rounded-2xl h-14 bg-muted/30 border-none px-6 uppercase font-bold tracking-widest"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={handleApplyPromo}
                                            disabled={isApplyingPromo || isPromoApplied}
                                            className="rounded-2xl h-14 px-8 border-2 hover:bg-primary hover:text-white transition-all"
                                        >
                                            {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPromoApplied ? <CheckCircle2 className="w-4 h-4" /> : "Apply")}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badge Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center group hover:bg-primary/5 transition-colors border-border/10">
                                    <ShieldCheck className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-tight">SSL<br />Secured</span>
                                </div>
                                <div className="glass p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center group hover:bg-primary/5 transition-colors border-border/10">
                                    <BadgeCheck className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Verified<br />Merchants</span>
                                </div>
                            </div>

                            <p className="text-[10px] text-center text-muted-foreground/60 p-4 font-light leading-relaxed">
                                Your privacy is protected. All transactions are encrypted end-to-end.
                                By proceeding, you accept our <Link to="/terms" className="underline hover:text-primary">Terms & Conditions</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Checkout;
