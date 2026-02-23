import { useState } from "react";
import {
    Plus, Search, Edit2, Trash2, MoreVertical,
    Package, RefreshCcw, CheckCircle2, XCircle,
    AlertCircle, ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { productsService } from "@/services/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProducts } from "@/context/ProductsContext";

export default function AdminProducts() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { products, loading, refreshProducts } = useProducts();
    const [searchQuery, setSearchQuery] = useState("");

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
        try {
            await productsService.delete(id);
            toast({ title: "Product Deleted", description: "The product has been removed from the catalog." });
            refreshProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the product." });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-10 h-12 bg-muted/30 border-none rounded-2xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2" onClick={refreshProducts}>
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh List
                    </Button>
                    <Button onClick={() => navigate("/admin/products/new")} className="h-12 rounded-2xl gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5" /> Add New Product
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="bg-card border-none shadow-sm h-64 animate-pulse">
                            <CardContent className="h-full flex items-center justify-center">
                                <Package className="w-10 h-10 text-muted-foreground/20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((p) => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-[2rem] overflow-hidden group border-border/10 shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                            <div className="aspect-[4/3] relative overflow-hidden">
                                <img src={p.image} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
                                <div className="absolute top-4 right-4 z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                            <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${p.id}`)} className="rounded-lg gap-2 cursor-pointer">
                                                <Edit2 className="w-4 h-4" /> Edit Product
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => window.open(`/product/${p.id}`, '_blank')}>
                                                <ExternalLink className="w-4 h-4" /> View Public
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleDelete(p.id)} className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                <Trash2 className="w-4 h-4" /> Delete Product
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {p.category}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                <div>
                                    <h3 className="text-xl font-serif font-bold truncate">{p.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-2xl font-black font-serif">Rs. {p.price}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p.status}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-border/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Stock</span>
                                        <span className={`text-sm font-bold ${p.stock <= 5 ? 'text-red-500' : ''}`}>{p.stock} units</span>
                                    </div>
                                    <Button variant="ghost" className="rounded-full h-8 px-4 text-[10px] uppercase font-black tracking-widest gap-2 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => navigate(`/admin/products/edit/${p.id}`)}>
                                        Details <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
