import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, Send, Paperclip, MoreVertical,
    User, Clock, Shield, CheckCircle2, AlertCircle,
    Info, Trash2, Plus, ArrowUpRight, Loader2, MessageSquare,
    Calendar, Lock, Eye, EyeOff, Activity, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { supportService, SupportTicket, TicketMessage } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

export default function SupportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [internalNotes, setInternalNotes] = useState("");
    const [showActivity, setShowActivity] = useState(false);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchTicketData();
        }
    }, [id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchTicketData = async () => {
        setLoading(true);
        try {
            const [ticketData, messageData, logData] = await Promise.all([
                supportService.getById(id!),
                supportService.getMessages(id!),
                supportService.getLogs(id!)
            ]);
            setTicket(ticketData);
            setMessages(messageData);
            setActivityLogs(logData);
            setInternalNotes(ticketData.internal_notes || "");
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not retrieve the ticket data." });
            navigate("/admin/support");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim() || !user || !id) return;

        setSending(true);
        try {
            const newMessage = await supportService.addMessage({
                ticket_id: id,
                sender_id: user.id,
                message: replyMessage,
                is_internal: isInternal,
                attachments: [] // Files would be uploaded here in a real scenario
            });

            // Refetch messages to get relations correctly
            const updatedMessages = await supportService.getMessages(id);
            setMessages(updatedMessages);
            setReplyMessage("");

            if (!isInternal) {
                toast({ title: "Message Sent", description: "Your message has been sent to the customer." });
            } else {
                toast({ title: "Notes Saved", description: "Internal notes have been updated." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Send Failed", description: "The message could not be sent." });
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!id || !user) return;
        try {
            const oldStatus = ticket?.status;
            const updated = await supportService.update(id, { status: newStatus as any });
            setTicket(updated);

            await supportService.logActivity({
                ticket_id: id,
                admin_id: user.id,
                action: "Status Updated",
                previous_value: oldStatus,
                new_value: newStatus
            });

            toast({ title: "Status Updated", description: `Ticket status updated to ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update ticket status." });
        }
    };

    const handleUpdatePriority = async (newPriority: string) => {
        if (!id || !user) return;
        try {
            const oldPriority = ticket?.priority;
            const updated = await supportService.update(id, { priority: newPriority as any });
            setTicket(updated);

            await supportService.logActivity({
                ticket_id: id,
                admin_id: user.id,
                action: "Priority Updated",
                previous_value: oldPriority,
                new_value: newPriority
            });

            toast({ title: "Priority Updated", description: `Priority set to ${newPriority}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update priority." });
        }
    };

    const handleUpdateInternalNotes = async () => {
        if (!id) return;
        try {
            await supportService.update(id, { internal_notes: internalNotes });
            setTicket(prev => prev ? { ...prev, internal_notes: internalNotes } : null);
            toast({ title: "Notes Saved", description: "Internal notes have been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save notes." });
        }
    };

    if (loading || !ticket) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic text-lg">Loading ticket...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/10 pb-10 gap-8">
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/admin/support")}
                        className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Tickets
                    </Button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-serif tracking-tight leading-tight">{ticket.subject}</h1>
                        <Badge className={`${ticket.priority === 'urgent' ? 'bg-rose-500 animate-pulse' : 'bg-primary/20 text-primary'} border-none rounded-full px-4 text-[8px] font-black uppercase tracking-widest`}>
                            {ticket.priority}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Status</Label>
                        <Select value={ticket.status} onValueChange={handleUpdateStatus}>
                            <SelectTrigger className="h-12 w-[180px] rounded-2xl bg-muted/30 border-none px-6 text-[10px] font-black uppercase tracking-widest">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in-progress">Processing</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Priority</Label>
                        <Select value={ticket.priority} onValueChange={handleUpdatePriority}>
                            <SelectTrigger className="h-12 w-[140px] rounded-2xl bg-muted/30 border-none px-6 text-[10px] font-black uppercase tracking-widest">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content - Thread */}
                <div className="lg:col-span-8 flex flex-col h-[700px] glass rounded-[3rem] overflow-hidden border-2 relative">
                    <div className="p-8 border-b border-border/5 bg-card/40 flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black shadow-inner overflow-hidden border-2 border-primary/20">
                                {ticket.user?.avatar_url ? <img src={ticket.user.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest">{ticket.user?.full_name || "Unknown Customer"}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">Created: {format(new Date(ticket.created_at), "MMM d, HH:mm")}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowActivity(!showActivity)}
                            className={`rounded-full ${showActivity ? 'bg-primary/10 text-primary' : ''}`}
                        >
                            <Activity className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Messages Container */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-[url('/noise.png')] bg-repeat"
                    >
                        {messages.length > 0 ? messages.map((msg, i) => {
                            const isByMe = msg.sender_id === user?.id;
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: isByMe ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${isByMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] flex flex-col ${isByMe ? 'items-end' : 'items-start'} gap-3`}>
                                        <div className={`p-8 rounded-[2.5rem] ${isByMe ? (msg.is_internal ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-100 rounded-tr-none border-2' : 'bg-primary text-white shadow-xl shadow-primary/20 rounded-tr-none') : 'bg-muted/40 rounded-tl-none border-2'}`}>
                                            {msg.is_internal && <div className="flex items-center gap-2 mb-3 opacity-50"><Lock className="w-3 h-3" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Internal Note</span></div>}
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                        <div className="flex items-center gap-3 px-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{format(new Date(msg.created_at), "HH:mm")}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">•</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{msg.sender?.full_name || "Support"}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="h-full flex items-center justify-center opacity-10">
                                <MessageSquare className="w-40 h-40" />
                            </div>
                        )}
                    </div>

                    {/* Quick Activity Overlay */}
                    <AnimatePresence>
                        {showActivity && (
                            <motion.div
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                className="absolute top-[85px] bottom-0 right-0 w-80 bg-background/95 backdrop-blur-xl border-l border-border/10 p-8 z-20 space-y-8 overflow-y-auto"
                            >
                                <div className="flex items-center justify-between border-b border-border/10 pb-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Activity Log</h4>
                                    <Button variant="ghost" size="icon" onClick={() => setShowActivity(false)}><ChevronLeft className="w-5 h-5 rotate-180" /></Button>
                                </div>
                                <div className="space-y-6">
                                    {activityLogs.map((log, i) => (
                                        <div key={i} className="space-y-2 relative pl-6 border-l border-primary/20">
                                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                                            <p className="text-xs font-bold leading-none">{log.action}</p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                <span className="line-through opacity-50">{log.previous_value}</span>
                                                <ArrowUpRight className="w-3 h-3" />
                                                <span className="text-primary font-black uppercase">{log.new_value}</span>
                                            </p>
                                            <div className="flex items-center gap-2 pt-1 opacity-40">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[8px] font-black uppercase">{format(new Date(log.created_at), "MMM d, HH:mm")}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-8 bg-card/40 border-t border-border/10">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-6 px-4">
                                <button
                                    type="button"
                                    onClick={() => setIsInternal(!isInternal)}
                                    className={`flex items-center gap-3 transition-all ${isInternal ? 'text-amber-500 scale-105' : 'text-muted-foreground'}`}
                                >
                                    {isInternal ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isInternal ? 'Internal Note Mode' : 'Customer Reply Mode'}</span>
                                </button>
                                <div className="h-4 w-px bg-border/20" />
                                <button type="button" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                                    <Paperclip className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Attach File</span>
                                </button>
                            </div>
                            <div className="relative group">
                                <Textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder={isInternal ? "Type an internal note..." : "Type your reply..."}
                                    className={`min-h-[140px] p-8 rounded-[2.5rem] bg-muted/20 border-none transition-all resize-none shadow-inner focus-visible:ring-1 focus-visible:ring-primary/20 leading-relaxed font-medium ${isInternal ? 'bg-amber-500/[0.03] text-amber-900 border-amber-500/10' : ''}`}
                                />
                                <Button
                                    type="submit"
                                    disabled={sending || !replyMessage.trim()}
                                    className={`absolute bottom-6 right-6 h-12 px-8 rounded-full shadow-xl transition-all ${isInternal ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary shadow-primary/20 hover:scale-105 active:scale-95'}`}
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sidebar - Meta Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Customer Info */}
                    <div className="glass p-10 rounded-[3rem] space-y-8 border-2">
                        <div className="flex items-center gap-4 border-b border-border/10 pb-6">
                            <div className="w-12 h-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Customer Information</h4>
                                <p className="text-2xl font-serif italic text-primary">Customer Details</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</span>
                                <span className="text-sm font-bold">{ticket.user?.full_name || "Unknown"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User ID</span>
                                <span className="text-[10px] font-mono tracking-tighter opacity-70">{ticket.user_id}</span>
                            </div>
                            <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed border-2 group gap-3">
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                View Customer Profile
                            </Button>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="glass p-10 rounded-[3rem] space-y-8 border-2 bg-amber-500/[0.02]">
                        <div className="flex items-center gap-4 border-b border-border/10 pb-6">
                            <div className="w-12 h-12 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Internal Notes</h4>
                                <p className="text-2xl font-serif italic text-amber-500">Private Notes</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Textarea
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Add private notes only visible to admins..."
                                className="min-h-[200px] p-6 rounded-[2rem] bg-amber-500/[0.03] border-none text-xs leading-relaxed font-medium italic shadow-inner resize-none"
                            />
                            <Button
                                onClick={handleUpdateInternalNotes}
                                className="w-full h-14 rounded-full bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/10 gap-3 text-xs font-black uppercase tracking-widest"
                            >
                                <Lock className="w-4 h-4" /> Save Notes
                            </Button>
                        </div>
                    </div>

                    {/* Quick Metadata */}
                    <div className="p-8 rounded-[3rem] bg-primary text-white space-y-6 shadow-2xl shadow-primary/30 relative overflow-hidden group">
                        <Plus className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Details</span>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center opacity-80">
                                <span className="text-[9px] font-black uppercase">Created</span>
                                <span className="text-[9px] font-black">{format(new Date(ticket.created_at), "MMMM d, yyyy")}</span>
                            </div>
                            <div className="flex justify-between items-center opacity-80">
                                <span className="text-[9px] font-black uppercase">Updated</span>
                                <span className="text-[9px] font-black">{format(new Date(ticket.updated_at), "HH:mm, MM/dd")}</span>
                            </div>
                            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase">Assignee</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black">{ticket.assignee?.full_name || "Unassigned"}</span>
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <User className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
