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
            if (user) setUserId(user.id);
        };
        fetchUser();
        fetchNotifications();
        fetchStats();

        const channel = notificationService.subscribeToNotifications(undefined, (payload) => {
            console.log("Real-time notification:", payload);
            if (payload.eventType === 'INSERT') {
                setNotifications(prev => [payload.new, ...prev]);
                toast({
                    title: "New Notification",
                    description: payload.new.title,
                });
            } else if (payload.eventType === 'UPDATE') {
                setNotifications(prev =>
                    prev.map(n => n.id === payload.new.id ? payload.new : n)
                );
            } else if (payload.eventType === 'DELETE') {
                setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
            fetchStats();
        });

        return () => {
            notificationService.unsubscribe(channel);
        };
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
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
            );
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not mark as read." });
        }
    };

    const handleMarkAsUnread = async (id: string) => {
        try {
            await notificationService.markAsUnread(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: false, read_at: null } : n)
            );
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
        try {
            await notificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast({ title: "Notification Deleted", description: "Notification has been removed." });
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete notification." });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} notifications?`)) return;
        try {
            await notificationService.bulkDelete(selectedIds);
            toast({ title: "Notifications Deleted", description: `${selectedIds.length} notifications removed.` });
            setSelectedIds([]);
            fetchNotifications();
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete selected notifications." });
        }
    };

    const handleClearRead = async () => {
        if (!confirm("Clear all read notifications?")) return;
        try {
            await notificationService.clearRead();
            toast({ title: "Read Notifications Cleared", description: "All read notifications have been removed." });
            fetchNotifications();
            fetchStats();
        } catch (error) {
            toast({ variant: "destructive", title: "Clear Failed", description: "Could not clear read notifications." });
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        if (notification.deep_link) {
            navigate(notification.deep_link);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch =
            notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === "all" || notification.type === filterType;
        const matchesPriority = filterPriority === "all" || notification.priority === filterPriority;
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "unread" && !notification.is_read) ||
            (filterStatus === "read" && notification.is_read);

        return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });

    const getTypeIcon = (type: string) => {
        const typeConfig = NOTIFICATION_TYPES.find(t => t.value === type);
        return typeConfig?.icon || Bell;
    };

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
                <p className="text-muted-foreground font-serif italic">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {stats && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bell className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.total}</div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">All Notifications</p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unread</CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Circle className="h-4 w-4 text-primary fill-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.unread}</div>
                            <p className="text-[10px] text-primary mt-2 font-bold uppercase tracking-widest">Awaiting Review</p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical</CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.byPriority.critical}</div>
                            <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-widest">Urgent Alerts</p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orders</CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-serif font-black">{stats.byType.order}</div>
                            <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Order Alerts</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-1 items-center gap-4 w-full">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search notifications..."
                                        className="pl-10 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[160px] h-12 rounded-xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NOTIFICATION_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterPriority} onValueChange={setFilterPriority}>
                                    <SelectTrigger className="w-[160px] h-12 rounded-xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITY_LEVELS.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[140px] h-12 rounded-xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="unread">Unread</SelectItem>
                                        <SelectItem value="read">Read</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {selectedIds.length > 0 && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead} className="rounded-xl gap-2">
                                            <CheckCheck className="w-4 h-4" /> Mark Read
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleBulkDelete} className="rounded-xl gap-2 text-rose-500">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </Button>
                                    </>
                                )}
                                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="rounded-xl gap-2">
                                    <CheckCheck className="w-4 h-4" /> Mark All Read
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleClearRead} className="rounded-xl gap-2">
                                    <Trash2 className="w-4 h-4" /> Clear Read
                                </Button>
                                <Button variant="outline" size="sm" onClick={fetchNotifications} className="rounded-xl gap-2">
                                    <RefreshCcw className="w-4 h-4" /> Refresh
                                </Button>
                                <Button variant="outline" size="sm" onClick={async () => {
                                    if (userId) {
                                        try {
                                            const token = await requestNotificationPermission(userId);
                                            if (token) {
                                                setPushEnabled(true);
                                                toast({ title: "Notifications Enabled", description: "Push notifications enabled successfully." });
                                            }
                                        } catch (err: any) {
                                            toast({
                                                title: "Action Blocked",
                                                description: err.message || "Could not enable notifications. Check browser settings.",
                                                variant: "destructive"
                                            });
                                        }
                                    }
                                }} className="rounded-xl gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                                    <Bell className="w-4 h-4" /> {pushEnabled ? "Push Enabled" : "Enable Push"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <AnimatePresence>
                    {filteredNotifications.length === 0 ? (
                        <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-20 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-50">
                                    <BellOff className="w-16 h-16" />
                                    <p className="font-serif italic text-lg text-muted-foreground">No notifications found.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const TypeIcon = getTypeIcon(notification.type);
                            return (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className={`glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] ${!notification.is_read ? 'border-l-4 border-l-primary' : ''
                                        }`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Checkbox
                                                    checked={selectedIds.includes(notification.id)}
                                                    onCheckedChange={() => toggleSelect(notification.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${getPriorityColor(notification.priority)}`}
                                                >
                                                    <TypeIcon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0" onClick={() => handleNotificationClick(notification)}>
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                                                                {notification.title}
                                                                {!notification.is_read && (
                                                                    <Circle className="w-2 h-2 fill-primary text-primary" />
                                                                )}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase">
                                                                {notification.type}
                                                            </Badge>
                                                            <Badge className={`rounded-full text-[9px] font-black uppercase ${getPriorityColor(notification.priority)}`}>
                                                                {notification.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </div>
                                                        {notification.deep_link && (
                                                            <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-primary">
                                                                View Details <ArrowRight className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {notification.is_read ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg"
                                                            onClick={() => handleMarkAsUnread(notification.id)}
                                                        >
                                                            <EyeOff className="w-4 h-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg"
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-rose-500"
                                                        onClick={() => handleDelete(notification.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
