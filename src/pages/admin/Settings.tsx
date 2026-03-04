import { useState, useEffect } from "react";
import {
    Bell, Save, Loader2, Layout, Sparkles, Plus, Trash2, Star, Edit2, Check, X
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
import { settingsService, productsService, Product } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    image?: string;
}

export default function AdminSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [configs, setConfigs] = useState<any>({
        marketing: {
            popup_product_id: null,
            hero_bar: {
                enabled: false,
                text: "Free shipping on orders over Rs. 5000",
                bg_color: "#000000",
                text_color: "#ffffff"
            },
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

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getAllConfigs();
            setConfigs((prev: any) => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Settings fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load settings." });
        } finally {
            setLoading(false);
        }

        try {
            const allProducts = await productsService.getAll();
            setProducts(allProducts);
        } catch (error) {
            console.error("Products fetch error:", error);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await settingsService.updateConfig('marketing', configs.marketing);
            if (user) {
                await settingsService.createAdminLog(user.id, 'Updated marketing settings', { category: 'marketing' });
            }
            toast({ title: "Marketing Saved", description: "All marketing settings have been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Failed to save settings." });
        } finally {
            setSubmitting(false);
        }
    };

    const updateHeroBar = (field: string, value: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            marketing: {
                ...prev.marketing,
                hero_bar: { ...prev.marketing.hero_bar, [field]: value }
            }
        }));
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
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading marketing settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-5xl font-serif tracking-tight">Marketing <span className="text-primary italic">Studio</span></h1>
                    <p className="text-muted-foreground font-light">Configure promotional copy, banners, popups, and testimonials.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={submitting}
                    className="h-14 px-10 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary"
                >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-3" />Saving...</> : <><Save className="w-4 h-4 mr-3" />Save All</>}
                </Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

                {/* Hero Banner */}
                <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                    <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-border/5">
                        <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                            <Layout className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-serif italic">Hero Banner</CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Sticky announcement bar at the top of all pages</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="flex items-center justify-between p-6 rounded-[2rem] bg-muted/20 border border-border/10">
                            <div>
                                <h4 className="font-serif font-black italic">Enable Hero Bar</h4>
                                <p className="text-xs text-muted-foreground">Display a sticky notification strip at the top of the site</p>
                            </div>
                            <Switch
                                checked={configs.marketing?.hero_bar?.enabled}
                                onCheckedChange={(v) => updateHeroBar('enabled', v)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner Text</Label>
                            <Input
                                value={configs.marketing?.hero_bar?.text || ""}
                                onChange={(e) => updateHeroBar('text', e.target.value)}
                                placeholder="e.g. Free shipping on orders over Rs. 5000"
                                className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Background Color</Label>
                                <div className="flex gap-3">
                                    <Input type="color" value={configs.marketing?.hero_bar?.bg_color || "#000000"}
                                        onChange={(e) => updateHeroBar('bg_color', e.target.value)}
                                        className="w-12 h-12 rounded-xl p-1 bg-muted/20 border-none cursor-pointer" />
                                    <Input value={configs.marketing?.hero_bar?.bg_color || "#000000"}
                                        onChange={(e) => updateHeroBar('bg_color', e.target.value)}
                                        className="h-12 rounded-xl bg-muted/20 border-none px-4 font-mono text-xs uppercase" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Text Color</Label>
                                <div className="flex gap-3">
                                    <Input type="color" value={configs.marketing?.hero_bar?.text_color || "#ffffff"}
                                        onChange={(e) => updateHeroBar('text_color', e.target.value)}
                                        className="w-12 h-12 rounded-xl p-1 bg-muted/20 border-none cursor-pointer" />
                                    <Input value={configs.marketing?.hero_bar?.text_color || "#ffffff"}
                                        onChange={(e) => updateHeroBar('text_color', e.target.value)}
                                        className="h-12 rounded-xl bg-muted/20 border-none px-4 font-mono text-xs uppercase" />
                                </div>
                            </div>
                        </div>
                        {/* Live preview */}
                        {configs.marketing?.hero_bar?.enabled && (
                            <div className="rounded-2xl overflow-hidden border border-border/20">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-4 py-2 bg-muted/10">Live Preview</div>
                                <div
                                    className="px-6 py-3 text-center text-xs font-bold"
                                    style={{ backgroundColor: configs.marketing.hero_bar.bg_color, color: configs.marketing.hero_bar.text_color }}
                                >
                                    {configs.marketing.hero_bar.text || "Banner text preview"}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

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
