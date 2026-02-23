import { useState, useEffect } from "react";
import {
    Truck, Save, RefreshCcw, Loader2,
    DollarSign, ArrowRight, ShieldCheck,
    Info, Globe, Zap, AlertCircle, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { settingsService } from "@/services/supabase";

export default function AdminShipping() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        flat_rate: 15,
        threshold: 150
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getShipping();
            setSettings({
                flat_rate: Number(data.flat_rate),
                threshold: Number(data.threshold)
            });
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
                <Button variant="outline" className="h-12 rounded-2xl gap-2" onClick={fetchSettings}>
                    <RefreshCcw className="w-4 h-4" /> Sync Settings
                </Button>
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
                                <span className="font-serif font-bold text-lg text-primary">${settings.flat_rate}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Threshold</span>
                                <span className="font-serif font-bold text-lg text-primary">${settings.threshold}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-amber-600/80 font-medium leading-relaxed">
                                Note: These settings require the <code className="bg-amber-500/10 px-1 rounded text-amber-700">shipping_settings</code> table to be configured in your database.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
