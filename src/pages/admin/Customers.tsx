import { useState, useEffect } from "react";
import {
    Search, User, Mail, Shield, ShieldOff,
    MoreHorizontal, Eye, ShoppingBag, DollarSign,
    ArrowUpRight, Clock, Trash2, Ban, ShieldCheck,
    RefreshCcw, Loader2, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    order_count: number;
    total_spent: number;
    is_banned?: boolean;
    last_sign_in?: string;
    avatar_url?: string;
}

export default function AdminCustomers() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerOrders, setCustomerOrders] = useState<any[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('email, full_name, total_amount, created_at')
                .order('created_at', { ascending: false });

            if (orderError) throw orderError;

            const customerMap: Record<string, Customer> = {};

            orderData?.forEach(order => {
                if (!customerMap[order.email]) {
                    customerMap[order.email] = {
                        id: order.email,
                        email: order.email,
                        full_name: order.full_name || "Customer",
                        created_at: order.created_at,
                        order_count: 0,
                        total_spent: 0,
                        is_banned: false
                    };
                }
                customerMap[order.email].order_count += 1;
                customerMap[order.email].total_spent += Number(order.total_amount);
                if (new Date(order.created_at) < new Date(customerMap[order.email].created_at)) {
                    customerMap[order.email].created_at = order.created_at;
                }
            });

            setCustomers(Object.values(customerMap));
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load customer database." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomerDetail = async (customer: Customer) => {
        setIsLoadingOrders(true);
        setSelectedCustomer(customer);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('email', customer.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomerOrders(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to retrieve customer history." });
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const handleBan = (customer: Customer) => {
        toast({
            title: "Security Request Initiated",
            description: `A request to ban ${customer.email} has been sent to the server.`,
        });
        setCustomers(prev => prev.map(c => c.email === customer.email ? { ...c, is_banned: !c.is_banned } : c));
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif">Customer <span className="text-primary italic">Insights</span></h1>
                    <p className="text-muted-foreground font-light text-sm mt-1 uppercase tracking-widest">Managing the Lorean community</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2 border-2" onClick={fetchCustomers}>
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Database
                    </Button>
                </div>
            </header>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search customers by name or email..."
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground font-serif italic">Loading customers...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredCustomers.map((customer) => (
                            <motion.div
                                key={customer.email}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass rounded-[2.5rem] p-8 border-border/10 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                            >
                                {customer.is_banned && (
                                    <div className="absolute inset-0 bg-destructive/10 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                        <Badge variant="destructive" className="scale-150 font-black uppercase tracking-[0.2em] shadow-2xl">Banned</Badge>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden">
                                        {customer.avatar_url ? (
                                            <img src={customer.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <User className="w-8 h-8" />
                                        )}
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl z-20">
                                            <DropdownMenuItem onClick={() => fetchCustomerDetail(customer)} className="rounded-xl gap-3 cursor-pointer">
                                                <Eye className="w-4 h-4" /> View History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl gap-3 cursor-pointer">
                                                <Mail className="w-4 h-4" /> Send Email
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleBan(customer)} className="rounded-xl gap-3 cursor-pointer text-destructive">
                                                {customer.is_banned ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                {customer.is_banned ? "Revoke Ban" : "Ban Customer"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-serif font-black tracking-tight truncate">{customer.full_name}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2 truncate opacity-60">
                                            <Mail className="w-3 h-3" /> {customer.email}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/5 space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orders</p>
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="w-3 h-3 text-primary" />
                                                <span className="text-xl font-serif font-black">{customer.order_count}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/5 space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spent</p>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-3 h-3 text-primary" />
                                                <span className="text-xl font-serif font-black">${customer.total_spent.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/5 mt-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>Customer since {new Date(customer.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-12 custom-scrollbar">
                    <DialogHeader>
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                                <User className="w-10 h-10" />
                            </div>
                            <div>
                                <DialogTitle className="text-4xl font-serif">{selectedCustomer?.full_name}</DialogTitle>
                                <DialogDescription className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                    Customer Insights Summary / {selectedCustomer?.email}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedCustomer && (
                        <div className="space-y-12 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass p-8 rounded-3xl space-y-2 text-center">
                                    <p className="text-4xl font-serif font-black text-primary">${selectedCustomer.total_spent.toFixed(2)}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lifetime Spend</p>
                                </div>
                                <div className="glass p-8 rounded-3xl space-y-2 text-center">
                                    <p className="text-4xl font-serif font-black text-primary">{selectedCustomer.order_count}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Orders</p>
                                </div>
                                <div className="glass p-8 rounded-3xl space-y-2 text-center">
                                    <p className="text-4xl font-serif font-black text-primary">${(selectedCustomer.total_spent / selectedCustomer.order_count).toFixed(2)}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Order Value</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <ShoppingBag className="w-3 h-3" /> Order History
                                </h4>
                                <div className="glass rounded-[2rem] overflow-hidden border-border/10">
                                    {isLoadingOrders ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="bg-muted/30">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/5">
                                                {customerOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                                                        <td className="px-6 py-5 font-black text-xs text-muted-foreground uppercase opacity-40">ORD-{order.id.toString().slice(0, 8)}</td>
                                                        <td className="px-6 py-5 font-serif font-bold text-lg text-primary">${order.total_amount}</td>
                                                        <td className="px-6 py-5">
                                                            <Badge className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-black tracking-widest border-none ${order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-5 text-xs text-muted-foreground font-medium">{new Date(order.created_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
