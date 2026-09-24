import { useState, useEffect } from "react";
import {
    Truck, Save, RefreshCcw, Loader2,
    DollarSign, ArrowRight, ShieldCheck,
    Info, Globe, Zap, AlertCircle, BadgeCheck,
    Plus, Trash2, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { settingsService, shippingService } from "@/services/supabase";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function AdminShipping() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        flat_rate: 15,
        threshold: 150
    });
    const [regionalRates, setRegionalRates] = useState<any[]>([]);
    const [isAddingRate, setIsAddingRate] = useState(false);
    const [newRate, setNewRate] = useState({ state: "", city: "", charge: 0, is_free: false });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [sData, rData] = await Promise.all([
                settingsService.getShipping(),
                shippingService.getAllRates()
            ]);
            setSettings({
                flat_rate: Number(sData.flat_rate),
                threshold: Number(sData.threshold)
            });
            setRegionalRates(rData);
        } catch (error) {
            console.error("Error fetching shipping settings:", error);
            toast({
                variant: "destructive",
                title: "Sync Failed",
                description: "Falling back to default shipping settings."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await settingsService.updateShipping(settings);
            toast({
                title: "Shipping Updated",
                description: "Global shipping settings have been updated."
            });
        } catch (error) {
            console.error("Error updating shipping:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not save shipping changes. Check database permissions."
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRegionalRate = async (id: string, updates: any) => {
        try {
            await shippingService.updateRate(id, updates);
            toast({ title: "Rate Updated" });
            fetchSettings();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed" });
        }
    };

    const handleDeleteRegionalRate = async (id: string) => {
        try {
            await shippingService.deleteRate(id);
            toast({ title: "Rate Deleted" });
            fetchSettings();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed" });
        }
    };

    const handleAddRegionalRate = async () => {
        try {
            await shippingService.createRate(newRate);
            toast({ title: "Rate Added" });
            setIsAddingRate(false);
            setNewRate({ state: "", city: "", charge: 0, is_free: false });
            fetchSettings();
        } catch (error) {
            toast({ variant: "destructive", title: "Add Failed" });
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading shipping settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-serif tracking-tight">Global <span className="text-primary italic">Shipping</span></h1>
                    <p className="text-muted-foreground font-light uppercase tracking-widest text-[10px]">Manage your store's shipping and delivery settings.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2" onClick={fetchSettings}>
                        <RefreshCcw className="w-4 h-4" /> Sync Settings
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="glass border-border/10 shadow-sm relative overflow-hidden group col-span-2">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Globe className="w-32 h-32 rotate-12" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl font-serif flex items-center gap-3">
                            <Truck className="h-6 w-6 text-primary" />
                            Shipping Configuration
                        </CardTitle>
                        <CardDescription>Configure global shipping rates and free delivery thresholds</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-10 py-6">
                        <form onSubmit={handleSave} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Flat Shipping Rate</Label>
                                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                                        <Input
                                            type="number"
                                            value={settings.flat_rate}
                                            onChange={(e) => setSettings({ ...settings, flat_rate: Number(e.target.value) })}
                                            className="h-16 pl-14 rounded-[2rem] bg-muted/20 border-none text-2xl font-serif font-black"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-light px-2">Applied to all standard orders globally.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Free Shipping Threshold</Label>
                                        <Zap className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                                        <Input
                                            type="number"
                                            value={settings.threshold}
                                            onChange={(e) => setSettings({ ...settings, threshold: Number(e.target.value) })}
                                            className="h-16 pl-14 rounded-[2rem] bg-muted/20 border-border/20 border-2 text-2xl font-serif font-black"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-light px-2">Free shipping is applied to orders exceeding this value.</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-16 rounded-full text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 bg-primary group"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" />}
                                Save Shipping Settings
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <div className="glass p-8 rounded-[2.5rem] bg-primary text-primary-foreground space-y-4 shadow-xl shadow-primary/20">
                        <ShieldCheck className="w-10 h-10 opacity-50" />
                        <h4 className="text-xl font-serif italic">Live Updates</h4>
                        <p className="text-[10px] leading-relaxed uppercase tracking-widest opacity-80 font-bold">
                            Changes made here translate instantly to the customer checkout process.
                        </p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border-border/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-primary" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Settings Summary</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Current Rate</span>
                                <span className="font-serif font-bold text-lg text-primary">Rs. {settings.flat_rate}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Threshold</span>
                                <span className="font-serif font-bold text-lg text-primary">Rs. {settings.threshold}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-amber-600/80 font-medium leading-relaxed">
                                Manage city-specific rates in the section below.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="glass border-border/10 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-serif flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-primary" />
                            Regional Shipping Rates (Pakistan)
                        </CardTitle>
                        <CardDescription>Manage state and city specific shipping charges</CardDescription>
                    </div>
                    <Button 
                        onClick={() => setIsAddingRate(true)}
                        className="rounded-full h-10 px-6 gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Rate
                    </Button>
                </CardHeader>
                <CardContent className="py-6">
                    {isAddingRate && (
                        <div className="mb-8 p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 animate-in slide-in-from-top-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">State</Label>
                                    <Input 
                                        value={newRate.state} 
                                        onChange={e => setNewRate({...newRate, state: e.target.value})}
                                        placeholder="e.g. Punjab"
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">City (Optional)</Label>
                                    <Input 
                                        value={newRate.city} 
                                        onChange={e => setNewRate({...newRate, city: e.target.value})}
                                        placeholder="e.g. Lahore"
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Charge (Rs.)</Label>
                                    <Input 
                                        type="number"
                                        value={newRate.charge} 
                                        onChange={e => setNewRate({...newRate, charge: Number(e.target.value)})}
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button onClick={handleAddRegionalRate} className="flex-1 rounded-xl">Add</Button>
                                    <Button variant="outline" onClick={() => setIsAddingRate(false)} className="rounded-xl">Cancel</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        {Object.entries(
                            regionalRates.reduce((acc: any, rate: any) => {
                                if (!acc[rate.state]) acc[rate.state] = [];
                                acc[rate.state].push(rate);
                                return acc;
                            }, {})
                        ).map(([state, rates]: [string, any]) => (
                            <div key={state} className="space-y-4">
                                <div className="flex items-center gap-4 border-b border-border/10 pb-4">
                                    <h3 className="text-xl font-serif text-primary italic">{state}</h3>
                                    <Badge variant="outline" className="rounded-full text-[8px] font-black uppercase">
                                        {rates.length} Rates Defined
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {rates.map((rate: any) => (
                                        <div 
                                            key={rate.id}
                                            className="group flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-muted/5 border border-border/5 hover:border-primary/20 hover:bg-muted/10 transition-all duration-300 shadow-sm"
                                        >
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center p-3 group-hover:bg-primary/10 transition-colors">
                                                    <MapPin className="w-full h-full text-primary opacity-40" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold">{rate.city || "All Cities / State-wide"}</span>
                                                        {!rate.city && <Badge variant="secondary" className="text-[7px] font-black uppercase tracking-widest px-2 py-0">Global Fallback</Badge>}
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-50">Local Delivery Rate</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-8 md:gap-12">
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1 text-center block">Shipping Charge</Label>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-xl border border-border/5 shadow-inner">
                                                        <span className="text-[10px] text-muted-foreground font-mono">Rs.</span>
                                                        <Input 
                                                            type="number"
                                                            value={rate.charge}
                                                            onChange={(e) => handleUpdateRegionalRate(rate.id, { charge: Number(e.target.value) })}
                                                            className="h-8 w-20 bg-transparent border-none text-sm font-serif font-black p-0 focus:ring-0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 flex flex-col items-center">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest opacity-40 text-center block">Free Toggle</Label>
                                                    <div className="flex items-center gap-3 h-12">
                                                        <Switch 
                                                            checked={rate.is_free}
                                                            onCheckedChange={(checked) => handleUpdateRegionalRate(rate.id, { is_free: checked, charge: checked ? 0 : rate.charge })}
                                                            className="scale-90"
                                                        />
                                                        {rate.is_free && <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase py-0.5">Free</Badge>}
                                                    </div>
                                                </div>

                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteRegionalRate(rate.id)}
                                                    className="text-destructive h-10 w-10 rounded-2xl hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {regionalRates.length === 0 && (
                            <div className="py-20 text-center space-y-6">
                                <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto border border-border/5">
                                    <Globe className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-serif italic text-lg">No regional rates defined yet.</p>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Add your first state-specific charge to get started.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
