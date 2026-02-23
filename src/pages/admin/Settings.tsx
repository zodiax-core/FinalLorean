import { useState, useEffect } from "react";
import {
    Store, Users, ShoppingCart, Truck, Receipt, Bell, Shield,
    Settings as SettingsIcon, Save, Loader2, Globe, Clock,
    Mail, Phone, CreditCard, Lock, Activity, Eye, EyeOff,
    CheckCircle2, AlertTriangle, Sparkles, Layout, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { settingsService } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [configs, setConfigs] = useState<any>({
        general: {},
        orders: {},
        notifications: {},
        security: {},
        system: {},
        tax: {},
        shipping: {}
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getAllConfigs();
            setConfigs(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Settings fetch error:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load store settings." });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async (category: string) => {
        setSubmitting(true);
        try {
            await settingsService.updateConfig(category, configs[category]);
            if (user) {
                await settingsService.createAdminLog(user.id, `Updated ${category} settings`, { category });
            }
            toast({ title: "Settings Saved", description: `The ${category} settings have been updated.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Failed to save settings." });
        } finally {
            setSubmitting(false);
        }
    };

    const updateField = (category: string, field: string, value: any) => {
        setConfigs(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-5xl font-serif tracking-tight">Store <span className="text-primary italic">Settings</span></h1>
                    <p className="text-muted-foreground font-light">Manage your store configuration and preferences.</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-1">
                    <TabsList className="flex flex-col h-auto bg-transparent border-none space-y-2 p-0">
                        <SettingTabTrigger value="general" icon={Store} label="Store Identity" />
                        <SettingTabTrigger value="roles" icon={Users} label="Users & Roles" />
                        <SettingTabTrigger value="orders" icon={ShoppingCart} label="Orders" />
                        <SettingTabTrigger value="shipping" icon={Truck} label="Shipping" />
                        <SettingTabTrigger value="tax" icon={Receipt} label="Tax Settings" />
                        <SettingTabTrigger value="notifications" icon={Bell} label="Notifications" />
                        <SettingTabTrigger value="security" icon={Shield} label="Security" />
                        <SettingTabTrigger value="system" icon={SettingsIcon} label="System" />
                    </TabsList>
                </div>

                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <TabsContent value="general" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Store Identity"
                                    description="Core store details and branding"
                                    icon={Store}
                                    onSave={() => handleSaveCategory('general')}
                                    submitting={submitting}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Store Name</Label>
                                            <Input
                                                value={configs.general.name}
                                                onChange={(e) => updateField('general', 'name', e.target.value)}
                                                className="h-12 rounded-[1.5rem] bg-muted/20 border-none font-serif italic px-6"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Currency</Label>
                                            <Select value={configs.general.currency} onValueChange={(v) => updateField('general', 'currency', v)}>
                                                <SelectTrigger className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD - Dollar</SelectItem>
                                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                    <SelectItem value="GBP">GBP - Pound</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Timezone</Label>
                                            <Select value={configs.general.timezone} onValueChange={(v) => updateField('general', 'timezone', v)}>
                                                <SelectTrigger className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC - Universal Time</SelectItem>
                                                    <SelectItem value="EST">EST - Eastern Time</SelectItem>
                                                    <SelectItem value="PST">PST - Pacific Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                                            <Input
                                                value={configs.general.email}
                                                onChange={(e) => updateField('general', 'email', e.target.value)}
                                                className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6 pt-6">
                                        <SectionHeader small title="Media" subtitle="Branding" icon={Layout} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Logo URL</Label>
                                                <Input
                                                    value={configs.general.logo}
                                                    onChange={(e) => updateField('general', 'logo', e.target.value)}
                                                    className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Favicon URL</Label>
                                                <Input
                                                    value={configs.general.favicon}
                                                    onChange={(e) => updateField('general', 'favicon', e.target.value)}
                                                    className="h-12 rounded-[1.5rem] bg-muted/20 border-none px-6"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="roles" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Users & Roles"
                                    description="Access control and admin permissions"
                                    icon={Users}
                                    onSave={() => handleSaveCategory('roles')}
                                    submitting={submitting}
                                >
                                    <div className="space-y-8">
                                        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                                    <Lock className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-serif font-black italic">Vendor Management</h4>
                                                    <p className="text-xs text-muted-foreground">Allow vendors to manage their own products</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={configs.roles?.vendor_autonomy}
                                                onCheckedChange={(v) => updateField('roles', 'vendor_autonomy', v)}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <SectionHeader small title="Permissions" subtitle="Default Access" icon={Shield} />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {['Super Admin', 'Admin', 'Vendor'].map(role => (
                                                    <div key={role} className="glass p-6 rounded-3xl border-border/10 space-y-4">
                                                        <h5 className="font-serif font-bold text-sm tracking-tight">{role}</h5>
                                                        <div className="space-y-2">
                                                            {['View', 'Edit', 'Delete'].map(p => (
                                                                <div key={p} className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground">{p}</span>
                                                                    <Switch defaultChecked />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="orders" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Orders"
                                    description="Automated order lifecycle rules"
                                    icon={ShoppingCart}
                                    onSave={() => handleSaveCategory('orders')}
                                    submitting={submitting}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Initial Status</Label>
                                            <Select value={configs.orders.default_status} onValueChange={(v) => updateField('orders', 'default_status', v)}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-emerald-500 font-black uppercase tracking-widest text-[10px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="processing">Processing</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Cancellation Window</Label>
                                            <Select value={configs.orders.cancellation_window} onValueChange={(v) => updateField('orders', 'cancellation_window', v)}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-6 font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 Hour</SelectItem>
                                                    <SelectItem value="24">24 Hours</SelectItem>
                                                    <SelectItem value="48">48 Hours</SelectItem>
                                                    <SelectItem value="0">Never (Immutable)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="lg:col-span-2 space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Manual Payment Rules</Label>
                                            <Textarea
                                                value={configs.orders.manual_payment_rules}
                                                onChange={(e) => updateField('orders', 'manual_payment_rules', e.target.value)}
                                                placeholder="Instructions for bank transfer or manual order processing..."
                                                className="min-h-[120px] rounded-[2rem] bg-muted/20 border-none p-6 text-sm font-light leading-relaxed resize-none"
                                            />
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="shipping" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Shipping"
                                    description="Logistics parameters across regions"
                                    icon={Truck}
                                    onSave={() => handleSaveCategory('shipping')}
                                    submitting={submitting}
                                >
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Flat Rate Fee ($)</Label>
                                                <Input
                                                    type="number"
                                                    value={configs.shipping.flat_rate}
                                                    onChange={(e) => updateField('shipping', 'flat_rate', Number(e.target.value))}
                                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-2xl font-black font-serif italic"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Free Shipping Threshold ($)</Label>
                                                <Input
                                                    type="number"
                                                    value={configs.shipping.free_threshold}
                                                    onChange={(e) => updateField('shipping', 'free_threshold', Number(e.target.value))}
                                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-2xl font-black font-serif italic"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-4">
                                            <SectionHeader small title="Logistic" subtitle="Zones" icon={Globe} />
                                            <div className="space-y-4">
                                                {(configs.shipping.zones || ['North America', 'Europe', 'Asia']).map(zone => (
                                                    <div key={zone} className="flex items-center justify-between p-6 rounded-[2rem] glass border-border/10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Globe className="w-5 h-5 text-primary" />
                                                            </div>
                                                            <span className="font-serif italic text-lg">{zone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <Badge variant="outline" className="rounded-full px-4 py-1 text-[8px] font-black uppercase">Active</Badge>
                                                            <Button variant="ghost" size="sm">Modify</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button variant="outline" className="w-full h-14 rounded-[2rem] border-dashed border-2 gap-2">
                                                    Add New Zone
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="tax" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Tax Settings"
                                    description="Configure tax rules"
                                    icon={Receipt}
                                    onSave={() => handleSaveCategory('tax')}
                                    submitting={submitting}
                                >
                                    <div className="space-y-8">
                                        <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <Receipt className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-serif font-black italic">Global Tax</h4>
                                                    <p className="text-sm text-muted-foreground font-light">Calculate taxes across all orders</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={configs.tax.global_enabled}
                                                onCheckedChange={(v) => updateField('tax', 'global_enabled', v)}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Default Tax Rules</Label>
                                            <Textarea
                                                value={configs.tax.default_rules}
                                                onChange={(e) => updateField('tax', 'default_rules', e.target.value)}
                                                className="min-h-[150px] rounded-[3rem] bg-muted/20 border-none p-8 font-light leading-relaxed"
                                                placeholder="Explain the default tax calculation for regions without specific rules..."
                                            />
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Notifications"
                                    description="Communication vectors for admins and customers"
                                    icon={Bell}
                                    onSave={() => handleSaveCategory('notifications')}
                                    submitting={submitting}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <NotificationToggle
                                            icon={Bell}
                                            title="Push Notifications"
                                            description="Real-time browser alerts"
                                            active={configs.notifications.alerts}
                                            onToggle={(v) => updateField('notifications', 'alerts', v)}
                                        />
                                        <NotificationToggle
                                            icon={Mail}
                                            title="Transactional Emails"
                                            description="Correspondence via email"
                                            active={configs.notifications.email}
                                            onToggle={(v) => updateField('notifications', 'email', v)}
                                        />
                                        <NotificationToggle
                                            icon={Layout}
                                            title="Desktop Notifications"
                                            description="In-app notifications"
                                            active={configs.notifications.dashboard}
                                            onToggle={(v) => updateField('notifications', 'dashboard', v)}
                                        />
                                        <NotificationToggle
                                            icon={Phone}
                                            title="SMS Notifications"
                                            description="Direct text messages"
                                            active={configs.notifications.sms}
                                            onToggle={(v) => updateField('notifications', 'sms', v)}
                                        />
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="security" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="Security"
                                    description="Protect your store and manage sessions"
                                    icon={Shield}
                                    onSave={() => handleSaveCategory('security')}
                                    submitting={submitting}
                                >
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Minimum Password Length</Label>
                                                <Input
                                                    type="number"
                                                    value={configs.security.password_min_length || 12}
                                                    onChange={(e) => updateField('security', 'password_min_length', Number(e.target.value))}
                                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-xl font-black"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Session Duration (Minutes)</Label>
                                                <Input
                                                    type="number"
                                                    value={configs.security.session_timeout || 60}
                                                    onChange={(e) => updateField('security', 'session_timeout', Number(e.target.value))}
                                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-xl font-black"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-6 border-t border-border/10">
                                            <SectionHeader small title="System" subtitle="Logs" icon={Activity} />
                                            <div className="glass rounded-[2rem] overflow-hidden">
                                                <div className="p-8 border-b border-border/10 bg-muted/10 flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Activity Stream</span>
                                                    <Button variant="ghost" size="sm" className="text-primary h-8 px-4 rounded-full bg-primary/5">View Full History</Button>
                                                </div>
                                                <div className="divide-y divide-border/5">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="p-6 flex items-center justify-between group hover:bg-muted/5 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                                                                    <Database className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold">Settings Updated</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">Updated General Settings • {i * 2}h ago</p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className="text-[8px] font-black tracking-tighter uppercase rounded-full">192.168.0.{i}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="system" className="mt-0 focus-visible:ring-0">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <SettingsCard
                                    title="System"
                                    description="Core parameters and feature toggles"
                                    icon={SettingsIcon}
                                    onSave={() => handleSaveCategory('system')}
                                    submitting={submitting}
                                >
                                    <div className="space-y-10">
                                        <div className="p-8 rounded-[3rem] bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                    <AlertTriangle className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-serif font-black italic">Maintenance Mode</h4>
                                                    <p className="text-sm text-muted-foreground font-light">Suspend visitors and checkout</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={configs.system.maintenance_mode}
                                                onCheckedChange={(v) => updateField('system', 'maintenance_mode', v)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">API Rate Limits</Label>
                                                <Input
                                                    type="number"
                                                    value={configs.system.api_limits}
                                                    onChange={(e) => updateField('system', 'api_limits', Number(e.target.value))}
                                                    className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-xl font-black"
                                                />
                                            </div>
                                            <div className="space-y-6">
                                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Feature Toggles</Label>
                                                <div className="space-y-4">
                                                    {['Blog Content', 'Product Reviews', 'Vendor Portal'].map(f => (
                                                        <div key={f} className="flex items-center justify-between">
                                                            <span className="text-xs font-bold font-serif italic">{f}</span>
                                                            <Switch defaultChecked />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 flex flex-col items-center gap-6 border-t border-border/10 opacity-30">
                                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center">Version 4.2.0-ADMIN</p>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </motion.div>
                        </TabsContent>
                    </AnimatePresence>
                </div>
            </Tabs>
        </div>
    );
}

const SettingTabTrigger = ({ value, icon: Icon, label }: { value: string, icon: any, label: string }) => (
    <TabsTrigger
        value={value}
        className="w-full justify-start gap-4 px-6 py-4 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl shadow-primary/20 group transition-all duration-500 border border-transparent hover:border-primary/10"
    >
        <Icon className="w-5 h-5 group-data-[state=active]:scale-110 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </TabsTrigger>
);

const SettingsCard = ({ title, description, icon: Icon, children, onSave, submitting }: any) => (
    <Card className="glass border-border/10 shadow-2xl rounded-[3.5rem] overflow-hidden border-2">
        <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between border-b border-border/5 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                </div>
                <div>
                    <CardTitle className="text-3xl font-serif italic tracking-tight">{title}</CardTitle>
                    <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-50">{description}</CardDescription>
                </div>
            </div>
            <Button
                onClick={onSave}
                disabled={submitting}
                className="h-14 px-10 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary group hover:bg-primary/90 transition-all duration-300"
            >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3 group-hover:-translate-y-1 transition-transform" />}
                Save Settings
            </Button>
        </CardHeader>
        <CardContent className="p-10 pt-12 space-y-10">
            {children}
        </CardContent>
    </Card>
);

const SectionHeader = ({ icon: Icon, title, subtitle, small }: any) => (
    <div className="flex items-center gap-4 mb-4">
        <div className={`${small ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl'} bg-primary/10 flex items-center justify-center text-primary`}>
            <Icon className={`${small ? 'w-5 h-5' : 'w-6 h-6'}`} />
        </div>
        <div>
            <h3 className={`${small ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-widest leading-none text-muted-foreground/60`}>{title}</h3>
            <span className={`${small ? 'text-xl' : 'text-2xl'} font-serif italic text-primary`}>{subtitle}</span>
        </div>
    </div>
);

const NotificationToggle = ({ icon: Icon, title, description, active, onToggle }: any) => (
    <div className="p-6 rounded-3xl glass border border-border/10 flex items-center justify-between group hover:border-primary/20 transition-all">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-primary/20 text-primary shadow-inner' : 'bg-muted/50 text-muted-foreground'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h5 className="font-serif font-bold italic">{title}</h5>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{description}</p>
            </div>
        </div>
        <Switch checked={active} onCheckedChange={onToggle} />
    </div>
);

const Badge = ({ children, variant, className }: any) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-border' : 'bg-primary/10 text-primary'} ${className}`}>
        {children}
    </span>
);
