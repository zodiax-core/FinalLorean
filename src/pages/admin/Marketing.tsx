import { useState, useEffect } from "react";
import {
    Bell, Save, Loader2, Sparkles, Plus, Trash2, Star, Edit2, Check, X, Mail, Send
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { settingsService, productsService, Product, marketingService, NewsletterSubscription, Order, ordersService } from "@/services/supabase";
import { emailService } from "@/services/email";
import { useAuth } from "@/context/AuthContext";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    image?: string;
}

export default function AdminMarketing() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [configs, setConfigs] = useState<any>({
        marketing: {
            popup_product_id: null,
            testimonials: []
        }
    });
    const [products, setProducts] = useState<Product[]>([]);

    // Testimonials editor state
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
        name: "", role: "", content: "", rating: 5, image: ""
    });
    const [showAddForm, setShowAddForm] = useState(false);

    // Inner Circle state
    const [subscribers, setSubscribers] = useState<NewsletterSubscription[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [broadcast, setBroadcast] = useState({
        subject: "The New Ritual Arrival",
        logo_url: "https://lorean.online/logo.png",
        event_image: "",
        event_title: "Exclusive Botanicals",
        event_description: "The spirits have whispered of new essences waiting for you.",
        primary_button_text: "Discover Rituals",
        primary_button_link: "https://lorean.online/shop",
        shop_link: "https://lorean.online/shop",
        about_link: "https://lorean.online/about"
    });
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [sendingOrders, setSendingOrders] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [data, allProducts, subs, allOrders] = await Promise.all([
                    settingsService.getAllConfigs(),
                    productsService.getAll(),
                    marketingService.getSubscriptions(),
                    ordersService.getAll()
                ]);
                setConfigs(data);
                setProducts(allProducts);
                setSubscribers(subs);
                setOrders(allOrders.slice(0, 20));
            } catch (error) {
                console.error("Marketing fetch error:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load marketing data." });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await settingsService.updateConfig('marketing', configs.marketing);
            toast({ title: "Manifested", description: "Your marketing transformations have been preserved." });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed", description: "The ritual was interrupted." });
        } finally {
            setSubmitting(false);
        }
    };


    const handleSendBroadcast = async () => {
        if (!broadcast.subject || !broadcast.event_description) {
            toast({ variant: "destructive", title: "Inquire", description: "Subject and Description are essential for a ritual." });
            return;
        }

        if (subscribers.length === 0) {
            toast({ variant: "destructive", title: "No Souls Found", description: "The Inner Circle is empty. No one to broadcast to." });
            return;
        }

        setSendingBroadcast(true);
        let successCount = 0;
        let failCount = 0;

        try {
            toast({ title: "Initiating Ritual", description: `Summoning spirits for ${subscribers.length} souls...` });

            for (const sub of subscribers) {
                try {
                    await emailService.sendEmail({
                        ...broadcast,
                        to_email: sub.email,
                        to_name: "Subscriber"
                    }, 'broadcast');
                    successCount++;
                } catch (err) {
                    console.error(`Failed to send broadcast to ${sub.email}:`, err);
                    failCount++;
                }
            }

            toast({
                title: "Broadcast Complete",
                description: `Successfully reached ${successCount} souls.${failCount > 0 ? ` (${failCount} failed to manifest)` : ''}`
            });
        } catch (e: any) {
            console.error("Broadcast Process Error:", e);
            toast({
                variant: "destructive",
                title: "Ritual Interrupted",
                description: "A major disruption occurred in the broadcast ritual."
            });
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleSendOrderConfirmations = async () => {
        if (selectedOrders.length === 0) {
            toast({ variant: "destructive", title: "Selection Required", description: "Choose at least one ritual order to confirm." });
            return;
        }

        setSendingOrders(true);
        let successCount = 0;

        try {
            toast({ title: "Confirming Rituals", description: `Sending confirmations for ${selectedOrders.length} orders...` });

            for (const orderId of selectedOrders) {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    try {
                        await emailService.sendOrderConfirmation(order);
                        successCount++;
                    } catch (err) {
                        console.error(`Failed to send order confirmation for ${orderId}:`, err);
                    }
                }
            }

            toast({
                title: "Rituals Dispatched",
                description: `Successfully confirmed ${successCount} order manifestations.`
            });
            setSelectedOrders([]);
        } catch (e) {
            toast({ variant: "destructive", title: "Failed", description: "The order confirmation ritual failed." });
        } finally {
            setSendingOrders(false);
        }
    };

    const testimonials: Testimonial[] = configs.marketing?.testimonials || [];

    const addTestimonial = () => {
        if (!newTestimonial.name || !newTestimonial.content) return;
        const entry: Testimonial = {
            id: Date.now().toString(),
            name: newTestimonial.name || "",
            role: newTestimonial.role || "",
            content: newTestimonial.content || "",
            rating: newTestimonial.rating || 5,
            image: newTestimonial.image || ""
        };
        setConfigs((prev: any) => ({
            ...prev,
            marketing: {
                ...prev.marketing,
                testimonials: [...testimonials, entry]
            }
        }));
        setNewTestimonial({ name: "", role: "", content: "", rating: 5, image: "" });
        setShowAddForm(false);
    };

    const removeTestimonial = (id: string) => {
        setConfigs((prev: any) => ({
            ...prev,
            marketing: {
                ...prev.marketing,
                testimonials: testimonials.filter(t => t.id !== id)
            }
        }));
    };

    const saveEditedTestimonial = () => {
        if (!editingTestimonial) return;
        setConfigs((prev: any) => ({
            ...prev,
            marketing: {
                ...prev.marketing,
                testimonials: testimonials.map(t => t.id === editingTestimonial.id ? editingTestimonial : t)
            }
        }));
        setEditingTestimonial(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                <p className="font-serif italic text-muted-foreground animate-pulse">Summoning Marketing Spirits...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Boutique Ecosystem</span>
                        <span className="w-1 h-1 rounded-full bg-primary/30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Marketing Studio</span>
                    </div>
                    <h1 className="text-5xl font-serif italic mb-2">Marketing <span className="text-primary not-italic font-bold">Studio</span></h1>
                    <p className="text-muted-foreground font-light max-w-xl">Curate your brand's presence, manage your inner circle, and broadcast ancient wisdom to your patrons.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={submitting}
                    className="h-14 px-10 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary"
                >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-3" />Preserving...</> : <><Save className="w-4 h-4 mr-3" />Save All Changes</>}
                </Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

                {/* Popup Product */}
                <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                    <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-border/5">
                        <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-serif italic">Entry Popup</CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Product shown in modal on first visit</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Select Featured Product</Label>
                        <Select
                            value={configs.marketing?.popup_product_id?.toString() || "none"}
                            onValueChange={(v) => setConfigs((prev: any) => ({
                                ...prev,
                                marketing: { ...prev.marketing, popup_product_id: v === "none" ? null : parseInt(v) }
                            }))}
                        >
                            <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-6">
                                <SelectValue placeholder="No active popup" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Disabled)</SelectItem>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground font-light px-2 italic">
                            This product will be shown in a modal when visitors first enter the boutique.
                        </p>
                    </CardContent>
                </Card>

                {/* Inner Circle / Newsletter */}
                <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                    <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-border/5">
                        <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                            <Mail className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-serif italic">The Inner Circle</CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Email subscribers and marketing automation</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Subscribers list */}
                            <div className="lg:col-span-1 space-y-6">
                                <h4 className="font-serif italic text-xl">Subscribers <span className="text-xs font-sans not-italic text-muted-foreground ml-2 font-normal">({subscribers.length})</span></h4>
                                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-primary/10">
                                    {subscribers.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic py-8 text-center border border-dashed rounded-[2rem]">No subscribers yet.</p>
                                    ) : (
                                        subscribers.map(sub => (
                                            <div key={sub.id} className="p-4 rounded-2xl bg-muted/10 border border-border/5 flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{sub.email}</p>
                                                    <p className="text-[10px] text-muted-foreground">{new Date(sub.subscribed_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-rose-500'}`} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Broadcast form */}
                            <div className="lg:col-span-2 space-y-8 p-10 rounded-[3rem] bg-primary/[0.02] border border-primary/5">
                                <div className="space-y-1">
                                    <h4 className="font-serif italic text-2xl text-primary">Send Ritual Broadcast</h4>
                                    <p className="text-xs text-muted-foreground opacity-70">Summon a beautiful, high-fidelity message to your Inner Circle.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Logo URL</Label>
                                        <Input
                                            value={broadcast.logo_url}
                                            onChange={e => setBroadcast(p => ({ ...p, logo_url: e.target.value }))}
                                            placeholder="https://lorean.online/logo.png"
                                            className="h-12 rounded-[1.5rem] bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Hero Banner Image URL</Label>
                                        <Input
                                            value={broadcast.event_image}
                                            onChange={e => setBroadcast(p => ({ ...p, event_image: e.target.value }))}
                                            placeholder="https://images.unsplash.com/..."
                                            className="h-12 rounded-[1.5rem] bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Subject</Label>
                                        <Input
                                            value={broadcast.subject}
                                            onChange={e => setBroadcast(p => ({ ...p, subject: e.target.value }))}
                                            placeholder="The New Moon Ritual..."
                                            className="h-12 rounded-[1.5rem] bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Event Title</Label>
                                        <Input
                                            value={broadcast.event_title}
                                            onChange={e => setBroadcast(p => ({ ...p, event_title: e.target.value }))}
                                            placeholder="Exclusive Arrival"
                                            className="h-12 rounded-[1.5rem] bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Message Description</Label>
                                        <Textarea
                                            value={broadcast.event_description}
                                            onChange={e => setBroadcast(p => ({ ...p, event_description: e.target.value }))}
                                            placeholder="Tell the story of this ritual..."
                                            rows={4}
                                            className="rounded-[2rem] bg-white border-none px-6 py-4 resize-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Primary Button Text</Label>
                                        <Input
                                            value={broadcast.primary_button_text}
                                            onChange={e => setBroadcast(p => ({ ...p, primary_button_text: e.target.value }))}
                                            className="h-12 rounded-xl bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Primary Button Link</Label>
                                        <Input
                                            value={broadcast.primary_button_link}
                                            onChange={e => setBroadcast(p => ({ ...p, primary_button_link: e.target.value }))}
                                            className="h-12 rounded-xl bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Shop Link</Label>
                                        <Input
                                            value={broadcast.shop_link}
                                            onChange={e => setBroadcast(p => ({ ...p, shop_link: e.target.value }))}
                                            className="h-12 rounded-xl bg-white border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">About Link</Label>
                                        <Input
                                            value={broadcast.about_link}
                                            onChange={e => setBroadcast(p => ({ ...p, about_link: e.target.value }))}
                                            className="h-12 rounded-xl bg-white border-none px-6"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSendBroadcast}
                                    disabled={sendingBroadcast || subscribers.length === 0}
                                    className="w-full h-16 rounded-[2rem] bg-primary text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                                >
                                    {sendingBroadcast ? <><Loader2 className="w-4 h-4 animate-spin mr-3" />Summoning...</> : <><Send className="w-4 h-4 mr-3" />Disperse Broadcast</>}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Confirmation Resend */}
                <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                    <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-border/5">
                        <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-3xl font-serif italic">Manual Ritual Confirmation</CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Select orders to re-send the botanical confirmation email</CardDescription>
                        </div>
                        <Button
                            onClick={handleSendOrderConfirmations}
                            disabled={sendingOrders || selectedOrders.length === 0}
                            className="rounded-full h-12 px-8 bg-primary text-xs font-bold uppercase tracking-widest"
                        >
                            {sendingOrders ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send to ${selectedOrders.length} Orders`}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin">
                            {orders.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground italic">No recent ritual orders found.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {orders.map(order => (
                                        <div
                                            key={order.id}
                                            onClick={() => setSelectedOrders(prev =>
                                                prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                                            )}
                                            className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedOrders.includes(order.id)
                                                ? "border-primary bg-primary/5 shadow-inner"
                                                : "border-border/10 bg-muted/10 hover:border-primary/30"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedOrders.includes(order.id) ? "bg-primary border-primary" : "border-muted-foreground/30"
                                                    }`}>
                                                    {selectedOrders.includes(order.id) && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-serif font-bold text-sm">#{(order.short_id || order.id).slice(0, 8)} - {order.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.email} • Rs. {order.total_amount}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] bg-muted px-3 py-1 rounded-full uppercase font-bold tracking-tighter opacity-60">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Testimonials Manager */}
                <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                    <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between border-b border-border/5">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                                <Star className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-serif italic">Testimonials</CardTitle>
                                <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Homepage "Loved by Thousands" section</CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddForm(v => !v)}
                            variant="outline"
                            className="rounded-full h-12 px-6 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Testimonial
                        </Button>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6">
                        {/* Add form */}
                        {showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="glass rounded-[2.5rem] p-8 border border-primary/10 space-y-6"
                            >
                                <h3 className="font-serif italic text-xl text-primary">New Testimonial</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Name *</Label>
                                        <Input value={newTestimonial.name} onChange={e => setNewTestimonial(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Emma Thompson" className="h-12 rounded-2xl bg-muted/20 border-none px-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Role / Title</Label>
                                        <Input value={newTestimonial.role} onChange={e => setNewTestimonial(p => ({ ...p, role: e.target.value }))}
                                            placeholder="Hair Stylist" className="h-12 rounded-2xl bg-muted/20 border-none px-5" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Testimonial *</Label>
                                        <Textarea value={newTestimonial.content} onChange={e => setNewTestimonial(p => ({ ...p, content: e.target.value }))}
                                            placeholder="Their experience with Lorean..." rows={3}
                                            className="rounded-[1.5rem] bg-muted/20 border-none px-5 py-4 resize-none font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Avatar Image URL</Label>
                                        <Input value={newTestimonial.image} onChange={e => setNewTestimonial(p => ({ ...p, image: e.target.value }))}
                                            placeholder="https://..." className="h-12 rounded-2xl bg-muted/20 border-none px-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Rating</Label>
                                        <div className="flex gap-2 items-center h-12">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button key={s} type="button" onClick={() => setNewTestimonial(p => ({ ...p, rating: s }))}>
                                                    <Star className={`w-7 h-7 transition-colors ${s <= (newTestimonial.rating || 5) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={addTestimonial} className="rounded-full px-8 h-11 bg-primary font-black uppercase tracking-widest text-xs">
                                        <Check className="w-4 h-4 mr-2" /> Add to Homepage
                                    </Button>
                                    <Button onClick={() => setShowAddForm(false)} variant="ghost" className="rounded-full px-6 h-11">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Testimonial list */}
                        {testimonials.length === 0 ? (
                            <div className="py-16 text-center space-y-3 border-2 border-dashed border-border/20 rounded-[3rem]">
                                <Star className="w-10 h-10 mx-auto text-primary/20" />
                                <p className="font-serif italic text-lg text-muted-foreground">No testimonials yet.</p>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Add testimonials above to show them on the homepage.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {testimonials.map((t) => (
                                    <div key={t.id} className="glass rounded-[2rem] border-border/10 overflow-hidden">
                                        {editingTestimonial?.id === t.id ? (
                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input value={editingTestimonial.name} onChange={e => setEditingTestimonial(p => p ? { ...p, name: e.target.value } : p)}
                                                        className="h-11 rounded-2xl bg-muted/20 border-none px-5" placeholder="Name" />
                                                    <Input value={editingTestimonial.role} onChange={e => setEditingTestimonial(p => p ? { ...p, role: e.target.value } : p)}
                                                        className="h-11 rounded-2xl bg-muted/20 border-none px-5" placeholder="Role" />
                                                    <Input value={editingTestimonial.image || ""} onChange={e => setEditingTestimonial(p => p ? { ...p, image: e.target.value } : p)}
                                                        className="h-11 rounded-2xl bg-muted/20 border-none px-5" placeholder="Image URL" />
                                                    <div className="flex gap-2 items-center h-11">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <button key={s} type="button" onClick={() => setEditingTestimonial(p => p ? { ...p, rating: s } : p)}>
                                                                <Star className={`w-6 h-6 ${s <= editingTestimonial.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Textarea value={editingTestimonial.content} onChange={e => setEditingTestimonial(p => p ? { ...p, content: e.target.value } : p)}
                                                    rows={3} className="rounded-[1.5rem] bg-muted/20 border-none px-5 py-3 resize-none" />
                                                <div className="flex gap-3">
                                                    <Button onClick={saveEditedTestimonial} size="sm" className="rounded-full px-6 bg-primary text-xs font-black uppercase tracking-widest">
                                                        <Check className="w-3.5 h-3.5 mr-1.5" /> Save
                                                    </Button>
                                                    <Button onClick={() => setEditingTestimonial(null)} size="sm" variant="ghost" className="rounded-full px-4">
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-5 p-5">
                                                {t.image ? (
                                                    <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-primary/10" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0">
                                                        {t.name.slice(0, 1)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-0.5">
                                                        <span className="font-serif font-bold text-sm">{t.name}</span>
                                                        {t.role && <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">{t.role}</span>}
                                                        <div className="flex gap-0.5">
                                                            {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-light italic truncate">"{t.content}"</p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <Button onClick={() => setEditingTestimonial(t)} size="icon" variant="ghost" className="w-9 h-9 rounded-full hover:text-primary">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => removeTestimonial(t.id)} size="icon" variant="ghost" className="w-9 h-9 rounded-full hover:text-rose-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
