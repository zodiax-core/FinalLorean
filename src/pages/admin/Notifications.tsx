import { useState, useEffect } from "react";
import {
    Bell, BellOff, Check, CheckCheck, Trash2, Filter, Search, Loader2,
    ShoppingCart, Package, Star, Store, AlertTriangle, Info, XCircle,
    RotateCcw, RefreshCcw, Eye, EyeOff, Sparkles, Clock, ArrowRight, Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notificationService } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { requestNotificationPermission } from "@/lib/firebase";

const NOTIFICATION_TYPES = [
    { value: "all", label: "All Types", icon: Bell },
    { value: "order", label: "Orders", icon: ShoppingCart },
    { value: "inventory", label: "Inventory", icon: Package },
    { value: "review", label: "Reviews", icon: Star },
    { value: "vendor", label: "Vendors", icon: Store },
    { value: "refund", label: "Refunds", icon: RotateCcw },
    { value: "system", label: "System", icon: AlertTriangle },
];

const PRIORITY_LEVELS = [
    { value: "all", label: "All Priorities" },
    { value: "info", label: "Info", color: "text-blue-500" },
    { value: "warning", label: "Warning", color: "text-amber-500" },
    { value: "critical", label: "Critical", color: "text-rose-500" },
];

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [stats, setStats] = useState<any>(null);
    const { toast } = useToast();
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('fcm_token')
                    .eq('id', user.id)
                    .single();

                if (profile?.fcm_token && Notification.permission === 'granted') {
                    setPushEnabled(true);
                }
            }
        };
        fetchUser();
        fetchNotifications();
        fetchStats();

        const channel = notificationService.subscribeToNotifications(undefined, (payload) => {
            if (payload.eventType === 'INSERT') {
                setNotifications(prev => {
                    if (prev.some(n => n.id === payload.new.id)) return prev;
                    return [payload.new, ...prev];
                });
                toast({ title: "New Notification", description: payload.new.title });
            } else if (payload.eventType === 'UPDATE') {
                setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
            } else if (payload.eventType === 'DELETE') {
                setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
            fetchStats();
        });

        return () => { notificationService.unsubscribe(channel); };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load notifications." });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await notificationService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Stats error:", error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not mark as read." });
        }
    };

    const handleMarkAsUnread = async (id: string) => {
        try {
            await notificationService.markAsUnread(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false, read_at: null } : n));
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not mark as unread." });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            toast({ title: "All Marked as Read", description: "All notifications have been marked as read." });
            fetchNotifications();
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not mark all as read." });
        }
    };

    const handleBulkMarkAsRead = async () => {
        if (selectedIds.length === 0) return;
        try {
            await notificationService.bulkMarkAsRead(selectedIds);
            toast({ title: "Marked as Read", description: `${selectedIds.length} notifications marked as read.` });
            setSelectedIds([]);
            fetchNotifications();
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not mark selected as read." });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this notification?")) return;
        try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast({ title: "Notification Deleted" });
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed" });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} notifications?`)) return;
        try {
            await notificationService.bulkDelete(selectedIds);
            toast({ title: "Notifications Deleted" });
            setSelectedIds([]);
            fetchNotifications();
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed" });
        }
    };

    const handleClearRead = async () => {
        if (!confirm("Clear all read notifications?")) return;
        try {
            await notificationService.clearRead();
            toast({ title: "Read Notifications Cleared" });
            fetchNotifications();
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Clear Failed" });
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) handleMarkAsRead(notification.id);
        if (notification.deep_link) navigate(notification.deep_link);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) setSelectedIds([]);
        else setSelectedIds(filteredNotifications.map(n => n.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleManualPushSetup = async () => {
        if (!userId) return;
        try {
            toast({ title: "Initiating Setup", description: "Requesting notification permission..." });
            const token = await requestNotificationPermission(userId);
            setPushEnabled(true);

            // Verify SW version
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration.active) {
                    registration.active.postMessage({ type: 'PING' });

                    const messageHandler = (event: MessageEvent) => {
                        if (event.data?.type === 'PONG') {
                            toast({
                                title: "Ritual Synchronized",
                                description: `Active version: ${event.data.version}. Ready for manifests.`
                            });
                            navigator.serviceWorker.removeEventListener('message', messageHandler);
                        }
                    };
                    navigator.serviceWorker.addEventListener('message', messageHandler);

                    // Fallback if no pong in 2s
                    setTimeout(() => {
                        navigator.serviceWorker.removeEventListener('message', messageHandler);
                    }, 2000);
                }
            }

            if (!token) {
                toast({ variant: "destructive", title: "Setup Incomplete", description: "Token generation failed." });
            }
        } catch (error: any) {
            console.error("FCM Setup Error:", error);
            let description = error.message || "Failed to enable notifications.";
            if (error.message?.includes("PushManager")) {
                description = "Not supported on this browser. iOS users: Add to Home Screen first.";
            }
            toast({ variant: "destructive", title: "Setup Failed", description });
        }
    };

    const handleTestNotification = async () => {
        try {
            await notificationService.create({
                type: 'system',
                priority: 'info',
                title: 'Live Ritual Test',
                message: 'Testing alchemical alerts system.',
                user_id: userId,
                metadata: { test: true }
            });
            toast({ title: "Notification Sent", description: "Check your alerts." });
        } catch (error) {
            toast({ variant: "destructive", title: "Test Failed" });
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || n.message?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || n.type === filterType;
        const matchesPriority = filterPriority === "all" || n.priority === filterPriority;
        const matchesStatus = filterStatus === "all" || (filterStatus === "unread" && !n.is_read) || (filterStatus === "read" && n.is_read);
        return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });

    const getTypeIcon = (type: string) => NOTIFICATION_TYPES.find(t => t.value === type)?.icon || Bell;
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
            case "warning": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            default: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic text-lg">Synthesizing notifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {stats && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</CardTitle>
                            <Bell className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unread</CardTitle>
                            <Circle className="h-4 w-4 text-primary fill-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.unread}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.byPriority.critical}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alerts Status</CardTitle>
                            <div className={`w-2 h-2 rounded-full ${pushEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-black uppercase tracking-widest text-foreground/80">
                                {pushEnabled ? 'System Active' : 'Push Inactive'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full xl:max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search notifications..."
                                    className="pl-12 h-14 bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="h-14 min-w-[140px] rounded-2xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {NOTIFICATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterPriority} onValueChange={setFilterPriority}>
                                    <SelectTrigger className="h-14 min-w-[140px] rounded-2xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {PRIORITY_LEVELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="h-14 min-w-[120px] rounded-2xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="unread">Unread</SelectItem>
                                        <SelectItem value="read">Read</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/5">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                    {selectedIds.length > 0 ? `${selectedIds.length} rituals chosen` : "Analyze all"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {selectedIds.length > 0 && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead} className="rounded-xl h-10 gap-2">
                                            <CheckCheck className="w-4 h-4" /> Mark Read
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleBulkDelete} className="rounded-xl h-10 gap-2 text-rose-500 border-rose-500/10">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="rounded-xl h-10 gap-2">
                                    <Check className="w-4 h-4" /> All Read
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleClearRead} className="rounded-xl h-10 gap-2 text-rose-500 hover:bg-rose-500/5">
                                    <Trash2 className="w-4 h-4" /> Purge Read
                                </Button>
                                <Button variant="ghost" size="sm" onClick={fetchNotifications} className="rounded-xl h-10 gap-2">
                                    <RefreshCcw className="w-4 h-4" /> Refresh
                                </Button>
                                <div className="w-px h-8 bg-border/10 mx-2 hidden sm:block" />
                                <Button
                                    variant={pushEnabled ? "outline" : "default"}
                                    size="sm"
                                    onClick={handleManualPushSetup}
                                    className={`rounded-xl h-10 gap-2 transition-all ${!pushEnabled && "bg-primary shadow-lg shadow-primary/20 animate-pulse hover:scale-105"}`}
                                >
                                    {pushEnabled ? <Bell className="w-4 h-4 text-emerald-500" /> : <BellOff className="w-4 h-4" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {pushEnabled ? "Alerts Active" : "Enable Alerts"}
                                    </span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleTestNotification} className="rounded-xl h-10 gap-2 border-primary/10">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Test Ritual</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AnimatePresence mode="popLayout">
                <div key="mobile-guide" className="md:hidden mb-6">
                    <Card className="glass border-primary/20 bg-primary/5 rounded-3xl overflow-hidden">
                        <CardContent className="p-4 flex gap-4 items-center">
                            <Info className="w-5 h-5 text-primary shrink-0" />
                            <div className="text-[10px] leading-relaxed">
                                <span className="font-black uppercase tracking-widest block mb-0.5">Mobile Guide</span>
                                iPhone patrons: You must <span className="font-bold underline">"Add to Home Screen"</span> to enable push rituals.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div key="notification-list" className="grid gap-3">
                    {filteredNotifications.length === 0 ? (
                        <Card key="empty-state" className="glass border-border/10 rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-20 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                    <BellOff className="w-12 h-12" />
                                    <p className="font-serif italic text-lg tracking-tight">The ritual chamber is empty.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((n, index) => {
                            const TypeIcon = getTypeIcon(n.type);
                            return (
                                <motion.div
                                    key={n.id || `notif-${index}`}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Card
                                        onClick={() => handleNotificationClick(n)}
                                        className={`glass border-border/10 rounded-[2rem] overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01] ${!n.is_read ? 'bg-primary/[0.02] border-l-4 border-l-primary shadow-primary/5' : ''}`}
                                    >
                                        <CardContent className="p-5 sm:p-6">
                                            <div className="flex items-start gap-4 sm:gap-6">
                                                <div className="mt-4 flex flex-col items-center gap-4">
                                                    <Checkbox
                                                        checked={selectedIds.includes(n.id)}
                                                        onCheckedChange={() => toggleSelect(n.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${getPriorityColor(n.priority)}`}>
                                                        <TypeIcon className="w-6 h-6" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={`font-serif text-lg leading-tight transition-all ${!n.is_read ? "font-black" : "font-medium opacity-70"}`}>
                                                                {n.title}
                                                            </h3>
                                                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                                        </div>
                                                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                                            <Badge variant="outline" className="rounded-full text-[8px] font-black uppercase tracking-tighter px-2 h-5 shrink-0">
                                                                {n.type}
                                                            </Badge>
                                                            <Badge className={`rounded-full text-[8px] font-black uppercase tracking-tighter px-2 h-5 shrink-0 shadow-none border ${getPriorityColor(n.priority)}`}>
                                                                {n.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <p className={`text-sm leading-relaxed mb-4 line-clamp-3 ${!n.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                                        {n.message}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-3 border-t border-border/5">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    n.is_read ? handleMarkAsUnread(n.id) : handleMarkAsRead(n.id);
                                                                }}
                                                            >
                                                                {n.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-rose-500"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(n.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </AnimatePresence>
        </div>
    );
}
