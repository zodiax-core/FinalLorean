import { useState, useEffect, useMemo } from "react";
import {
    Search, Filter, Trash2, Mail, User, Clock,
    CheckCircle2, MessageSquare, ExternalLink, RefreshCcw,
    XCircle, Eye, EyeOff, Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { contactsService } from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription
} from "@/components/ui/dialog";

export default function AdminContactMessages() {
    const { toast } = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

    const fetchMessages = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await contactsService.getAll();
            setMessages(data);
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load messages." });
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const filteredMessages = useMemo(() => {
        return messages.filter(m => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                m.subject.toLowerCase().includes(q) ||
                m.message.toLowerCase().includes(q);

            const matchesStatus = statusFilter === "All" || m.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [messages, searchQuery, statusFilter]);

    const handleUpdateStatus = async (id: string, newStatus: any) => {
        try {
            await contactsService.updateStatus(id, newStatus);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
            if (selectedMessage?.id === id) {
                setSelectedMessage({ ...selectedMessage, status: newStatus });
            }
            toast({ title: "Status Updated", description: `Message marked as ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            await contactsService.delete(id);
            setMessages(prev => prev.filter(m => m.id !== id));
            setSelectedMessage(null);
            toast({ title: "Message Deleted", description: "The records have been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete message." });
        }
    };

    const handleViewMessage = (message: any) => {
        setSelectedMessage(message);
        if (message.status === 'unread') {
            handleUpdateStatus(message.id, 'read');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif">Inquiry <span className="text-primary italic">Vault</span></h1>
                    <p className="text-muted-foreground font-light text-sm mt-1 uppercase tracking-widest">Patron Communications Intelligence</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => fetchMessages()} variant="outline" className="h-12 w-12 rounded-2xl p-0 shadow-lg border-2">
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            <div className="glass p-8 rounded-[3.5rem] border border-border/10 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                    <div className="relative flex-1 w-full lg:max-w-xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Filter by name, email, or content..."
                            className="h-16 pl-16 rounded-[2rem] bg-background/50 border-border/10 text-lg focus:bg-background transition-all font-serif italic shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-[1.8rem] border border-border/5">
                        {['All', 'unread', 'read', 'archived'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${statusFilter === s
                                    ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-105'
                                    : 'text-muted-foreground hover:bg-white/10 hover:text-primary'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass rounded-[3rem] border-border/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patron</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground italic font-serif text-lg">
                                        The vault is currently empty.
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <tr
                                        key={msg.id}
                                        onClick={() => handleViewMessage(msg)}
                                        className={`hover:bg-primary/5 transition-colors group cursor-pointer ${msg.status === 'unread' ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-8 py-6">
                                            <Badge className={`px-4 py-1.5 rounded-full text-[9px] uppercase font-black tracking-widest border-none ${msg.status === 'unread' ? 'bg-amber-500/10 text-amber-500' :
                                                    msg.status === 'read' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        'bg-zinc-500/10 text-zinc-500'
                                                }`}>
                                                {msg.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black uppercase">
                                                    {msg.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-serif font-bold text-lg">{msg.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">{msg.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm line-clamp-1">{msg.subject}</span>
                                                <span className="text-[10px] text-muted-foreground line-clamp-1 italic">{msg.message}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase">{new Date(msg.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(msg.id, msg.status === 'read' ? 'unread' : 'read'); }}
                                                    className="h-10 w-10 rounded-xl"
                                                >
                                                    {msg.status === 'read' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                                                    className="h-10 w-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message Detail Dialog */}
            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none glass p-0 overflow-hidden">
                    <div className="p-8 space-y-8">
                        <header className="flex items-start justify-between">
                            <div className="space-y-4">
                                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest">Patron Inquiry</Badge>
                                <h2 className="text-3xl font-serif">{selectedMessage?.subject}</h2>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-bold">{selectedMessage?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm">{selectedMessage?.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-muted-foreground/40">{selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}</span>
                            </div>
                        </header>

                        <div className="bg-background/80 p-8 rounded-3xl border border-border/5 relative shadow-inner min-h-[200px]">
                            <p className="text-lg font-light leading-relaxed whitespace-pre-wrap">{selectedMessage?.message}</p>
                        </div>

                        <footer className="flex justify-between items-center bg-muted/20 -mx-8 -mb-8 p-6">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                                    className="rounded-full gap-2 border-2"
                                >
                                    <Archive className="w-4 h-4" /> Archive
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    className="rounded-full gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </Button>
                                <Button
                                    className="rounded-full gap-2 bg-primary"
                                    onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                >
                                    <Mail className="w-4 h-4" /> Reply via Email
                                </Button>
                            </div>
                        </footer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
