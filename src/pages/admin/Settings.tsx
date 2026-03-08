import { useState, useEffect } from "react";
import {
    Bell, Save, Loader2, Trash2, Key, Mail, ShieldAlert, Sparkles, Layout, Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { settingsService } from "@/services/supabase";
import { emailService } from "@/services/email";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    const [configs, setConfigs] = useState<any>({
        email_config: {
            service_id: "",
            template_id: "",
            public_key: "",
            contact_template_id: ""
        },
        marketing: {
            hero_bar: { enabled: false, text: "", bg_color: "#000000", text_color: "#ffffff" },
            social_links: { instagram: "", twitter: "", facebook: "", youtube: "" }
        }
    });

    // Clear Site Data state
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [privateKeyInput, setPrivateKeyInput] = useState("");
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getAllConfigs();
            setConfigs((prev: any) => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Settings fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load settings." });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await Promise.all([
                settingsService.updateConfig('email_config', configs.email_config),
                settingsService.updateConfig('marketing', configs.marketing)
            ]);
            toast({ title: "Manifested", description: "Your shop configurations have been preserved." });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed", description: "The ritual was interrupted." });
        } finally {
            setSubmitting(false);
        }
    };

    const updateHeroBar = (field: string, value: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            marketing: {
                ...prev.marketing,
                hero_bar: { ...prev.marketing.hero_bar, [field]: value }
            }
        }));
    };

    const updateSocialLinks = (field: string, value: string) => {
        setConfigs((prev: any) => ({
            ...prev,
            marketing: {
                ...prev.marketing,
                social_links: { ...prev.marketing.social_links, [field]: value }
            }
        }));
    };

    const handleClearSiteData = async () => {
        if (privateKeyInput !== "98983104") {
            toast({ variant: "destructive", title: "Invalid Key", description: "The private key is incorrect. Access denied." });
            return;
        }

        setIsClearing(true);
        try {
            const { supabase } = await import("@/integrations/supabase/client");

            // Define tables to clear
            const tables = [
                'orders',
                'returns',
                'reviews',
                'review_logs',
                'contact_messages',
                'newsletter_subscriptions',
                'tax_rules',
                'support_tickets',
                'ticket_messages',
                'ticket_activity_logs',
                'debug_logs',
                'admin_activity_logs'
            ];

            for (const table of tables) {
                const { error } = await supabase.from(table).delete().not('id', 'is', null);
                if (error) console.warn(`Error clearing ${table}:`, error);
            }

            // Also reset all product ratings/reviews to baseline
            const { error: productResetError } = await supabase
                .from('products')
                .update({ rating: 5.0, reviews: 0 });

            if (productResetError) console.warn("Error resetting products:", productResetError);

            toast({ title: "Site Data Cleared", description: "All orders, reviews, and marketing data have been ritualistically dissolved." });
            setShowClearDialog(false);
            setPrivateKeyInput("");
            fetchSettings();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to clear some data partitions." });
        } finally {
            setIsClearing(false);
        }
    };

    const handleTestEmailConfig = async () => {
        try {
            await emailService.sendEmail({
                order_id: "TEST-777",
                to_email: "loreanpk@gmail.com",
                name: "Patron of Rituals",
                price: 1500,
                cost: {
                    shipping: 0,
                    tax: 120,
                    total: 1620
                },
                subject: "Ritual Connection Test",
                message: "The bridge between digital and botanical realms is established.",
                to_name: "Lorean Admin"
            });
            toast({ title: "Connection Established", description: "The email spirits have responded successfully!" });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Connection Failed", description: e.message });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                <p className="font-serif italic text-muted-foreground animate-pulse">Summoning Settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Boutique Ecosystem</span>
                        <span className="w-1 h-1 rounded-full bg-primary/30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Core Settings</span>
                    </div>
                    <h1 className="text-5xl font-serif italic mb-2">Boutique <span className="text-primary not-italic font-bold">Settings</span></h1>
                    <p className="text-muted-foreground font-light max-w-xl">Configure the inner workings of your digital boutique and manage administrative rituals.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={submitting}
                    className="h-14 px-10 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary"
                >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-3" />Preserving...</> : <><Save className="w-4 h-4 mr-3" />Save Settings</>}
                </Button>
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-muted/30 p-1.5 rounded-full border border-border/10">
                    <TabsTrigger value="general" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest transition-all">General</TabsTrigger>
                    <TabsTrigger value="advanced" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest transition-all">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-10 focus-visible:outline-none">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        {/* Hero Banner (Moved from Marketing) */}
                        <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                            <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-border/5">
                                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                                    <Layout className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-serif italic">Hero Banner</CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Sticky announcement bar at the top of all pages</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8">
                                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-muted/20 border border-border/10">
                                    <div>
                                        <h4 className="font-serif font-black italic">Enable Hero Bar</h4>
                                        <p className="text-xs text-muted-foreground">Display a sticky notification strip at the top of the site</p>
                                    </div>
                                    <Switch
                                        checked={configs.marketing?.hero_bar?.enabled}
                                        onCheckedChange={(v) => updateHeroBar('enabled', v)}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Banner Text</Label>
                                    <Input
                                        value={configs.marketing?.hero_bar?.text || ""}
                                        onChange={(e) => updateHeroBar('text', e.target.value)}
                                        placeholder="e.g. Free shipping on orders over Rs. 5000"
                                        className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Background Color</Label>
                                        <div className="flex gap-3">
                                            <input type="color" value={configs.marketing?.hero_bar?.bg_color || "#000000"}
                                                onChange={(e) => updateHeroBar('bg_color', e.target.value)}
                                                className="w-12 h-12 rounded-xl p-1 bg-muted/20 border-none cursor-pointer" />
                                            <Input value={configs.marketing?.hero_bar?.bg_color || "#000000"}
                                                onChange={(e) => updateHeroBar('bg_color', e.target.value)}
                                                className="h-12 rounded-xl bg-muted/20 border-none px-4 font-mono text-xs uppercase" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Text Color</Label>
                                        <div className="flex gap-3">
                                            <input type="color" value={configs.marketing?.hero_bar?.text_color || "#ffffff"}
                                                onChange={(e) => updateHeroBar('text_color', e.target.value)}
                                                className="w-12 h-12 rounded-xl p-1 bg-muted/20 border-none cursor-pointer" />
                                            <Input value={configs.marketing?.hero_bar?.text_color || "#ffffff"}
                                                onChange={(e) => updateHeroBar('text_color', e.target.value)}
                                                className="h-12 rounded-xl bg-muted/20 border-none px-4 font-mono text-xs uppercase" />
                                        </div>
                                    </div>
                                </div>
                                {/* Live preview */}
                                {configs.marketing?.hero_bar?.enabled && (
                                    <div className="rounded-2xl overflow-hidden border border-border/20">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-4 py-2 bg-muted/10">Live Preview</div>
                                        <div
                                            className="px-6 py-3 text-center text-xs font-bold"
                                            style={{ backgroundColor: configs.marketing.hero_bar.bg_color, color: configs.marketing.hero_bar.text_color }}
                                        >
                                            {configs.marketing.hero_bar.text || "Banner text preview"}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Custom Social Connections */}
                        <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
                            <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-border/5">
                                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-3xl font-serif italic">Social Connections</CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">Manage dynamic links pointing to your outward domains</CardDescription>
                                </div>
                                <Button
                                    onClick={() => {
                                        const urls = configs.marketing?.custom_social_links || [];
                                        setConfigs((prev: any) => ({
                                            ...prev,
                                            marketing: {
                                                ...prev.marketing,
                                                custom_social_links: [...urls, "https://"]
                                            }
                                        }));
                                    }}
                                    className="rounded-full w-12 h-12 p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="space-y-4">
                                    {(!configs.marketing?.custom_social_links || configs.marketing.custom_social_links.length === 0) ? (
                                        <p className="text-center py-6 text-muted-foreground italic">No custom social links added. Click the + icon to add one.</p>
                                    ) : (
                                        configs.marketing.custom_social_links.map((url: string, index: number) => {
                                            // Extract domain for favicon preview
                                            let hostname = "";
                                            try {
                                                const validUrl = url.startsWith('http') ? url : `https://${url}`;
                                                hostname = new URL(validUrl).hostname;
                                            } catch (e) { }

                                            return (
                                                <div key={index} className="flex items-center gap-4 bg-muted/20 p-2 pl-4 border border-border/10 rounded-2xl">
                                                    {hostname ? (
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                                                            alt={hostname}
                                                            className="w-8 h-8 rounded-full border border-border/5 bg-background object-contain p-1"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Sparkles className="w-4 h-4 text-primary" />
                                                        </div>
                                                    )}

                                                    <Input
                                                        value={url}
                                                        onChange={(e) => {
                                                            const newLinks = [...configs.marketing.custom_social_links];
                                                            newLinks[index] = e.target.value;
                                                            setConfigs((prev: any) => ({
                                                                ...prev,
                                                                marketing: { ...prev.marketing, custom_social_links: newLinks }
                                                            }));
                                                        }}
                                                        placeholder="https://example.com/yourbrand"
                                                        className="flex-1 h-12 bg-transparent border-none px-2 focus-visible:ring-0"
                                                    />

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newLinks = configs.marketing.custom_social_links.filter((_: any, i: number) => i !== index);
                                                            setConfigs((prev: any) => ({
                                                                ...prev,
                                                                marketing: { ...prev.marketing, custom_social_links: newLinks }
                                                            }));
                                                        }}
                                                        className="w-12 h-12 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* EmailJS Configuration (Moved from Marketing) */}
                        <Card className="glass border-border/20 shadow-xl rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 pb-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-3xl font-serif">Email <span className="text-primary italic">Engine</span></CardTitle>
                                </div>
                                <CardDescription className="text-muted-foreground font-light px-1">
                                    Configure your Resend infrastructure for transactional rituals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-10 pt-0 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Resend API Key</Label>
                                    <Input
                                        value={configs.email_config?.public_key}
                                        onChange={(e) => setConfigs({ ...configs, email_config: { ...configs.email_config, public_key: e.target.value } })}
                                        placeholder="re_R7J4..."
                                        type="password"
                                        className="h-14 rounded-[1.5rem] bg-muted/20 border-none px-6"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic px-2">
                                        This key is used for all system emails and broadcasts.
                                    </p>
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-4">
                                    <Button
                                        onClick={handleTestEmailConfig}
                                        variant="outline"
                                        className="h-12 rounded-[1.5rem] border-primary/20 hover:bg-primary/5 text-primary text-xs uppercase tracking-widest font-black"
                                    >
                                        Test Resend Connection
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                <TabsContent value="advanced">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        <Card className="glass border-rose-500/20 shadow-2xl rounded-[3.5rem] overflow-hidden border-2 bg-rose-500/[0.02]">
                            <CardHeader className="p-10 pb-6 flex flex-row items-center gap-6 border-b border-rose-500/10">
                                <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-3xl font-serif italic text-rose-500">Dangerous Waters</CardTitle>
                                    <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">High-privilege actions that cannot be undone</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-6">
                                <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-rose-500/[0.05] border border-rose-500/10">
                                    <div className="space-y-1">
                                        <h4 className="font-serif font-black italic text-xl">Clear All Site Data</h4>
                                        <p className="text-xs text-muted-foreground font-medium max-w-md">
                                            This will permanently dissolve all orders, revenue history, reviews, testimonials, taxes, and marketing subscribers. Products and categories will remain untouched.
                                        </p>
                                    </div>
                                    <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" className="h-14 px-8 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20">
                                                <Trash2 className="w-4 h-4 mr-2" /> Dissolve Data
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="glass border-rose-500/20 rounded-[3rem] p-10 max-w-md backdrop-blur-3xl">
                                            <DialogHeader className="space-y-4">
                                                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                                                    <Key className="w-8 h-8" />
                                                </div>
                                                <DialogTitle className="text-center text-3xl font-serif italic">Authentication Required</DialogTitle>
                                                <DialogDescription className="text-center text-xs font-medium uppercase tracking-widest opacity-60">
                                                    Enter the High Priest's Private Key to authorize this destruction.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="py-8 space-y-4">
                                                <Input
                                                    type="password"
                                                    value={privateKeyInput}
                                                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="h-14 rounded-2xl bg-white/50 border-rose-500/20 text-center text-2xl tracking-[0.5em] font-black focus-visible:ring-rose-500/20"
                                                />
                                            </div>

                                            <DialogFooter className="flex-col sm:flex-col gap-3">
                                                <Button
                                                    onClick={handleClearSiteData}
                                                    disabled={isClearing || !privateKeyInput}
                                                    className="w-full h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all active:scale-95"
                                                >
                                                    {isClearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                                    Confirm Destruction
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowClearDialog(false)}
                                                    className="w-full h-12 rounded-full text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
                                                >
                                                    Retreat
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
