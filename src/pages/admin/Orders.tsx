import { useState, useEffect, useMemo } from "react";
import {
    Search, Filter, Download,
    ArrowUpRight, ShoppingBag, Truck,
    CheckCircle2, XCircle, Clock,
    Eye, MoreHorizontal, FileText,
    Mail, MapPin, CreditCard, RefreshCcw, User, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ordersService } from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AdminOrders() {
    const { toast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (!o) return false;
            const q = searchQuery.toLowerCase().trim();
            const shortId = o.short_id?.toLowerCase() || "";
            const formattedId = ("#ord-" + o.id.toString().slice(0, 8)).toLowerCase();

            const matchesSearch =
                (o.full_name?.toLowerCase().includes(q) ||
                    o.id?.toString().toLowerCase().includes(q) ||
                    shortId.includes(q) ||
                    formattedId.includes(q) ||
                    o.email?.toLowerCase().includes(q) ||
                    o.address?.toLowerCase().includes(q) ||
                    o.city?.toLowerCase().includes(q));

            const matchesStatus = statusFilter === "All" || o.status === statusFilter;
            const matchesPayment = paymentFilter === "All" || (o.payment_method?.toLowerCase() === paymentFilter.toLowerCase());

            const orderDate = new Date(o.created_at);
            const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
            const matchesDateTo = !dateTo || orderDate <= new Date(dateTo + "T23:59:59");

            const matchesMinAmount = !minAmount || o.total_amount >= parseFloat(minAmount);
            const matchesMaxAmount = !maxAmount || o.total_amount <= parseFloat(maxAmount);

            return matchesSearch && matchesStatus && matchesPayment && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
        });
    }, [orders, searchQuery, statusFilter, paymentFilter, dateFrom, dateTo, minAmount, maxAmount]);

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await ordersService.getAll();
            setOrders(data);
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load order records." });
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Subscribe to real-time order changes
        const channel = ordersService.subscribeToOrders((payload) => {
            if (payload.eventType === 'UPDATE' && payload.new) {
                setOrders(prev => prev.map(o => (o && o.id === payload.new.id) ? { ...o, ...payload.new } : o));
                // Update selected order if it's the one that changed
                if (selectedOrder && selectedOrder.id === payload.new.id) {
                    setSelectedOrder(prev => prev ? { ...prev, ...payload.new } : null);
                }
            } else if (payload.eventType === 'INSERT' && payload.new) {
                // Prepend new orders
                setOrders(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'DELETE') {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
        });

        return () => {
            ordersService.unsubscribe(channel);
        };
    }, [selectedOrder]);

    const handleDeleteOrder = async (id: string, status: string) => {
        if (status !== 'cancelled') {
            toast({
                variant: "destructive",
                title: "Restricted Action",
                description: "Only cancelled orders can be deleted from the records."
            });
            return;
        }

        if (!confirm("Are you sure you want to permanently delete this cancelled order? This action is irreversible.")) return;

        try {
            await ordersService.delete(id);
            toast({ title: "Order Deleted", description: "The records have been updated." });
            fetchOrders();
        } catch (error) {
            toast({ variant: "destructive", title: "Deletion Failed", description: "The order could not be deleted." });
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setIsUpdating(true);
        // Optimistic update for immediate feedback
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === id) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        try {
            const updatedOrder = await ordersService.updateStatus(id, newStatus);

            // If updatedOrder is null, the database wasn't updated (e.g. RLS blocked it)
            if (!updatedOrder) {
                throw new Error("Update was not saved to the database. Check your permissions.");
            }

            toast({ title: "Status Updated", description: `Order status updated to ${newStatus}.` });

            // Sync local state with server truth
            setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder(updatedOrder);
            }
        } catch (error: any) {
            console.error("Status update error:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Failed to update status."
            });
            await fetchOrders(); // Full refresh to revert state correctly
        } finally {
            setIsUpdating(false);
        }
    };

    const handleBulkStatusUpdate = async (newStatus: string) => {
        if (selectedOrderIds.length === 0) return;
        setIsUpdating(true);
        // Optimistic update
        setOrders(prev => prev.map(o => selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o));

        try {
            const results = await Promise.all(selectedOrderIds.map(id => ordersService.updateStatus(id, newStatus)));

            // Check if any updates returned null
            const failedUpdates = results.filter(r => r === null);
            if (failedUpdates.length > 0) {
                throw new Error(`${failedUpdates.length} orders failed to update. Reverting state...`);
            }

            toast({ title: "Bulk Status Updated", description: `${selectedOrderIds.length} orders updated to ${newStatus}.` });

            // Sync local state with all results
            setOrders(prev => {
                let newOrders = [...prev];
                results.forEach(updated => {
                    if (updated) {
                        newOrders = newOrders.map(o => o.id === updated.id ? updated : o);
                    }
                });
                return newOrders;
            });

            setSelectedOrderIds([]);
        } catch (error: any) {
            console.error("Bulk status update error:", error);
            toast({ variant: "destructive", title: "Bulk Update Failed", description: error.message });
            await fetchOrders();
        } finally {
            setIsUpdating(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOrderIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedOrderIds.length} orders? Only cancelled orders will be removed.`)) return;

        setIsUpdating(true);
        try {
            let deletedCount = 0;
            for (const id of selectedOrderIds) {
                const order = orders.find(o => o.id === id);
                if (order && order.status === 'cancelled') {
                    await ordersService.delete(id);
                    deletedCount++;
                }
            }
            toast({ title: "Bulk Deletion Complete", description: `${deletedCount} cancelled orders removed.` });
            setSelectedOrderIds([]);
            await fetchOrders();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Bulk Delete Failed", description: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === filteredOrders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(filteredOrders.map(o => o.id));
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };



    const getPaymentStatus = (order: any) => {
        const method = order.payment_method?.toLowerCase() || 'card';
        const isActuallyPaid = ['paid', 'shipped', 'delivered'].includes(order.status?.toLowerCase());
        if (isActuallyPaid) return 'paid';
        if (method === 'cod') return 'unpaid';
        return 'paid';
    };


    const exportToPDF = async () => {
        const doc = new jsPDF();
        let yPos = 55;

        const addHeader = (pdfDoc: jsPDF) => {
            pdfDoc.setFillColor(26, 26, 26);
            pdfDoc.rect(0, 0, 210, 40, 'F');
            pdfDoc.setTextColor(212, 175, 55);
            pdfDoc.setFont("serif", "bold");
            pdfDoc.setFontSize(28);
            pdfDoc.text("LOREAN", 105, 18, { align: "center" });
            pdfDoc.setTextColor(255, 255, 255);
            pdfDoc.setFontSize(8);
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text("PRODUCT TRANSACTION ORDER RECORD", 105, 28, { align: "center" });
            pdfDoc.setDrawColor(212, 175, 55);
            pdfDoc.setLineWidth(0.5);
            pdfDoc.line(80, 32, 130, 32);
        };

        addHeader(doc);

        doc.setTextColor(26, 26, 26);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`RECORD GENERATED: ${new Date().toLocaleString()}`, 14, 48);
        doc.setFont("helvetica", "normal");
        doc.text(`TOTAL ORDERS: ${filteredOrders.length}`, 200, 48, { align: "right" });

        doc.setDrawColor(240);
        doc.line(14, 52, 200, 52);

        for (const [index, o] of filteredOrders.entries()) {
            const estimatedHeight = 75 + (o.items?.length || 0) * 10;
            if (yPos + estimatedHeight > 280) {
                doc.addPage();
                addHeader(doc);
                yPos = 55;
            }

            doc.setFillColor(250, 248, 242);
            doc.rect(14, yPos, 186, 12, 'F');
            doc.setDrawColor(212, 175, 55);
            doc.line(14, yPos, 14, yPos + 12);

            doc.setTextColor(26, 26, 26);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`ORD-${o.id.toString().slice(0, 8)}`, 20, yPos + 8);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`DATE: ${new Date(o.created_at).toLocaleDateString()}`, 105, yPos + 8, { align: "center" });

            const statusColors: any = { paid: [16, 185, 129], shipped: [59, 130, 246], delivered: [139, 92, 246], pending: [245, 158, 11] };
            const statusColor = statusColors[o.status] || [100, 100, 100];
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.setFont("helvetica", "bold");
            doc.text(o.status.toUpperCase(), 194, yPos + 8, { align: "right" });

            yPos += 15;

            doc.setTextColor(120, 120, 120);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text("CUSTOMER ACCOUNT", 20, yPos);
            doc.text("SHIPPING ADDRESS", 90, yPos);

            yPos += 6;
            doc.setTextColor(26, 26, 26);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text(o.full_name, 20, yPos);
            doc.text(o.address, 90, yPos);

            yPos += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(o.email, 20, yPos);
            doc.text(`${o.city}, ${o.state} ${o.postal_code}`, 90, yPos);

            if (o.nearest_famous_place || o.receiver_name || o.receiver_phone) {
                yPos += 8;
                doc.setTextColor(120, 120, 120);
                doc.setFontSize(7);
                doc.text("DELIVERY NOTES / RECEIVER", 20, yPos);
                yPos += 5;
                doc.setTextColor(26, 26, 26);
                doc.setFontSize(8);
                const notes = [
                    o.receiver_name ? `Receiver: ${o.receiver_name}` : "",
                    o.receiver_phone ? `Phone: ${o.receiver_phone}` : "",
                    o.nearest_famous_place ? `Landmark: ${o.nearest_famous_place}` : ""
                ].filter(Boolean).join(" | ");
                doc.text(notes, 20, yPos);
            }

            yPos += 12;

            const items = o.items || [];
            const itemData = items.map((item: any) => [
                item.name,
                item.quantity,
                `Rs. ${item.price.toFixed(0)}`,
                `Rs. ${(item.price * item.quantity).toFixed(0)}`
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Product Item', 'Qty', 'Unit Price', 'Subtotal']],
                body: itemData,
                theme: 'plain',
                headStyles: {
                    textColor: [212, 175, 55],
                    fontSize: 8,
                    fontStyle: 'bold',
                    cellPadding: { bottom: 2 }
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    minCellHeight: 10
                },
                columnStyles: {
                    0: { cellWidth: 100 },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                },
                margin: { left: 16, right: 16 }
            });

            yPos = (doc as any).lastAutoTable.finalY + 8;

            try {
                const qrUrl = `${window.location.origin}/track/${o.short_id || o.id.slice(0, 8)}`;
                const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                    margin: 1,
                    width: 80,
                    color: { dark: '#1a1a1a', light: '#ffffff' }
                });
                doc.addImage(qrDataUrl, 'PNG', 16, yPos + 2, 15, 15);
                doc.setFontSize(5);
                doc.setTextColor(180);
                doc.text("SCAN FOR PORTAL", 23.5, yPos + 19, { align: "center" });
            } catch (qrErr) {
                console.error("QR Code Generation Failed", qrErr);
            }

            doc.setDrawColor(240);
            doc.line(140, yPos, 200, yPos);
            yPos += 6;

            doc.setTextColor(150, 150, 150);
            doc.setFontSize(7);
            doc.text("PAYMENT", 140, yPos);
            doc.text("SUBTOTAL", 140, yPos + 4);
            doc.text("SHIPPING", 140, yPos + 8);
            if (o.discount_amount) doc.text("DISCOUNT", 140, yPos + 12);
            doc.text("TAX", 140, yPos + (o.discount_amount ? 16 : 12));

            doc.setTextColor(26, 26, 26);
            doc.setFontSize(8);
            doc.text((o.payment_method || 'card').toUpperCase(), 200, yPos, { align: "right" });
            doc.text(`Rs. ${Number(o.subtotal_amount || 0).toFixed(0)}`, 200, yPos + 4, { align: "right" });
            doc.text(`Rs. ${Number(o.shipping_amount || 0).toFixed(0)}`, 200, yPos + 8, { align: "right" });
            if (o.discount_amount) doc.text(`-Rs. ${Number(o.discount_amount).toFixed(0)}`, 200, yPos + 12, { align: "right" });
            doc.text(`Rs. ${Number(o.tax_amount || 0).toFixed(0)}`, 200, yPos + (o.discount_amount ? 16 : 12), { align: "right" });

            yPos += (o.discount_amount ? 22 : 18);
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(0.5);
            doc.line(140, yPos, 200, yPos);
            yPos += 6;

            doc.setTextColor(150, 150, 150);
            doc.setFontSize(7);
            doc.text("TOTAL ORDER AMOUNT", 140, yPos);
            doc.setTextColor(212, 175, 55);
            doc.setFontSize(14);
            doc.setFont("serif", "bold");
            doc.text(`Rs. ${Number(o.total_amount).toFixed(0)}`, 200, yPos + 1, { align: "right" });

            yPos += 20;
            if (o.tracking_number) {
                doc.setTextColor(120, 120, 120);
                doc.setFontSize(7);
                doc.text(`TRACKING: ${o.tracking_number}`, 105, yPos, { align: "center" });
                yPos += 10;
            }
        }

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text(`LOREAN CONFIDENTIAL ORDER RECORD - SESSION ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 105, 285, { align: "center" });
            doc.text(`PAGE ${i} OF ${pageCount}`, 200, 285, { align: "right" });
        }

        doc.save(`LOREAN_ORDERS_${new Date().toISOString().split('T')[0]}.pdf`);
        toast({
            title: "Archival Successful",
            description: "Order records have been exported to PDF format."
        });
    };

    const exportToCSV = () => {
        const headers = ["Order ID", "Date", "Customer", "Email", "Subtotal", "Shipping", "Discount", "Tax", "Total Amount", "Status", "Payment Method", "Address", "Tracking"];
        const rows = filteredOrders.map(o => [
            `ORD-${o.id.toString().slice(0, 8)}`,
            new Date(o.created_at).toLocaleDateString(),
            `"${o.full_name?.replace(/"/g, '""') || ""}"`,
            `"${o.email?.replace(/"/g, '""') || ""}"`,
            o.subtotal_amount || 0,
            o.shipping_amount || 0,
            o.discount_amount || 0,
            o.tax_amount || 0,
            o.total_amount,
            `"${o.status}"`,
            `"${o.payment_method || 'card'}"`,
            `"${(o.address + ", " + o.city + ", " + o.state + " " + o.postal_code).replace(/"/g, '""')}"`,
            `"${o.tracking_number?.replace(/"/g, '""') || ""}"`
        ]);

        const content = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Lorean_Orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif">Order <span className="text-primary italic">Records</span></h1>
                    <p className="text-muted-foreground font-light text-sm mt-1 uppercase tracking-widest">Global Transaction Intelligence</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2 border-2 border-primary/20 hover:bg-primary/5" onClick={exportToPDF}>
                        <FileText className="w-4 h-4 text-primary" /> Export PDF
                    </Button>
                    <Button variant="outline" className="h-12 rounded-2xl gap-2 border-2" onClick={exportToCSV}>
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                    <Button onClick={() => fetchOrders()} className="h-12 w-12 rounded-2xl p-0 shadow-lg shadow-primary/10">
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            {/* Refined Filters */}
            <div className="glass p-8 rounded-[3.5rem] border border-border/10 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />

                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                        <div className="relative flex-1 w-full lg:max-w-xl">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by Order ID, Customer, or Address..."
                                className="h-16 pl-16 rounded-[2rem] bg-background/50 border-border/10 text-lg focus:bg-background transition-all font-serif italic shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-[1.8rem] border border-border/5 overflow-x-auto no-scrollbar max-w-full">
                            {['All', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-2 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Date Range
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn(
                                        "h-14 w-full justify-start text-left font-bold rounded-2xl bg-muted/20 border-border/10 px-6",
                                        !dateFrom && !dateTo && "text-muted-foreground"
                                    )}>
                                        <Clock className="mr-3 h-4 w-4 opacity-50 text-primary" />
                                        {dateFrom ? (
                                            dateTo ? (
                                                <span className="text-[10px] uppercase">{format(new Date(dateFrom), "MMM dd")} - {format(new Date(dateTo), "MMM dd")}</span>
                                            ) : (
                                                <span className="text-[10px] uppercase">From {format(new Date(dateFrom), "MMM dd, yyyy")}</span>
                                            )
                                        ) : (
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Select Date Range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-border/10 shadow-2xl glass" align="start">
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border-b border-border/10 justify-center">
                                        {[
                                            { label: 'Today', days: 0 },
                                            { label: 'Yesterday', days: 1 },
                                            { label: '7 Days', days: 6 },
                                            { label: '30 Days', days: 29 }
                                        ].map(preset => (
                                            <Button
                                                key={preset.label}
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const end = new Date();
                                                    const start = new Date();
                                                    start.setDate(end.getDate() - preset.days);
                                                    if (preset.label === 'Yesterday') {
                                                        const yest = new Date();
                                                        yest.setDate(yest.getDate() - 1);
                                                        setDateFrom(format(yest, "yyyy-MM-dd"));
                                                        setDateTo(format(yest, "yyyy-MM-dd"));
                                                    } else {
                                                        setDateFrom(format(start, "yyyy-MM-dd"));
                                                        setDateTo(format(end, "yyyy-MM-dd"));
                                                    }
                                                }}
                                                className="text-[8px] font-black uppercase h-7 px-3 rounded-full hover:bg-primary/10 hover:text-primary transition-all border border-primary/5"
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <Calendar
                                        mode="range"
                                        selected={{
                                            from: dateFrom ? new Date(dateFrom) : undefined,
                                            to: dateTo ? new Date(dateTo) : undefined
                                        }}
                                        onSelect={(range) => {
                                            setDateFrom(range?.from ? format(range.from, "yyyy-MM-dd") : "");
                                            setDateTo(range?.to ? format(range.to, "yyyy-MM-dd") : "");
                                        }}
                                        initialFocus
                                        className="bg-background"
                                    />
                                    <div className="p-4 bg-muted/30 border-t border-border/10 flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-[9px] border-none bg-background/50 flex-1 px-3 rounded-lg" />
                                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-[9px] border-none bg-background/50 flex-1 px-3 rounded-lg" />
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-[9px] uppercase font-black h-8 rounded-lg w-full bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-colors">Reset Architecture</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-2 flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5" /> Amount Range
                            </Label>
                            <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-border/5 h-14 px-4 shadow-inner">
                                <Input
                                    type="number"
                                    placeholder="MIN (Rs.)"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="h-10 bg-transparent border-none text-[10px] font-black focus-visible:ring-0 placeholder:opacity-20 translate-y-0.5"
                                />
                                <span className="text-muted-foreground/20 text-[10px] font-black">TO</span>
                                <Input
                                    type="number"
                                    placeholder="MAX (Rs.)"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="h-10 bg-transparent border-none text-[10px] font-black focus-visible:ring-0 placeholder:opacity-20 translate-y-0.5"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-2 flex items-center gap-2">
                                <RefreshCcw className="w-3.5 h-3.5" /> Payment Gateway
                            </Label>
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-border/10 px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-muted/30">
                                    <SelectValue placeholder="All Methods" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/10 shadow-2xl p-2 glass">
                                    <SelectItem value="All" className="rounded-xl text-[10px] font-black uppercase p-3">All Methods</SelectItem>
                                    <SelectItem value="cod" className="rounded-xl text-[10px] font-black uppercase p-3">COD</SelectItem>
                                    <SelectItem value="card" className="rounded-xl text-[10px] font-black uppercase p-3">Card</SelectItem>
                                    <SelectItem value="wallet" className="rounded-xl text-[10px] font-black uppercase p-3">Wallet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end gap-3">
                            {(dateFrom || dateTo || minAmount || maxAmount || paymentFilter !== "All" || statusFilter !== "All") && (
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-14 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/10 text-[10px] font-black uppercase tracking-[0.2em]"
                                    onClick={() => {
                                        setDateFrom(""); setDateTo("");
                                        setMinAmount(""); setMaxAmount("");
                                        setPaymentFilter("All"); setStatusFilter("All");
                                    }}
                                >
                                    <XCircle className="w-4 h-4 mr-3" /> Clear
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                className="flex-1 h-14 rounded-2xl bg-primary text-white border border-primary/10 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 group"
                                onClick={() => fetchOrders()}
                            >
                                <RefreshCcw className={`w-4 h-4 mr-3 group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} /> Sync
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {selectedOrderIds.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="relative z-20 flex items-center justify-between bg-primary p-4 rounded-2xl shadow-2xl shadow-primary/20 border border-primary/20"
                            >
                                <div className="flex items-center gap-4 ml-2">
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                        {selectedOrderIds.length} Orders Selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl text-[9px] font-black uppercase gap-2">
                                                Status Update <MoreHorizontal className="w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-2xl p-2 glass border-border/10">
                                            {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                <DropdownMenuItem key={s} onClick={() => handleBulkStatusUpdate(s)} className="rounded-xl text-[9px] font-black uppercase p-3">
                                                    Mark as {s}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        size="sm"
                                        onClick={handleBulkDelete}
                                        className="bg-rose-500/20 hover:bg-rose-500/40 text-white border-none rounded-xl text-[9px] font-black uppercase gap-2"
                                    >
                                        <Trash2 className="w-3 h-3" /> Bulk Delete
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedOrderIds([])}
                                        className="text-white/60 hover:text-white rounded-xl text-[9px] font-black uppercase"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Orders Table */}
            <div className="glass rounded-[3rem] border-border/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-8 py-6 w-10">
                                    <Checkbox
                                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-primary/20"
                                    />
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Name</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className={`hover:bg-primary/5 transition-colors group ${selectedOrderIds.includes(order.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="px-8 py-6">
                                        <Checkbox
                                            checked={selectedOrderIds.includes(order.id)}
                                            onCheckedChange={() => toggleSelectOrder(order.id)}
                                            className="border-primary/20"
                                        />
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-xs text-muted-foreground uppercase opacity-40">{order.short_id || "#ORD-" + order.id.toString().slice(0, 8)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-serif font-bold text-lg">{order?.full_name || 'Manifest Error'}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{order?.email || 'No Email'}</span>
                                            <span className="text-[8px] font-black uppercase text-primary/60">{order?.payment_method || 'card'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-serif font-black text-xl text-primary">Rs. {order.total_amount}</span>
                                            <Badge variant="outline" className={`w-fit px-2 py-0 text-[8px] uppercase border-none ${getPaymentStatus(order) === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {getPaymentStatus(order)}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest border-none ${order.status === 'paid' || order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500' :
                                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                                                order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' :
                                                    'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs text-muted-foreground font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background border border-transparent hover:border-border/20">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 shadow-2xl border-border/10 glass">
                                                <div className="px-4 py-2 mb-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Actions</p>
                                                </div>
                                                <DropdownMenuItem onClick={() => setSelectedOrder(order)} className="rounded-xl gap-3 cursor-pointer p-3">
                                                    <Eye className="w-4 h-4 text-primary" /> View Details
                                                </DropdownMenuItem>

                                                <div className="h-px bg-border/10 my-2" />
                                                <div className="px-4 py-2">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Update Status</p>
                                                </div>
                                                {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                    <DropdownMenuItem
                                                        key={s}
                                                        onClick={() => handleUpdateStatus(order.id, s)}
                                                        className={`rounded-xl gap-3 cursor-pointer p-3 ${order.status === s ? 'bg-primary/10 text-primary font-bold' : ''}`}
                                                    >
                                                        <Clock className="w-4 h-4" /> {s.toUpperCase()}
                                                    </DropdownMenuItem>
                                                ))}

                                                {order.status === 'cancelled' && (
                                                    <>
                                                        <div className="h-px bg-border/10 my-2" />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteOrder(order.id, order.status)}
                                                            className="rounded-xl gap-3 cursor-pointer p-3 text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete Order
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-12 custom-scrollbar">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <FileText className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-serif">Order <span className="text-primary italic">Detail</span></DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Reference: ORD-{selectedOrder?.id ? selectedOrder.id.slice(0, 8) : 'Unknown'}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-12 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <User className="w-3 h-3" /> Customer Information
                                        </h4>
                                        <div className="glass p-6 rounded-3xl space-y-3">
                                            <p className="text-xl font-serif">{selectedOrder?.full_name || 'No Name Provided'}</p>
                                            <p className="text-sm flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {selectedOrder?.email || 'No Email'}</p>
                                            {selectedOrder?.receiver_phone && (
                                                <p className="text-sm flex items-center gap-2 text-muted-foreground"><Truck className="w-4 h-4" /> Phone: {selectedOrder.receiver_phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    {(selectedOrder?.receiver_name || selectedOrder?.nearest_famous_place) && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                <Truck className="w-3 h-3" /> Delivery Details
                                            </h4>
                                            <div className="glass p-6 rounded-3xl space-y-2 text-sm">
                                                {selectedOrder.receiver_name && <p><span className="font-bold opacity-60">Receiver:</span> {selectedOrder.receiver_name}</p>}
                                                {selectedOrder.nearest_famous_place && <p><span className="font-bold opacity-60">Landmark:</span> {selectedOrder.nearest_famous_place}</p>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Shipping Address
                                        </h4>
                                        <div className="glass p-6 rounded-3xl space-y-2 text-sm font-light leading-relaxed">
                                            <p>{selectedOrder.address}</p>
                                            <p>{selectedOrder.city}, {selectedOrder.state} {selectedOrder.postal_code}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> Payment Method
                                        </h4>
                                        <div className="glass p-6 rounded-3xl">
                                            <p className="text-lg font-serif font-bold capitalize">{selectedOrder.payment_method || 'Card'}</p>
                                            <Badge className={`mt-2 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border-none ${selectedOrder.status === 'paid' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : selectedOrder.payment_method === 'cod'
                                                    ? 'bg-amber-500/10 text-amber-500'
                                                    : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {selectedOrder.status === 'paid' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'Paid' : selectedOrder.payment_method === 'cod' ? 'COD - Pending' : 'Unpaid'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> Order Summary
                                        </h4>
                                        <div className="glass p-8 rounded-3xl space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-bold">${Number(selectedOrder.subtotal_amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span className={`font-bold ${Number(selectedOrder.shipping_amount) === 0 ? 'text-emerald-500' : ''}`}>
                                                    {Number(selectedOrder.shipping_amount) === 0 ? 'Free' : `$${Number(selectedOrder.shipping_amount || 0).toFixed(2)}`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tax</span>
                                                <span className="font-bold">${Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                                            </div>
                                            {Number(selectedOrder.discount_amount) > 0 && (
                                                <div className="flex justify-between text-sm text-emerald-600">
                                                    <span>Discount {selectedOrder.discount_code ? `(${selectedOrder.discount_code})` : ''}</span>
                                                    <span className="font-bold">-${Number(selectedOrder.discount_amount).toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="h-px bg-border/30 my-2" />
                                            <div className="flex justify-between items-end pt-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
                                                <span className="text-4xl font-serif font-black text-primary">${Number(selectedOrder.total_amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Order Lifecycle
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                    <button
                                                        key={s}
                                                        disabled={isUpdating}
                                                        onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                        className={`flex-1 p-3 rounded-2xl flex flex-col items-center gap-2 transition-all border ${selectedOrder.status === s
                                                            ? 'bg-primary border-primary text-white shadow-xl scale-105'
                                                            : 'bg-muted/10 border-border/10 text-muted-foreground/30 hover:bg-muted/30'
                                                            }`}
                                                    >
                                                        <CheckCircle2 className={`w-4 h-4 ${selectedOrder.status === s ? 'opacity-100' : 'opacity-20'}`} />
                                                        <span className="text-[7px] font-black uppercase tracking-tighter">{s}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {isUpdating && <p className="text-[8px] text-center italic text-primary animate-pulse">Updating status...</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Ordered Items</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item: any, index: number) => (
                                        <div key={item.id || index} className="flex items-center justify-between p-6 rounded-[2rem] bg-muted/20 border border-border/10 group hover:bg-muted/40 transition-all">
                                            <div className="flex items-center gap-6">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-[10px] font-serif p-2 text-center italic opacity-60">No Image</div>
                                                )}
                                                <div>
                                                    <p className="text-lg font-serif">{item.name}</p>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Qty: {item.quantity} × ${item.price}</p>
                                                </div>
                                            </div>
                                            <p className="text-xl font-serif font-black text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
