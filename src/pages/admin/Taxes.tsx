import { useState, useEffect } from "react";
import {
    Receipt, Plus, MoreVertical, Edit, Trash2, Power, PowerOff,
    Globe, Percent, DollarSign, Search, Filter, Loader2, AlertTriangle,
    TrendingUp, FileText, Calendar, CheckCircle, XCircle, Sparkles,
    ShoppingBag, BarChart3, Info, Shield, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { taxService } from "@/services/supabase";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "IN", name: "India" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
    { code: "BR", name: "Brazil" },
    { code: "GLOBAL", name: "Global (All Countries)" }
];

export default function AdminTaxes() {
    const [taxRules, setTaxRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCountry, setFilterCountry] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const { toast } = useToast();

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
    const [selectedTaxRule, setSelectedTaxRule] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tax Summary
    const [taxSummary, setTaxSummary] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        tax_name: "",
        tax_type: "percentage",
        tax_rate: 0,
        country: "GLOBAL",
        region: "",
        is_active: true,
        priority: 1,
        product_overrides: {}
    });

    useEffect(() => {
        fetchTaxRules();
    }, []);

    const fetchTaxRules = async () => {
        setLoading(true);
        try {
            const data = await taxService.getAll();
            setTaxRules(data);
        } catch (error) {
            console.error("Fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load tax rules." });
        } finally {
            setLoading(false);
        }
    };

    const fetchTaxSummary = async () => {
        setSummaryLoading(true);
        try {
            const summary = await taxService.getTaxSummary();
            setTaxSummary(summary);
        } catch (error) {
            console.error("Summary error:", error);
            toast({ variant: "destructive", title: "Summary Failed", description: "Could not generate tax report." });
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleAddTaxRule = async () => {
        setIsSubmitting(true);
        try {
            await taxService.create(formData);
            toast({ title: "Tax Rule Created", description: "New tax rule has been successfully added." });
            setIsAddDialogOpen(false);
            resetForm();
            fetchTaxRules();
        } catch (error: any) {
            console.error("Tax creation error:", error);
            const errorMessage = error?.message || error?.error?.message || "Could not create tax rule.";
            toast({
                variant: "destructive",
                title: "Creation Failed",
                description: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTaxRule = async () => {
        if (!selectedTaxRule) return;
        setIsSubmitting(true);
        try {
            await taxService.update(selectedTaxRule.id, formData);
            toast({ title: "Tax Rule Updated", description: "Tax rule successfully updated." });
            setIsEditDialogOpen(false);
            resetForm();
            fetchTaxRules();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update tax rule." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTaxRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tax rule?")) return;
        try {
            await taxService.delete(id);
            toast({ title: "Tax Rule Deleted", description: "Tax rule has been successfully removed." });
            fetchTaxRules();
        } catch (error) {
            toast({ variant: "destructive", title: "Deletion Failed", description: "The tax rule could not be deleted." });
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await taxService.toggleActive(id, !isActive);
            toast({ title: "Status Updated", description: `Tax rule is now ${!isActive ? 'active' : 'inactive'}.` });
            fetchTaxRules();
        } catch (error) {
            toast({ variant: "destructive", title: "Toggle Failed", description: "Could not change tax status." });
        }
    };

    const openEditDialog = (taxRule: any) => {
        setSelectedTaxRule(taxRule);
        setFormData({
            tax_name: taxRule.tax_name,
            tax_type: taxRule.tax_type,
            tax_rate: taxRule.tax_rate,
            country: taxRule.country,
            region: taxRule.region || "",
            is_active: taxRule.is_active,
            priority: taxRule.priority,
            product_overrides: taxRule.product_overrides || {}
        });
        setIsEditDialogOpen(true);
    };

    const openSummaryDialog = async () => {
        setIsSummaryDialogOpen(true);
        await fetchTaxSummary();
    };

    const resetForm = () => {
        setFormData({
            tax_name: "",
            tax_type: "percentage",
            tax_rate: 0,
            country: "GLOBAL",
            region: "",
            is_active: true,
            priority: 1,
            product_overrides: {}
        });
        setSelectedTaxRule(null);
    };

    const filteredTaxRules = taxRules.filter(rule => {
        const matchesSearch =
            rule.tax_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rule.country?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCountry = filterCountry === "all" || rule.country === filterCountry;
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && rule.is_active) ||
            (filterStatus === "inactive" && !rule.is_active);

        return matchesSearch && matchesCountry && matchesStatus;
    });

    const stats = {
        total: taxRules.length,
        active: taxRules.filter(r => r.is_active).length,
        inactive: taxRules.filter(r => !r.is_active).length,
        countries: new Set(taxRules.map(r => r.country)).size
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading tax rules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Rules</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.total}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Active Rules</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Rules</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.active}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Currently Applied</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inactive Rules</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.inactive}</div>
                        <p className="text-[10px] text-amber-500 mt-2 font-bold uppercase tracking-widest">Dormant</p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Countries</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{stats.countries}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Regions Covered</p>
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
                                    placeholder="Search tax rules..."
                                    className="pl-10 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filterCountry} onValueChange={setFilterCountry}>
                                <SelectTrigger className="w-[180px] h-12 rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {COUNTRIES.map(c => (
                                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[160px] h-12 rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={openSummaryDialog}
                                className="h-12 px-6 rounded-xl gap-2"
                            >
                                <BarChart3 className="w-4 h-4" /> Tax Report
                            </Button>
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="h-12 px-8 rounded-xl gap-2 shadow-xl shadow-primary/20"
                            >
                                <Plus className="w-4 h-4" /> Add Tax Rule
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tax Rules Table */}
            <Card className="glass border-border/10 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/10 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Tax Name</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Rate/Amount</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Country</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Region</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Priority</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTaxRules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4 opacity-50">
                                            <Receipt className="w-12 h-12" />
                                            <p className="font-serif italic text-lg text-muted-foreground">No tax rules found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTaxRules.map((rule) => (
                                    <TableRow key={rule.id} className="border-border/10 hover:bg-primary/5 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Receipt className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="font-serif font-bold">{rule.tax_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase">
                                                {rule.tax_type === 'percentage' ? <Percent className="w-3 h-3 mr-1" /> : <DollarSign className="w-3 h-3 mr-1" />}
                                                {rule.tax_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-primary">
                                                {rule.tax_type === 'percentage' ? `${rule.tax_rate}%` : `Rs. ${rule.tax_rate}`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm">{COUNTRIES.find(c => c.code === rule.country)?.name || rule.country}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{rule.region || '—'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="rounded-full text-[9px] font-black">
                                                {rule.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`rounded-full text-[9px] font-black uppercase tracking-widest px-3 py-1 ${rule.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {rule.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                                                    <DropdownMenuLabel className="text-[10px] uppercase font-black">Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEditDialog(rule)} className="rounded-xl gap-2">
                                                        <Edit className="w-4 h-4" /> Edit Rule
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleActive(rule.id, rule.is_active)}
                                                        className={`rounded-xl gap-2 ${rule.is_active ? 'text-amber-500' : 'text-emerald-500'}`}
                                                    >
                                                        {rule.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                        {rule.is_active ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteTaxRule(rule.id)} className="rounded-xl gap-2 text-rose-500">
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

            {/* Add Tax Rule Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Add New <span className="text-primary italic">Tax Rule</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Add a new tax rule to the system.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Tax Name</Label>
                            <Input
                                value={formData.tax_name}
                                onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="e.g. VAT, GST, Sales Tax"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Tax Type</Label>
                            <Select value={formData.tax_type} onValueChange={(value) => setFormData({ ...formData, tax_type: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                {formData.tax_type === 'percentage' ? 'Tax Rate (%)' : 'Tax Amount (Rs.)'}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.tax_rate}
                                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Country</Label>
                            <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map(c => (
                                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Region (Optional)</Label>
                            <Input
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="e.g. California, Ontario"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Priority</Label>
                            <Input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                                placeholder="1"
                            />
                            <p className="text-[9px] text-muted-foreground px-2">Lower number = higher priority</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleAddTaxRule}
                            disabled={isSubmitting || !formData.tax_name || formData.tax_rate <= 0}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Tax Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Tax Rule Dialog - Similar to Add */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Edit className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Edit <span className="text-primary italic">Tax Rule</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Update tax rule details and parameters.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Tax Name</Label>
                            <Input
                                value={formData.tax_name}
                                onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Tax Type</Label>
                            <Select value={formData.tax_type} onValueChange={(value) => setFormData({ ...formData, tax_type: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">
                                {formData.tax_type === 'percentage' ? 'Tax Rate (%)' : 'Tax Amount ($)'}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.tax_rate}
                                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Country</Label>
                            <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-border/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map(c => (
                                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Region (Optional)</Label>
                            <Input
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Priority</Label>
                            <Input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                className="h-12 rounded-xl bg-muted/20 border-border/5"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="rounded-full h-14 px-8" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-full h-14 px-10 gap-2 shadow-2xl shadow-primary/20"
                            onClick={handleEditTaxRule}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Tax Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tax Summary Dialog */}
            <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
                <DialogContent className="max-w-3xl rounded-[3rem] p-10 bg-background/95 backdrop-blur-2xl border-border/10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif">Tax <span className="text-primary italic">Summary Report</span></DialogTitle>
                            <DialogDescription className="font-light text-base mt-2">
                                Complete breakdown of tax collections across all orders.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {summaryLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-muted-foreground font-serif italic">Calculating tax totals...</p>
                        </div>
                    ) : taxSummary ? (
                        <div className="space-y-6 py-6">
                            <div className="grid grid-cols-3 gap-6">
                                <Card className="glass border-border/10">
                                    <CardContent className="p-6 space-y-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Total Collected</span>
                                        </div>
                                        <p className="text-3xl font-serif font-black text-primary">Rs. {taxSummary.totalTaxCollected.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass border-border/10">
                                    <CardContent className="p-6 space-y-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <ShoppingBag className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Orders</span>
                                        </div>
                                        <p className="text-3xl font-serif font-black">{taxSummary.orderCount}</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass border-border/10">
                                    <CardContent className="p-6 space-y-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Average Tax</span>
                                        </div>
                                        <p className="text-3xl font-serif font-black">Rs. {taxSummary.averageTax.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tax Breakdown by Type</h4>
                                <div className="glass p-6 rounded-2xl space-y-3 border-border/10">
                                    {Object.entries(taxSummary.byTaxType).length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No tax data available yet.</p>
                                    ) : (
                                        Object.entries(taxSummary.byTaxType).map(([name, amount]) => (
                                            <div key={name} className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{name}</span>
                                                <span className="font-bold text-primary">Rs. {(amount as number).toFixed(2)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
