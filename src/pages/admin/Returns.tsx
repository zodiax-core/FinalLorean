import { useState, useEffect } from "react";
import {
    RotateCcw, Search, Eye, CheckCircle2,
    XCircle, Clock, DollarSign, User,
    Mail, MessageSquare, AlertTriangle,
    RefreshCcw, Loader2, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { returnsService } from "@/services/supabase";

interface ReturnRequest {
    id: number;
    order_id: string;
    customer_email: string;
    customer_name: string;
    reason: string;
    details?: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded';
    amount: number;
    created_at: string;
    orders?: any;
}

export default function AdminReturns() {
    const { toast } = useToast();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const data = await returnsService.getAll();
            setReturns(data || []);
        } catch (error) {
            console.error("Error fetching returns:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load return records." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected' | 'refunded') => {
        setIsProcessing(true);
        try {
            await returnsService.updateStatus(id, status);
            toast({
                title: `Return ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                description: `The return has been updated to ${status}.`
            });
            fetchReturns();
            setSelectedReturn(null);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update return status."
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredReturns = returns.filter(r =>
        r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        pending: returns.filter(r => r.status === 'pending').length,
        totalRefunded: returns.filter(r => r.status === 'refunded').reduce((acc, r) => acc + r.amount, 0),
        activeRequests: returns.filter(r => r.status !== 'refunded' && r.status !== 'rejected').length
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif italic">Returns & <span className="text-primary not-italic font-black uppercase tracking-tighter">Refunds</span></h1>
                    <p className="text-muted-foreground font-light text-sm mt-1 uppercase tracking-widest">Managing returns and refund requests</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2 border-2 border-primary/20 hover:bg-primary/5" onClick={fetchReturns}>
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-[2.5rem] border-border/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Clock className="w-16 h-16 group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Pending Review</p>
                    <h3 className="text-4xl font-serif font-black">{stats.pending} <span className="text-primary italic text-lg ml-2 font-normal">Requests</span></h3>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-border/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <DollarSign className="w-16 h-16 group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Refunded Amount</p>
                    <h3 className="text-4xl font-serif font-black">${stats.totalRefunded.toLocaleString()} <span className="text-primary italic text-lg ml-2 font-normal">Refunded</span></h3>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-border/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <RotateCcw className="w-16 h-16 group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Active Returns</p>
                    <h3 className="text-4xl font-serif font-black">{stats.activeRequests} <span className="text-primary italic text-lg ml-2 font-normal">In Progress</span></h3>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by customer name, email or order ID..."
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="glass rounded-[3rem] border-border/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                                        <p className="font-serif italic text-muted-foreground">Loading returns...</p>
                                    </td>
                                </tr>
                            ) : filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                            <RotateCcw className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="font-serif italic text-muted-foreground">No return requests found.</p>
                                    </td>
                                </tr>
                            ) : filteredReturns.map((r) => (
                                <tr key={r.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-xs text-muted-foreground uppercase opacity-40">#{r.order_id}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-serif font-bold text-lg">{r.customer_name}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{r.customer_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-serif font-black text-xl text-primary">${r.amount}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest border-none ${r.status === 'refunded' ? 'bg-emerald-500/10 text-emerald-500' :
                                            r.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                                                r.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {r.status}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs text-muted-foreground font-medium">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-background" onClick={() => setSelectedReturn(r)}>
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
                <DialogContent className="max-w-3xl rounded-[3.5rem] p-12 custom-scrollbar">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <RotateCcw className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-serif">Return <span className="text-primary italic">Details</span></DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Reference: {selectedReturn?.order_id}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedReturn && (
                        <div className="space-y-10 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <User className="w-3 h-3" /> Customer Information
                                        </h4>
                                        <div className="glass p-6 rounded-3xl space-y-3">
                                            <p className="text-xl font-serif">{selectedReturn.customer_name}</p>
                                            <p className="text-sm flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {selectedReturn.customer_email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3" /> Return Reason
                                        </h4>
                                        <div className="glass p-6 rounded-3xl space-y-2">
                                            <p className="font-bold text-sm italic">"{selectedReturn.reason}"</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <MessageSquare className="w-3 h-3" /> Additional Details
                                        </h4>
                                        <div className="glass p-6 rounded-3xl min-h-[140px]">
                                            <p className="text-xs font-light leading-relaxed">{selectedReturn.details || "No additional details provided."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border/10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Return Value</p>
                                    <p className="text-4xl font-serif font-black text-primary">${selectedReturn.amount}</p>
                                </div>
                                <div className="flex gap-3">
                                    {selectedReturn.status === 'pending' && (
                                        <>
                                            <Button variant="outline" className="h-14 px-8 rounded-full border-2 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white" onClick={() => handleUpdateStatus(selectedReturn.id, 'rejected')}>
                                                <XCircle className="w-4 h-4 mr-2" /> Reject
                                            </Button>
                                            <Button className="h-14 px-8 rounded-full shadow-lg shadow-primary/20 bg-primary" onClick={() => handleUpdateStatus(selectedReturn.id, 'approved')}>
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                            </Button>
                                        </>
                                    )}
                                    {selectedReturn.status === 'approved' && (
                                        <Button className="h-14 px-10 rounded-full shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleUpdateStatus(selectedReturn.id, 'refunded')}>
                                            <DollarSign className="w-4 h-4 mr-2" /> Issue Refund
                                        </Button>
                                    )}
                                    {selectedReturn.status === 'refunded' && (
                                        <div className="flex items-center gap-2 text-emerald-500 py-4 px-6 rounded-full bg-emerald-500/10 font-black uppercase tracking-widest text-[10px]">
                                            <CheckCircle2 className="w-4 h-4" /> Amount Refunded
                                        </div>
                                    )}
                                    {selectedReturn.status === 'rejected' && (
                                        <div className="flex items-center gap-2 text-red-500 py-4 px-6 rounded-full bg-red-500/10 font-black uppercase tracking-widest text-[10px]">
                                            <XCircle className="w-4 h-4" /> Return Rejected
                                        </div>
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
