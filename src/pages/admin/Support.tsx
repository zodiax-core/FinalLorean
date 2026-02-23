import { useState, useEffect } from "react";
import {
    Search, Filter, Plus, MessageSquare, Clock,
    AlertCircle, CheckCircle2, MoreHorizontal, User,
    ChevronRight, Loader2, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supportService, SupportTicket, profilesService } from "@/services/supabase";
import { format } from "date-fns";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function AdminSupport() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // New Ticket Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [newTicket, setNewTicket] = useState({
        user_id: "",
        subject: "",
        description: "",
        priority: "medium" as any
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchTickets();
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const data = await profilesService.getAll();
            setProfiles(data);
        } catch (error) {
            console.error("Profile fetch error:", error);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.getAll();
            setTickets(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not load support tickets." });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.user_id || !newTicket.subject) {
            toast({ variant: "destructive", title: "Form Incomplete", description: "All core fields are required." });
            return;
        }

        setCreating(true);
        try {
            const ticket = await supportService.create(newTicket);
            toast({ title: "Ticket Created", description: "A new support ticket has been created." });
            setIsModalOpen(false);
            setNewTicket({ user_id: "", subject: "", description: "", priority: "medium" });
            fetchTickets();
            navigate(`/admin/support/${ticket.id}`);
        } catch (error) {
            toast({ variant: "destructive", title: "Create Failed", description: "The ticket could not be created." });
        } finally {
            setCreating(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">Open</Badge>;
            case 'in-progress': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">Processing</Badge>;
            case 'resolved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">Resolved</Badge>;
            case 'closed': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">Closed</Badge>;
            default: return null;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent': return <Badge className="bg-rose-500 text-white rounded-full px-4 h-6 uppercase text-[8px] font-black animate-pulse">Urgent</Badge>;
            case 'high': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">High</Badge>;
            case 'medium': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">Medium</Badge>;
            case 'low': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 rounded-full px-4 h-6 uppercase text-[8px] font-black">Low</Badge>;
            default: return null;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-serif tracking-tight">Support <span className="text-primary italic">Center</span></h1>
                    <p className="text-muted-foreground font-light">Manage customer support tickets and resolutions.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-full">
                        {['all', 'open', 'in-progress', 'resolved'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:bg-primary/5"}`}
                            >
                                {s === 'all' ? 'All Tickets' : s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass p-8 rounded-[3rem] space-y-8 shadow-sm border-2">
                <div className="flex flex-col md:flex-row gap-6 justify-between">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 rounded-2xl bg-muted/20 border-none px-6 text-sm font-medium focus-visible:bg-background transition-all"
                        />
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="h-14 px-8 rounded-full text-xs font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" /> Create New Ticket
                    </Button>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="glass border-2 rounded-[3rem] p-10 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-serif italic mb-2">Create Ticket</DialogTitle>
                            <DialogDescription className="text-xs font-black uppercase tracking-widest opacity-50">Enter ticket details below.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateTicket} className="space-y-8 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Customer</Label>
                                    <Select
                                        value={newTicket.user_id}
                                        onValueChange={(v) => setNewTicket({ ...newTicket, user_id: v })}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none px-6">
                                            <SelectValue placeholder="Select Customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {profiles.map(profile => (
                                                <SelectItem key={profile.id} value={profile.id}>
                                                    {profile.full_name || profile.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Priority</Label>
                                    <Select
                                        value={newTicket.priority}
                                        onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as any })}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none px-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Subject</Label>
                                <Input
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    placeholder="Enter subject..."
                                    className="h-12 rounded-2xl bg-muted/20 border-none px-6"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Description</Label>
                                <Textarea
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    placeholder="Enter description..."
                                    className="min-h-[150px] rounded-[2rem] bg-muted/20 border-none p-6 resize-none"
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={creating}
                                    className="h-14 px-12 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary group"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Plus className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform" />}
                                    Create Ticket
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="overflow-hidden rounded-[2.5rem] border border-border/5">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest">Customer</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest">Subject</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-center">Priority</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-center">Assignee</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-right">Activity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse border-b border-border/5">
                                            <TableCell className="p-8"><div className="h-4 w-32 bg-muted rounded-full" /></TableCell>
                                            <TableCell className="p-8"><div className="h-4 w-48 bg-muted rounded-full" /></TableCell>
                                            <TableCell className="p-8"><div className="h-4 w-16 mx-auto bg-muted rounded-full" /></TableCell>
                                            <TableCell className="p-8"><div className="h-4 w-16 mx-auto bg-muted rounded-full" /></TableCell>
                                            <TableCell className="p-8"><div className="h-8 w-8 mx-auto bg-muted rounded-full" /></TableCell>
                                            <TableCell className="p-8"><div className="h-4 w-24 ml-auto bg-muted rounded-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredTickets.length > 0 ? (
                                    filteredTickets.map((ticket, i) => (
                                        <motion.tr
                                            key={ticket.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group cursor-pointer hover:bg-primary/[0.02] border-b border-border/5 transition-colors"
                                            onClick={() => navigate(`/admin/support/${ticket.id}`)}
                                        >
                                            <TableCell className="py-7 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner overflow-hidden">
                                                        {ticket.user?.avatar_url ? <img src={ticket.user.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold tracking-tight">{ticket.user?.full_name || "Unknown Customer"}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">ID: {ticket.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 px-8 max-w-[300px]">
                                                <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{ticket.subject}</p>
                                            </TableCell>
                                            <TableCell className="py-7 px-8 text-center">
                                                {getPriorityBadge(ticket.priority)}
                                            </TableCell>
                                            <TableCell className="py-7 px-8 text-center">
                                                {getStatusBadge(ticket.status)}
                                            </TableCell>
                                            <TableCell className="py-7 px-8 text-center">
                                                <div className="flex justify-center">
                                                    {ticket.assignee ? (
                                                        <div className="w-8 h-8 rounded-full ring-2 ring-primary/20 ring-offset-2 overflow-hidden bg-primary/10 flex items-center justify-center">
                                                            {ticket.assignee.avatar_url ? <img src={ticket.assignee.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                                            <User className="w-3 h-3 text-muted-foreground/30" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 px-8 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <p className="text-xs font-bold font-serif italic text-muted-foreground">{format(new Date(ticket.updated_at), "MMM d, HH:mm")}</p>
                                                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all text-primary" />
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 py-20">
                                                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                                                    <MessageSquare className="w-10 h-10 opacity-20" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-serif italic text-muted-foreground">No tickets found.</p>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Adjust your filters to find tickets.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
