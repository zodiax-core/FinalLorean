import { useState, useEffect } from "react";
import {
    Star, MessageSquare, Trash2, CheckCircle, EyeOff,
    Flag, Sparkles, Filter, Search, Loader2, MoreVertical,
    Reply, History, AlertTriangle, ShieldCheck, User,
    Calendar, Package, ExternalLink, Clock, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { reviewsService, productsService } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState<string>("all");
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const [selectedReview, setSelectedReview] = useState<any | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
    const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
    const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
    const [newReview, setNewReview] = useState({
        product_id: "",
        rating: 5,
        user_name: "",
        user_email: "",
        comment: "",
        status: "approved"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rData, lData, pData] = await Promise.all([
                reviewsService.getAll(),
                reviewsService.getLogs(),
                productsService.getAll()
            ]);
            setReviews(rData);
            setLogs(lData);
            setProducts(pData);
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load reviews." });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await reviewsService.update(id, { status });
            toast({ title: "Status Updated", description: `Review is now ${status}.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update review status." });
        }
    };

    const handleToggleFeatured = async (id: string, is_featured: boolean) => {
        try {
            await reviewsService.update(id, { is_featured: !is_featured });
            toast({ title: is_featured ? "Review Hidden" : "Review Featured", description: `Review visibility updated.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Operation Failed", description: "Could not adjust feature status." });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            await reviewsService.delete(id);
            toast({ title: "Review Deleted", description: "The review has been removed from records." });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "The review could not be deleted." });
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            await reviewsService.update(selectedReview.id, { admin_reply: replyText });
            toast({ title: "Reply Sent", description: "Your response has been published." });
            setIsReplyDialogOpen(false);
            setReplyText("");
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Reply Failed", description: "Could not publish your response." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReview = async () => {
        if (!newReview.product_id || !newReview.user_name || !newReview.comment) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Product, Name, and Comment are required." });
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewsService.create({
                ...newReview,
                product_id: parseInt(newReview.product_id),
                is_featured: false,
                is_flagged: false,
                created_at: new Date().toISOString()
            });
            toast({ title: "Review Manifested", description: "Anonymous review has been added to the archives." });
            setIsAddReviewOpen(false);
            setNewReview({
                product_id: "",
                rating: 5,
                user_name: "",
                user_email: "",
                comment: "",
                status: "approved"
            });
            fetchData();
        } catch (error) {
            console.error("Add review error:", error);
            toast({ variant: "destructive", title: "Creation Failed", description: "The review could not be committed." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch =
            review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.products?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRating = filterRating === "all" || review.rating.toString() === filterRating;
        const matchesProduct = filterProduct === "all" || review.product_id?.toString() === filterProduct;
        const matchesStatus = filterStatus === "all" || (filterStatus === "flagged" ? review.is_flagged : review.status === filterStatus);

        return matchesSearch && matchesRating && matchesProduct && matchesStatus;
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Average Rating</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{averageRating}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Across {reviews.length} reviews</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Approval</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{reviews.filter(r => r.status === 'pending').length}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest text-amber-500">Awaiting verification</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Featured Reviews</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{reviews.filter(r => r.is_featured).length}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest text-indigo-500">Visible on storefront</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flagged Reviews</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Flag className="h-4 w-4 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{reviews.filter(r => r.is_flagged).length}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest text-rose-500">Needs review</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-1 items-center gap-4 w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search reviews..."
                                    className="pl-10 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="h-12 px-6 rounded-xl gap-2" onClick={() => setIsLogsDialogOpen(true)}>
                                <History className="w-4 h-4" /> Audit Logs
                            </Button>
                            <Button className="h-12 px-6 rounded-xl gap-2 bg-primary text-white" onClick={() => setIsAddReviewOpen(true)}>
                                <Star className="w-4 h-4" /> Add Review
                            </Button>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Select value={filterRating} onValueChange={setFilterRating}>
                                <SelectTrigger className="w-[120px] h-12 rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Rating" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stars</SelectItem>
                                    <SelectItem value="5">5 Stars</SelectItem>
                                    <SelectItem value="4">4 Stars</SelectItem>
                                    <SelectItem value="3">3 Stars</SelectItem>
                                    <SelectItem value="2">2 Stars</SelectItem>
                                    <SelectItem value="1">1 Star</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="hidden">Hidden</SelectItem>
                                    <SelectItem value="flagged">Flagged / Spam</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterProduct} onValueChange={setFilterProduct}>
                                <SelectTrigger className="w-[180px] h-12 rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Product" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Products</SelectItem>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="glass p-20 rounded-[4rem] text-center space-y-6 border-border/10">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto opacity-20">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <p className="text-muted-foreground font-serif italic text-lg">No reviews match your current filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredReviews.map((review) => (
                            <motion.div
                                key={review.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass group rounded-[2.5rem] border-border/10 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                            >
                                <div className="p-8 flex flex-col md:flex-row gap-8">
                                    <div className="md:w-64 space-y-6 shrink-0">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <Package className="w-3 h-3" /> Product
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden">
                                                    <img src={review.products?.image || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <p className="font-serif font-bold text-sm truncate">{review.products?.name || "Unknown Product"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <User className="w-3 h-3" /> Customer
                                            </p>
                                            <div className="p-3 rounded-2xl bg-muted/30 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                    {review.user_name ? review.user_name[0] : "C"}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold truncate">{review.user_name || "Anonymous"}</p>
                                                    <p className="text-[9px] text-muted-foreground truncate">{review.user_email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            <Badge variant="outline" className="w-full justify-center h-8 rounded-full text-[10px] uppercase font-black border-none bg-muted/50 hidden md:flex">
                                                <Calendar className="w-3 h-3 mr-2 opacity-50" />
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </Badge>
                                            {review.is_flagged && (
                                                <Badge className="w-full justify-center h-8 rounded-full text-[10px] uppercase font-black bg-rose-500/10 text-rose-500 border-none animate-pulse">
                                                    <Flag className="w-3 h-3 mr-2" /> Flagged as Spam
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} className={`w-5 h-5 ${review.rating >= s ? "fill-primary text-primary" : "text-muted/20"}`} />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`rounded-full text-[9px] font-black uppercase tracking-widest px-3 py-1 ${review.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    review.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {review.status}
                                                </Badge>
                                                {review.is_featured && (
                                                    <Badge className="bg-primary/10 text-primary border-none rounded-full text-[9px] font-black uppercase tracking-widest px-3 py-1">
                                                        <Sparkles className="w-3 h-3 mr-1" /> Featured
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="glass p-6 rounded-3xl border-border/5 bg-background/40">
                                            <p className="text-lg font-light leading-relaxed font-serif italic">"{review.comment}"</p>
                                        </div>

                                        {review.admin_reply && (
                                            <div className="ml-8 space-y-3">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                                    <ShieldCheck className="w-3 h-3" /> Admin Response
                                                </div>
                                                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 relative">
                                                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary rounded-full" />
                                                    <p className="text-sm font-medium italic">"{review.admin_reply}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:w-48 flex flex-col gap-2 shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="w-full bg-muted/20 rounded-2xl h-12 gap-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <MoreVertical className="w-4 h-4" /> Manage Review
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-black flex items-center gap-2 px-3 py-2">
                                                    <Activity className="w-3 h-3" /> Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="rounded-xl h-10 gap-3" onClick={() => handleUpdateStatus(review.id, 'approved')}>
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Approve Review
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl h-10 gap-3" onClick={() => handleUpdateStatus(review.id, 'hidden')}>
                                                    <EyeOff className="w-4 h-4 text-amber-500" /> Hide Review
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl h-10 gap-3" onClick={() => {
                                                    setSelectedReview(review);
                                                    setReplyText(review.admin_reply || "");
                                                    setIsReplyDialogOpen(true);
                                                }}>
                                                    <Reply className="w-4 h-4 text-indigo-500" /> Reply to Review
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl h-10 gap-3" onClick={() => handleToggleFeatured(review.id, review.is_featured)}>
                                                    <Sparkles className="w-4 h-4 text-primary" /> {review.is_featured ? "Remove from Spotlight" : "Feature in Spotlight"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="rounded-xl h-10 gap-3 text-rose-500 hover:bg-rose-500/10" onClick={() => handleDelete(review.id)}>
                                                    <Trash2 className="w-4 h-4" /> Delete Forever
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <div className="mt-auto hidden md:block">
                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-center text-muted-foreground/30 mb-2">Ref: {review.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                <DialogContent className="max-w-xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Reply className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Reply to <span className="text-primary italic">Review</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Your response will be visible to all customers who view this product.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="p-6 rounded-3xl bg-muted/30 border border-border/10 italic text-sm text-muted-foreground">
                            "{selectedReview?.comment}"
                        </div>
                        <Textarea
                            placeholder="Type your response..."
                            className="min-h-[180px] rounded-[2rem] bg-muted/20 border-border/5 focus-visible:bg-background transition-all p-6 text-sm font-light"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsReplyDialogOpen(false)}>Discard</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleReply}
                            disabled={isSubmitting || !replyText.trim()}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Send Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
                <DialogContent className="max-w-4xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10 max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="space-y-4 shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <History className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">System <span className="text-indigo-500 italic">Audit Logs</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                A history of admin actions performed on the reviews database.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar my-6">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-xl">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14">Admin</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14">Target Review</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground h-14">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-5">
                                            <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase tracking-widest border-border/20 px-3">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-xs">{log.admin_email}</td>
                                        <td className="px-6 py-5 font-mono text-[10px] text-muted-foreground">{log.review_id.slice(0, 8)}...</td>
                                        <td className="px-6 py-5 text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter className="shrink-0">
                        <Button variant="outline" className="rounded-full h-12 px-8" onClick={() => setIsLogsDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Add Review Dialog */}
            <Dialog open={isAddReviewOpen} onOpenChange={setIsAddReviewOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-10 glass border-border/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Add <span className="text-primary italic">Anonymous Review</span></DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Generate social proof for your products</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Product</Label>
                                <Select value={newReview.product_id} onValueChange={(v) => setNewReview({ ...newReview, product_id: v })}>
                                    <SelectTrigger className="grow h-12 rounded-xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Alchemy Rating</Label>
                                <div className="flex gap-2 p-3 bg-muted/20 rounded-xl justify-center scale-90 sm:scale-100">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className="transition-all hover:scale-125"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${star <= newReview.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Display Name</Label>
                                <Input
                                    placeholder="e.g. Sarah J."
                                    className="h-12 bg-muted/30 border-none rounded-xl"
                                    value={newReview.user_name}
                                    onChange={(e) => setNewReview({ ...newReview, user_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Email (Optional)</Label>
                                <Input
                                    placeholder="sarah@example.com"
                                    className="h-12 bg-muted/30 border-none rounded-xl"
                                    value={newReview.user_email}
                                    onChange={(e) => setNewReview({ ...newReview, user_email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Comment</Label>
                            <Textarea
                                placeholder="Review content..."
                                className="min-h-[120px] bg-muted/30 border-none rounded-xl"
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Status</Label>
                            <Tabs value={newReview.status} onValueChange={(v) => setNewReview({ ...newReview, status: v })} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/20">
                                    <TabsTrigger value="approved" className="rounded-lg text-[10px] font-black uppercase tracking-widest">Approved</TabsTrigger>
                                    <TabsTrigger value="pending" className="rounded-lg text-[10px] font-black uppercase tracking-widest">Pending</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsAddReviewOpen(false)} className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleAddReview} disabled={isSubmitting} className="rounded-xl h-12 bg-primary text-white shadow-xl shadow-primary/20 text-[10px] font-black uppercase tracking-widest gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />} Create Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
