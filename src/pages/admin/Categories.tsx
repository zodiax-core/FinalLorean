import { useState, useEffect } from "react";
import {
    Plus, Search, Edit2, Trash2,
    List, RefreshCcw, Tag, Box,
    ChevronRight, ExternalLink, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { categoriesService, productsService } from "@/services/supabase";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Category {
    id: number;
    name: string;
    product_count: number;
    created_at: string;
}

export default function AdminCategories() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Get product counts for each category from products table
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('category');

            if (productError) throw productError;

            const counts: Record<string, number> = {};
            productData?.forEach(p => {
                counts[p.category] = (counts[p.category] || 0) + 1;
            });

            // Try to get all categories from the categories table
            let dbCategories;
            try {
                dbCategories = await categoriesService.getAll();
            } catch (err: any) {
                console.warn("Categories table issue, falling back to unique product categories.");
                // Create virtual categories from existing products
                const uniqueNames = Array.from(new Set(productData?.map(p => p.category) || []));
                dbCategories = uniqueNames.map((name, i) => ({
                    id: -(i + 1), // Negative IDs to indicate virtual status
                    name,
                    created_at: new Date().toISOString()
                }));

                toast({
                    variant: "default",
                    title: "System Synchronization",
                    description: "Categories table missing or unavailable. Using product-derived categories.",
                });
            }

            const categoryList: Category[] = dbCategories.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                product_count: counts[cat.name] || 0,
                created_at: cat.created_at
            }));

            setCategories(categoryList);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load product categories." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async () => {
        if (!categoryName.trim()) return;
        setIsSubmitting(true);

        try {
            if (editingCategory) {
                // 1. Update the category name in the categories table
                await categoriesService.update(editingCategory.id, { name: categoryName });

                // 2. Update all products with the old category name to the new one
                const { error } = await supabase
                    .from('products')
                    .update({ category: categoryName })
                    .eq('category', editingCategory.name);

                if (error) throw error;
                toast({ title: "Category Updated", description: "Category name and associated products updated." });
            } else {
                // Create new category in DB
                await categoriesService.create({ name: categoryName });
                toast({ title: "Category Created", description: "The new category is now available for use." });
            }
            setIsDialogOpen(false);
            setEditingCategory(null);
            setCategoryName("");
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save category. It may already exist." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (category: Category) => {
        if (!confirm(`Are you sure you want to delete the "${category.name}" category? Associated products will be marked as Uncategorized.`)) return;

        try {
            // 1. Delete from categories table
            await categoriesService.delete(category.id);

            // 2. Update products
            const { error } = await supabase
                .from('products')
                .update({ category: "Uncategorized" })
                .eq('category', category.name);

            if (error) throw error;
            toast({ title: "Category Deleted", description: "Associated products are now Uncategorized." });
            fetchCategories();
        } catch (error) {
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not remove the category." });
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isVirtual = categories.some(c => c.id < 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif italic">Product <span className="text-primary not-italic font-black uppercase tracking-tighter">Categories</span></h1>
                    <p className="text-muted-foreground font-light text-sm mt-1 uppercase tracking-widest">Inventory Organization System</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl gap-2 border-2 border-primary/20 hover:bg-primary/5" onClick={fetchCategories}>
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Categories
                    </Button>
                    <Button
                        onClick={() => { setEditingCategory(null); setCategoryName(""); setIsDialogOpen(true); }}
                        className="h-12 rounded-2xl gap-2 shadow-xl shadow-primary/20 bg-primary"
                        disabled={isVirtual}
                    >
                        <Plus className="w-5 h-5" /> New Category
                    </Button>
                </div>
            </header>

            {isVirtual && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-amber-200"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold">Database Sync Required</h3>
                            <p className="text-sm opacity-80">The categories table is missing from your database. Management features are currently locked.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search categories..."
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground font-serif italic">Loading product categories...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredCategories.map((category) => (
                            <motion.div
                                key={category.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass rounded-[2.5rem] p-8 border-border/10 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                            >
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Tag className="w-7 h-7" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-lg" onClick={() => { setEditingCategory(category); setCategoryName(category.name); setIsDialogOpen(true); }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-lg text-destructive" onClick={() => handleDelete(category)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold tracking-tight">{category.name}</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">Product Category</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/5">
                                        <div className="flex items-center gap-2">
                                            <Box className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-bold">{category.product_count} <span className="text-muted-foreground font-light">Products</span></span>
                                        </div>
                                        <Button variant="ghost" className="rounded-full h-8 px-4 text-[10px] uppercase font-black tracking-widest gap-2 hover:bg-primary/10 hover:text-primary">
                                            Manage <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md rounded-[3rem] p-10">
                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                            <Tag className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-3xl font-serif text-center">
                            {editingCategory ? "Edit" : "New"} <span className="text-primary italic">Category</span>
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground font-light">
                            {editingCategory ? "Update category name and all linked products." : "Create a new classification for your inventory."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Category Name</Label>
                            <Input
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="e.g. Skin Care"
                                className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-lg font-serif italic"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full h-14 rounded-full bg-primary text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 group"
                            onClick={handleSave}
                            disabled={isSubmitting || !categoryName.trim()}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {editingCategory ? "Update Category" : "Create Category"}
                                    <Plus className="ml-3 w-4 h-4 group-hover:rotate-90 transition-transform" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
