import { useState, useEffect } from "react";
import {
    Tag, Plus, Search, Trash2, Edit2,
    Calendar, Users, Percent, DollarSign,
    Clock, CheckCircle2, XCircle, RefreshCcw,
    Loader2, ArrowRight, ShieldCheck, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { discountsService } from "@/services/supabase";

interface Discount {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses?: number;
    used_count: number;
    expiration_date?: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminDiscounts() {
    const { toast } = useToast();
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<Discount>>({
        code: "",
        discount_type: 'percentage',
        discount_value: 0,
        max_uses: undefined,
        expiration_date: "",
        is_active: true
    });

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const data = await discountsService.getAll();
            setDiscounts(data || []);
        } catch (error) {
            console.error("Error fetching discounts:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load discount records." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const handleSave = async () => {
        if (!formData.code || !formData.discount_value) {
            toast({ variant: "destructive", title: "Incomplete Form", description: "All fields are required." });
            return;
        }

        setIsSubmitting(true);
        try {
            await discountsService.create(formData);
            toast({ title: "Promo Code Created", description: "The new discount code is now live." });
            setIsDialogOpen(false);
            setFormData({
                code: "",
                discount_type: 'percentage',
                discount_value: 0,
                max_uses: undefined,
                expiration_date: "",
                is_active: true
            });
            fetchDiscounts();
        } catch (error) {
            toast({ variant: "destructive", title: "Creation Error", description: "The code already exists or the request was interrupted." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this promo code? This cannot be undone.")) return;
        try {
            await discountsService.delete(id);
            toast({ title: "Code Deleted", description: "The discount has been removed from the store." });
            fetchDiscounts();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "The code could not be deleted." });
        }
    };

    const filteredDiscounts = discounts.filter(d =>
        d.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif italic">Promo <span className="text-primary not-italic font-black uppercase tracking-tighter">Codes</span></h1>
                    <p className="text-muted-foreground font-light text-sm mt-1 uppercase tracking-widest">Managing store discounts and promotions</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2 border-2 border-primary/20 hover:bg-primary/5" onClick={fetchDiscounts}>
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} className="h-12 rounded-2xl gap-2 shadow-xl shadow-primary/20 bg-primary">
                        <Plus className="w-5 h-5" /> New Discount Code
                    </Button>
                </div>
            </header>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search active codes..."
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="glass rounded-[2.5rem] p-8 h-64 animate-pulse bg-muted/10 border-none" />
                        ))
                    ) : filteredDiscounts.length === 0 ? (
                        <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-2 border-border/20">
                            <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="font-serif italic text-muted-foreground">No active discount codes found.</p>
                        </div>
                    ) : filteredDiscounts.map((discount) => (
                        <motion.div
                            key={discount.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass rounded-[2.5rem] p-8 border-border/10 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    {discount.discount_type === 'percentage' ? <Percent className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-lg text-destructive" onClick={() => handleDelete(discount.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-3xl font-serif font-black tracking-tighter text-primary uppercase">{discount.code}</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">
                                        Discount Value: {discount.discount_value}{discount.discount_type === 'percentage' ? '%' : ' Rs.'} Off
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-muted/10 border border-border/5 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Usage Limit</p>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3 h-3 text-primary" />
                                            <span className="text-sm font-bold">{discount.used_count} / {discount.max_uses || '∞'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/10 border border-border/5 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Expiry Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-primary" />
                                            <span className="text-sm font-bold truncate">
                                                {discount.expiration_date ? new Date(discount.expiration_date).toLocaleDateString() : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border/5">
                                    <div className="flex items-center gap-2">
                                        {discount.is_active && (!discount.expiration_date || new Date(discount.expiration_date) > new Date()) && (!discount.max_uses || discount.used_count < discount.max_uses) ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 rounded-full text-[8px] font-black uppercase tracking-widest">Active</Badge>
                                        ) : (
                                            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10 rounded-full text-[8px] font-black uppercase tracking-widest">Expired</Badge>
                                        )}
                                    </div>
                                    <p className="text-[8px] text-muted-foreground uppercase font-black opacity-30">Created: {new Date(discount.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[3.5rem] p-12 custom-scrollbar overflow-hidden bg-background/95 backdrop-blur-2xl">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                            <Gift className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-4xl font-serif text-center">
                            Create <span className="text-primary italic">Discount Code</span>
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground font-light text-base">
                            Define a new discount code to reward your customers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Discount Code</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="SUMMER25"
                                className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-lg font-serif italic uppercase"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Discount Type</Label>
                            <Select
                                value={formData.discount_type}
                                onValueChange={(v: any) => setFormData({ ...formData, discount_type: v })}
                            >
                                <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-6">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount (Rs.)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Discount Amount</Label>
                            <div className="relative">
                                {formData.discount_type === 'percentage' ? (
                                    <Percent className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                                ) : (
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black opacity-50">Rs.</span>
                                )}
                                <Input
                                    type="number"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-xl font-serif font-black"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Usage Limit (Max Uses)</Label>
                            <div className="relative">
                                <Users className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                                <Input
                                    type="number"
                                    value={formData.max_uses}
                                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="Unlimited"
                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-xl font-serif font-black"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 md:col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Expiration Date</Label>
                            <div className="relative">
                                <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                                <Input
                                    type="date"
                                    value={formData.expiration_date}
                                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 font-serif italic"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full h-16 rounded-full bg-primary text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 group"
                            onClick={handleSave}
                            disabled={isSubmitting || !formData.code}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Create Code
                                    <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
