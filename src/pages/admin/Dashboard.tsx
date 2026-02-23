import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid,
    Cell, Legend, Pie, PieChart, ResponsiveContainer,
    Tooltip, XAxis, YAxis
} from "recharts";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowUpRight, ArrowDownRight, Package, AlertTriangle,
    TrendingUp, Users, DollarSign, ShoppingBag, Activity, Loader2,
    CheckCircle2
} from "lucide-react";
import { productsService, ordersService, Product } from "@/services/supabase";

const COLOURS_GOLD = ["#d4af37", "#f3e5ab", "#c5a028", "#8c731b"];
const COLOURS_CS = ["#1a1a1a", "#9ca3af", "#d4af37", "#f3f4f6"];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pData, oData] = await Promise.all([
                    productsService.getAll(),
                    ordersService.getAll()
                ]);
                setProducts(pData);
                setOrders(oData);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRevenue = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const totalOrders = orders.length;
    const lowStockAlerts = products.filter(p => (p.stock || 0) <= (p.min_stock_level || 5));
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Dummy chart data
    const salesData = [
        { name: "Mon", revenue: 4000 },
        { name: "Tue", revenue: 3000 },
        { name: "Wed", revenue: 2000 },
        { name: "Thu", revenue: 2780 },
        { name: "Fri", revenue: 1890 },
        { name: "Sat", revenue: totalRevenue / 10 },
        { name: "Sun", revenue: totalRevenue / 5 },
    ];

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">Rs. {totalRevenue.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground flex items-center mt-2 font-bold uppercase tracking-widest">
                            <span className="text-emerald-500 flex items-center mr-1">
                                +24% <ArrowUpRight className="h-3 w-3" />
                            </span>
                            Actual Revenue
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Orders</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">+{totalOrders}</div>
                        <p className="text-[10px] text-muted-foreground flex items-center mt-2 font-bold uppercase tracking-widest">
                            <span className="text-emerald-500 flex items-center mr-1">
                                Real-time <Activity className="h-3 w-3 ml-1" />
                            </span>
                            Live sync
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Products</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">{products.length}</div>
                        <p className="text-[10px] text-muted-foreground flex items-center mt-2 font-bold uppercase tracking-widest">
                            <span className="text-primary flex items-center mr-1">
                                {products.filter(p => p.tag === 'New').length} New Items
                            </span>
                            This cycle
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass border-border/10 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Order Value</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif font-black">Rs. {Math.round(avgOrderValue)}</div>
                        <p className="text-[10px] text-muted-foreground flex items-center mt-2 font-bold uppercase tracking-widest">
                            <span className="text-emerald-500 flex items-center mr-1">
                                Optimization <TrendingUp className="h-3 w-3 ml-1" />
                            </span>
                            Target: Rs. 40,000
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4 glass border-border/10 shadow-sm rounded-[2.5rem] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">Revenue Overview</CardTitle>
                        <CardDescription>Sales performance over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2 pb-8">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="name" className="text-[10px] font-bold uppercase tracking-widest" axisLine={false} tickLine={false} />
                                    <YAxis className="text-[10px] font-bold" axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '16px', border: '1px solid var(--border)' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={3} fill="url(#colorRevenue)" name="Revenue" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Alerts */}
                <Card className="col-span-3 glass border-border/10 shadow-sm rounded-[2.5rem] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Inventory Alerts
                        </CardTitle>
                        <CardDescription>Low stock notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {lowStockAlerts.length > 0 ? lowStockAlerts.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <img src={item.image} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[150px]">{item.name}</p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">{item.stock} items left</p>
                                        </div>
                                    </div>
                                    <Badge variant={(item.stock || 0) <= 2 ? "destructive" : "secondary"} className="rounded-full text-[8px] font-black uppercase tracking-widest px-3">
                                        {(item.stock || 0) <= 2 ? "Critical" : "Low Stock"}
                                    </Badge>
                                </div>
                            )) : (
                                <div className="py-12 text-center space-y-4">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-20" />
                                    <p className="text-muted-foreground font-serif italic">All stock levels are healthy.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card className="glass border-border/10 shadow-sm rounded-[3rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-serif tracking-tight">Recent Orders</CardTitle>
                        <CardDescription>Live feed of latest transactions</CardDescription>
                    </div>
                    <Button variant="outline" className="rounded-full h-10 px-6 gap-2" onClick={() => navigate('/admin/orders')}>
                        View All <ArrowUpRight className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {orders.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-4 font-black text-xs text-muted-foreground uppercase">{order.short_id || "ORD-" + order.id.toString().slice(0, 8)}</td>
                                        <td className="px-6 py-4 font-bold">{order.full_name}</td>
                                        <td className="px-6 py-4 font-serif font-black text-lg">Rs. {order.total_amount}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
