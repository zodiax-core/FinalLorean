import { useState, useEffect } from "react";
import {
    Store, UserPlus, MoreVertical, CheckCircle, XCircle, Ban,
    Eye, Edit, Trash2, Shield, Package, ShoppingCart, DollarSign,
    TrendingUp, Clock, Search, Filter, Loader2, AlertTriangle,
    Activity, FileText, CreditCard, Mail, Phone, Building, Calendar,
    Sparkles, ShieldCheck, ShieldAlert, ShieldOff, History, Send, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { vendorsService } from "@/services/supabase";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminVendors() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const { toast } = useToast();

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Vendor Details States
    const [vendorProducts, setVendorProducts] = useState<any[]>([]);
    const [vendorOrders, setVendorOrders] = useState<any[]>([]);
    const [vendorActivityLogs, setVendorActivityLogs] = useState<any[]>([]);
    const [vendorRole, setVendorRole] = useState<any>(null);
    const [vendorPayouts, setVendorPayouts] = useState<any[]>([]);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        status: "pending",
        verification_status: "unverified",
        commission_rate: 15
    });

    const [roleData, setRoleData] = useState({
        role_name: "seller",
        permissions: {
            can_add_products: true,
            can_edit_products: true,
            can_view_orders: true,
            can_fulfill_orders: true
        }
    });

    const [payoutData, setPayoutData] = useState({
        amount: 0,
        payment_method: "",
        notes: ""
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const data = await vendorsService.getAll();
            setVendors(data);
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load vendors." });
        } finally {
            setLoading(false);
        }
    };

    const fetchVendorDetails = async (vendorId: string) => {
        try {
            const [products, orders, logs, role, payouts] = await Promise.all([
                vendorsService.getVendorProducts(vendorId),
                vendorsService.getVendorOrders(vendorId),
                vendorsService.getVendorActivityLogs(vendorId),
                vendorsService.getVendorRole(vendorId),
                vendorsService.getVendorPayouts(vendorId)
            ]);
            setVendorProducts(products);
            setVendorOrders(orders);
            setVendorActivityLogs(logs);
            setVendorRole(role);
            setVendorPayouts(payouts);
        } catch (error) {
            console.error("Details fetch error:", error);
        }
    };

    const handleAddVendor = async () => {
        setIsSubmitting(true);
        try {
            await vendorsService.create(formData);
            toast({ title: "Vendor Added", description: "New vendor has been successfully added." });
            setIsAddDialogOpen(false);
            resetForm();
            fetchVendors();
        } catch (error) {
            toast({ variant: "destructive", title: "Create Failed", description: "Could not add vendor." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditVendor = async () => {
        if (!selectedVendor) return;
        setIsSubmitting(true);
        try {
            await vendorsService.update(selectedVendor.id, formData);
            toast({ title: "Vendor Updated", description: "Vendor details have been updated." });
            setIsEditDialogOpen(false);
            resetForm();
            fetchVendors();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update vendor." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVendor = async (id: string) => {
        if (!confirm("Are you sure you want to delete this vendor?")) return;
        try {
            await vendorsService.delete(id);
            toast({ title: "Vendor Deleted", description: "Vendor has been removed." });
            fetchVendors();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "The vendor could not be deleted." });
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await vendorsService.update(id, { status });
            toast({ title: "Status Updated", description: `Vendor status set to ${status}.` });
            fetchVendors();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not change vendor status." });
        }
    };

    const handleUpdateVerification = async (id: string, verification_status: string) => {
        try {
            await vendorsService.update(id, { verification_status });
            toast({ title: "Verification Updated", description: `Vendor verification set to ${verification_status}.` });
            fetchVendors();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not change verification status." });
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedVendor) return;
        setIsSubmitting(true);
        try {
            await vendorsService.updateVendorRole(selectedVendor.id, roleData);
            toast({ title: "Role Updated", description: "Vendor permissions have been updated." });
            setIsRoleDialogOpen(false);
            fetchVendorDetails(selectedVendor.id);
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update vendor role." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreatePayout = async () => {
        if (!selectedVendor) return;
        setIsSubmitting(true);
        try {
            await vendorsService.createPayout({
                vendor_id: selectedVendor.id,
                ...payoutData,
                status: 'pending'
            });
            toast({ title: "Payout Initiated", description: "Vendor payout has been scheduled." });
            setIsPayoutDialogOpen(false);
            setPayoutData({ amount: 0, payment_method: "", notes: "" });
            fetchVendorDetails(selectedVendor.id);
        } catch (error) {
            toast({ variant: "destructive", title: "Payout Failed", description: "Could not initiate vendor payout." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (vendor: any) => {
        setSelectedVendor(vendor);
        setFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone || "",
            company_name: vendor.company_name || "",
            status: vendor.status,
            verification_status: vendor.verification_status,
            commission_rate: vendor.commission_rate
        });
        setIsEditDialogOpen(true);
    };

    const openDetailsDialog = async (vendor: any) => {
        setSelectedVendor(vendor);
        setIsDetailsDialogOpen(true);
        await fetchVendorDetails(vendor.id);
    };

    const openRoleDialog = async (vendor: any) => {
        setSelectedVendor(vendor);
        const role = await vendorsService.getVendorRole(vendor.id);
        if (role) {
            setRoleData({
                role_name: role.role_name,
                permissions: role.permissions
            });
        }
        setIsRoleDialogOpen(true);
    };

    const openPayoutDialog = (vendor: any) => {
        setSelectedVendor(vendor);
        setPayoutData({
            amount: vendor.pending_payout || 0,
            payment_method: "",
            notes: ""
        });
        setIsPayoutDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            company_name: "",
            status: "pending",
            verification_status: "unverified",
            commission_rate: 15
        });
        setSelectedVendor(null);
    };

    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch =
            vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === "all" || vendor.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: vendors.length,
        active: vendors.filter(v => v.status === 'active').length,
        pending: vendors.filter(v => v.status === 'pending').length,
        suspended: vendors.filter(v => v.status === 'suspended').length
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading vendors...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Vendors</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.total}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Vendor List</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Vendors</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.active}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Active Now</p>
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
                        <div className="text-3xl font-serif font-black">{stats.pending}</div>
                        <p className="text-[10px] text-amber-500 mt-2 font-bold uppercase tracking-widest">Pending Review</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suspended</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Ban className="h-4 w-4 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.suspended}</div>
                        <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-widest">Suspended Accounts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-1 items-center gap-4 w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search vendors..."
                                    className="pl-10 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[160px] h-12 rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="h-12 px-8 rounded-xl gap-2 shadow-xl shadow-primary/20"
                        >
                            <UserPlus className="w-4 h-4" /> Add Vendor
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Vendors Table */}
            <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/10 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Vendor</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Verification</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Commission</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Products</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Joined</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVendors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4 opacity-50">
                                            <Store className="w-12 h-12" />
                                            <p className="font-serif italic text-lg text-muted-foreground">No vendors found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <TableRow key={vendor.id} className="border-border/10 hover:bg-primary/5 transition-colors">
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-serif font-bold">{vendor.name}</p>
                                                {vendor.company_name && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Building className="w-3 h-3" /> {vendor.company_name}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-xs flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-muted-foreground" /> {vendor.email}
                                                </p>
                                                {vendor.phone && (
                                                    <p className="text-xs flex items-center gap-1 text-muted-foreground">
                                                        <Phone className="w-3 h-3" /> {vendor.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-full text-[9px] font-black uppercase tracking-widest px-3 py-1 ${vendor.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                                vendor.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                    vendor.status === 'suspended' ? 'bg-rose-500/10 text-rose-500' :
                                                        'bg-muted text-muted-foreground'
                                                }`}>
                                                {vendor.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-full text-[9px] font-black uppercase tracking-widest px-3 py-1 ${vendor.verification_status === 'verified' ? 'bg-primary/10 text-primary' :
                                                vendor.verification_status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                {vendor.verification_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-primary">{vendor.commission_rate}%</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold">{vendor.total_products || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(vendor.joined_date).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                                                    <DropdownMenuLabel className="text-[10px] uppercase font-black">Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openDetailsDialog(vendor)} className="rounded-xl gap-2">
                                                        <Eye className="w-4 h-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditDialog(vendor)} className="rounded-xl gap-2">
                                                        <Edit className="w-4 h-4" /> Edit Vendor
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openRoleDialog(vendor)} className="rounded-xl gap-2">
                                                        <Shield className="w-4 h-4" /> Manage Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openPayoutDialog(vendor)} className="rounded-xl gap-2">
                                                        <DollarSign className="w-4 h-4" /> Process Payout
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(vendor.id, 'active')} className="rounded-xl gap-2 text-emerald-500">
                                                        <CheckCircle className="w-4 h-4" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(vendor.id, 'suspended')} className="rounded-xl gap-2 text-amber-500">
                                                        <Ban className="w-4 h-4" /> Suspend
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(vendor.id, 'disabled')} className="rounded-xl gap-2 text-rose-500">
                                                        <XCircle className="w-4 h-4" /> Disable
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteVendor(vendor.id)} className="rounded-xl gap-2 text-rose-500">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Vendor Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <UserPlus className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Add New <span className="text-primary italic">Vendor</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Add a new vendor to the platform.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Vendor Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="Enter vendor name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="vendor@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Phone</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Company Name</Label>
                            <Input
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="Company LLC"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Commission Rate (%)</Label>
                            <Input
                                type="number"
                                value={formData.commission_rate}
                                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="15"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Initial Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleAddVendor}
                            disabled={isSubmitting || !formData.name || !formData.email}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Vendor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Vendor Dialog - Similar structure to Add */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Edit className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Edit <span className="text-primary italic">Vendor</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Update vendor details and profile.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Vendor Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Phone</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Company Name</Label>
                            <Input
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Commission Rate (%)</Label>
                            <Input
                                type="number"
                                value={formData.commission_rate}
                                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Verification Status</Label>
                            <Select value={formData.verification_status} onValueChange={(value) => setFormData({ ...formData, verification_status: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleEditVendor}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Update Vendor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Vendor Details Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="max-w-6xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10 max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="space-y-4 shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">{selectedVendor?.name} <span className="text-primary italic">Details</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Complete vendor profile and performance analytics.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                        <TabsList className="bg-muted/10 p-1 rounded-full h-auto border border-border/10 shrink-0">
                            <TabsTrigger value="overview" className="rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest">Overview</TabsTrigger>
                            <TabsTrigger value="products" className="rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest">Products</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest">Orders</TabsTrigger>
                            <TabsTrigger value="payouts" className="rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest">Payouts</TabsTrigger>
                            <TabsTrigger value="activity" className="rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest">Activity</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto mt-6">
                            <TabsContent value="overview" className="space-y-6 m-0">
                                <div className="grid grid-cols-3 gap-6">
                                    <Card className="glass border-border/10">
                                        <CardContent className="p-6 space-y-2">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Package className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Total Products</span>
                                            </div>
                                            <p className="text-3xl font-serif font-black">{selectedVendor?.total_products || 0}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass border-border/10">
                                        <CardContent className="p-6 space-y-2">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <ShoppingCart className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Total Orders</span>
                                            </div>
                                            <p className="text-3xl font-serif font-black">{selectedVendor?.total_orders || 0}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass border-border/10">
                                        <CardContent className="p-6 space-y-2">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Pending Payout</span>
                                            </div>
                                            <p className="text-3xl font-serif font-black text-primary">Rs. {selectedVendor?.pending_payout || 0}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Information</h4>
                                        <div className="glass p-6 rounded-2xl space-y-3 border-border/10">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">{selectedVendor?.email}</span>
                                            </div>
                                            {selectedVendor?.phone && (
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{selectedVendor?.phone}</span>
                                                </div>
                                            )}
                                            {selectedVendor?.company_name && (
                                                <div className="flex items-center gap-3">
                                                    <Building className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{selectedVendor?.company_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendor Status</h4>
                                        <div className="glass p-6 rounded-2xl space-y-3 border-border/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Account Status</span>
                                                <Badge className={`rounded-full text-[9px] font-black uppercase ${selectedVendor?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    selectedVendor?.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-rose-500/10 text-rose-500'
                                                    }`}>
                                                    {selectedVendor?.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Verification</span>
                                                <Badge className={`rounded-full text-[9px] font-black uppercase ${selectedVendor?.verification_status === 'verified' ? 'bg-primary/10 text-primary' :
                                                    'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {selectedVendor?.verification_status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Commission Rate</span>
                                                <span className="font-bold text-primary">{selectedVendor?.commission_rate}%</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Joined Date</span>
                                                <span className="text-sm">{new Date(selectedVendor?.joined_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="products" className="m-0">
                                <div className="space-y-4">
                                    {vendorProducts.length === 0 ? (
                                        <div className="text-center py-20 opacity-50">
                                            <Package className="w-12 h-12 mx-auto mb-4" />
                                            <p className="font-serif italic">No products found.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-4">
                                            {vendorProducts.map((product) => (
                                                <Card key={product.id} className="glass border-border/10">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                                                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                        <div>
                                                            <p className="font-serif font-bold text-sm line-clamp-1">{product.name}</p>
                                                            <p className="text-primary font-bold">${product.price}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="orders" className="m-0">
                                <div className="space-y-4">
                                    {vendorOrders.length === 0 ? (
                                        <div className="text-center py-20 opacity-50">
                                            <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                                            <p className="font-serif italic">No orders found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {vendorOrders.map((order) => (
                                                <Card key={order.id} className="glass border-border/10">
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-mono text-xs text-muted-foreground">{order.short_id || "#" + order.id.slice(0, 8)}</p>
                                                            <p className="font-bold">Rs. {order.total}</p>
                                                        </div>
                                                        <Badge className="rounded-full text-[9px] font-black uppercase">
                                                            {order.status}
                                                        </Badge>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="payouts" className="m-0">
                                <div className="space-y-4">
                                    {vendorPayouts.length === 0 ? (
                                        <div className="text-center py-20 opacity-50">
                                            <DollarSign className="w-12 h-12 mx-auto mb-4" />
                                            <p className="font-serif italic">No payouts processed yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {vendorPayouts.map((payout) => (
                                                <Card key={payout.id} className="glass border-border/10">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-bold text-lg">Rs. {payout.amount}</p>
                                                            <Badge className={`rounded-full text-[9px] font-black uppercase ${payout.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                payout.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                                                                    'bg-muted text-muted-foreground'
                                                                }`}>
                                                                {payout.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(payout.requested_at).toLocaleDateString()}
                                                        </p>
                                                        {payout.notes && <p className="text-xs mt-2 italic">{payout.notes}</p>}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="m-0">
                                <div className="space-y-3">
                                    {vendorActivityLogs.length === 0 ? (
                                        <div className="text-center py-20 opacity-50">
                                            <Activity className="w-12 h-12 mx-auto mb-4" />
                                            <p className="font-serif italic">No activity recorded yet.</p>
                                        </div>
                                    ) : (
                                        vendorActivityLogs.map((log) => (
                                            <Card key={log.id} className="glass border-border/10">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <Activity className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{log.description}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(log.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase">
                                                            {log.activity_type}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Role Management Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="max-w-xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Manage <span className="text-primary italic">Role & Permissions</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Define vendor capabilities and access rights.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Role</Label>
                            <Select value={roleData.role_name} onValueChange={(value) => setRoleData({ ...roleData, role_name: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="seller">Seller</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Permissions</Label>
                            <div className="glass p-6 rounded-2xl space-y-4 border-border/10">
                                {Object.entries(roleData.permissions).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                                        <Button
                                            variant={value ? "default" : "outline"}
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => setRoleData({
                                                ...roleData,
                                                permissions: { ...roleData.permissions, [key]: !value }
                                            })}
                                        >
                                            {value ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleUpdateRole}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            Update Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payout Dialog */}
            <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
                <DialogContent className="max-w-xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <DollarSign className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Process <span className="text-primary italic">Payout</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Send compensation to the vendor.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Amount ($)</Label>
                            <Input
                                type="number"
                                value={payoutData.amount}
                                onChange={(e) => setPayoutData({ ...payoutData, amount: parseFloat(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Payment Method</Label>
                            <Input
                                value={payoutData.payment_method}
                                onChange={(e) => setPayoutData({ ...payoutData, payment_method: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="Bank Transfer, PayPal, etc."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Notes</Label>
                            <Input
                                value={payoutData.notes}
                                onChange={(e) => setPayoutData({ ...payoutData, notes: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="Optional notes..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsPayoutDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleCreatePayout}
                            disabled={isSubmitting || payoutData.amount <= 0}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Payout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
