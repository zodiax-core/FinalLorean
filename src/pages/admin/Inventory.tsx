import { useState, useEffect } from "react";
import {
    Archive, Search, AlertCircle, TrendingUp,
    ArrowUpRight, ArrowDownRight, Package,
    ArrowRight, Filter, Download, Save, RefreshCcw
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { productsService, Product } from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function AdminInventory() {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingIds, setUpdatingIds] = useState<number[]>([]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await productsService.getAll();
            setProducts(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to synchronize inventory." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleUpdateStock = async (id: number, newStock: number) => {
        if (newStock < 0) return;
        setUpdatingIds(prev => [...prev, id]);
        try {
            await productsService.update(id, { stock: newStock });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
            toast({ title: "Stock Updated", description: "The inventory levels have been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Failed to update stock levels." });
        } finally {
            setUpdatingIds(prev => prev.filter(item => item !== id));
        }
    };

    const filteredInventory = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const lowStockCount = products.filter(p => (p.stock || 0) <= (p.min_stock_level || 5)).length;
    const totalItems = products.reduce((acc, p) => acc + (p.stock || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Inventory Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-[2.5rem] border-border/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Archive className="w-16 h-16 group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Total Product Stock</p>
                    <h3 className="text-4xl font-serif font-black">{totalItems} <span className="text-primary italic text-lg ml-2 font-normal">Items</span></h3>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
                        <ArrowUpRight className="w-4 h-4" /> +12% vs Last Cycle
                    </div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-border/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <AlertCircle className="w-16 h-16 group-hover:scale-110 transition-transform duration-1000 text-red-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Low Stock Alerts</p>
                    <h3 className="text-4xl font-serif font-black">{lowStockCount} <span className="text-red-500 italic text-lg ml-2 font-normal">Alerts</span></h3>
                    <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" /> Immediate attention required
                    </div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border-border/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <TrendingUp className="w-16 h-16 group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Inventory Value</p>
                    <h3 className="text-4xl font-serif font-black">Rs. {Math.round(products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0)).toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2 text-primary text-xs font-bold">
                        <Save className="w-4 h-4" /> Premium Catalog Assets
                    </div>
                </div>
            </div>

            {/* Inventory Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by SKU or product name..."
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-14 px-8 rounded-full gap-2 border-2 hover:bg-primary/5">
                        <Filter className="w-4 h-4" /> Category Filter
                    </Button>
                    <Button variant="outline" className="h-14 px-8 rounded-full gap-2 border-2 hover:bg-primary/5">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                    <Button onClick={fetchInventory} className="h-14 w-14 rounded-full p-0 shadow-lg shadow-primary/10">
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="glass rounded-[3rem] border-border/10 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30 border-b border-border/10">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Name</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stock Levels</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredInventory.map((p) => (
                                <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border border-border/10">
                                                <img src={p.image} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <p className="font-serif text-lg font-bold truncate max-w-[200px]">{p.name}</p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">#{p.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {p.category}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-serif font-bold text-xl">Rs. {p.price}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4 bg-muted/20 w-fit px-2 py-1.5 rounded-full border border-border/10 group-hover:bg-background transition-colors">
                                            <button
                                                onClick={() => handleUpdateStock(p.id, (p.stock || 0) - 1)}
                                                className="w-10 h-10 rounded-full hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                                                disabled={updatingIds.includes(p.id)}
                                            >
                                                -
                                            </button>
                                            <span className="w-10 text-center font-serif text-xl font-bold">{p.stock}</span>
                                            <button
                                                onClick={() => handleUpdateStock(p.id, (p.stock || 0) + 1)}
                                                className="w-10 h-10 rounded-full hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                                                disabled={updatingIds.includes(p.id)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {(p.stock || 0) > (p.min_stock_level || 10) ? (
                                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> In Stock
                                            </div>
                                        ) : (p.stock || 0) > 0 ? (
                                            <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Low Stock
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-widest">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Out of Stock
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-12 w-12 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-inner"
                                            onClick={() => window.open(`/product/${p.id}`, '_blank')}
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
