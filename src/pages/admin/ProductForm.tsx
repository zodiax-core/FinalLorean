import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, Save, Sparkles, Image as ImageIcon,
    List, Tag as TagIcon, Box, Info, Trash2, Plus,
    CheckCircle2, Loader2, Star, HelpCircle, MessageSquare,
    Settings, Layout, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { productsService, categoriesService, Product } from "@/services/supabase";
import { useProducts } from "@/context/ProductsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BADGES = [
    "Best Seller", "New Arrival", "Limited Edition", "Staff Pick", "Customer Favorite", "Organic"
];

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { refreshProducts, categories: contextCategories } = useProducts();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("identity");
    const [categoriesList, setCategoriesList] = useState<string[]>([]);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        price: 0,
        old_price: 0,
        category: "Serums",
        tag: "",
        image: "",
        gallery: [],
        description: "",
        detailed_description: "",
        highlights: [],
        stock: 10,
        sku: "",
        status: "active",
        min_stock_level: 5,
        rating: 5,
        reviews: 0,
        specs: {},
        faqs: [],
        reviews_list: [],
        variants: { sizes: ["30ml", "50ml", "100ml"], colors: [] }
    });

    // Form persistence for new product draft
    useEffect(() => {
        if (!isEditing) {
            const savedData = localStorage.getItem("LRN_PRODUCT_DRAFT");
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setFormData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Draft parsing failed", e);
                }
            }
        }
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing && formData.name) {
            localStorage.setItem("LRN_PRODUCT_DRAFT", JSON.stringify(formData));
        }
    }, [formData, isEditing]);

    useEffect(() => {
        if (contextCategories.length > 0) {
            setCategoriesList(contextCategories.map(c => c.name));
        } else {
            setCategoriesList(["Serums", "Moisturizers", "Cleansers", "Masks", "Eye Care", "Sunscreen"]);
        }
    }, [contextCategories]);

    useEffect(() => {
        if (isEditing) {
            const fetchProduct = async () => {
                try {
                    const data = await productsService.getById(Number(id));
                    setFormData({
                        ...data,
                        gallery: data.gallery || [],
                        faqs: data.faqs || [],
                        reviews_list: data.reviews_list || [],
                        specs: data.specs || {},
                        variants: data.variants || { sizes: ["30ml", "50ml", "100ml"], colors: [] }
                    });
                } catch (error) {
                    toast({ variant: "destructive", title: "Fetch Failed", description: "Could not find the product details." });
                    navigate("/admin/products");
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, isEditing, navigate, toast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                // Sanitize for update
                const { id: _id, created_at: _ca, updated_at: _ua, ...cleanData } = formData;
                await productsService.update(Number(id), cleanData);
                toast({ title: "Product Updated", description: "The product details have been successfully saved." });
            } else {
                // Sanitize for new creation
                const { id: _id, created_at: _ca, updated_at: _ua, ...cleanData } = formData;
                await productsService.create(cleanData as Omit<Product, 'id' | 'created_at' | 'updated_at'>);
                toast({ title: "Product Created", description: "A new product has been successfully added to the catalog." });
            }
            await refreshProducts();
            localStorage.removeItem("LRN_PRODUCT_DRAFT");
            navigate("/admin/products");
        } catch (error: any) {
            console.error("Save error:", error);
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message || "An error occurred while saving the product details."
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Management Helpers
    const addItem = (field: keyof Product, defaultValue: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...((prev[field] as any[]) || []), defaultValue]
        }));
    };

    const removeItem = (field: keyof Product, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: ((prev[field] as any[]) || []).filter((_, i) => i !== index)
        }));
    };

    const updateNestedField = (field: keyof Product, index: number, subfield: string, value: any) => {
        const newList = [...((formData[field] as any[]) || [])];
        newList[index] = { ...newList[index], [subfield]: value };
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-serif italic">Loading product data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/admin/products")}
                        className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Products
                    </Button>
                    <h1 className="text-5xl font-serif tracking-tight">
                        {isEditing ? "Edit" : "Add"} <span className="text-primary italic">Product</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    {isEditing && (
                        <Button
                            variant="ghost"
                            className="h-16 px-6 rounded-full border-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                            onClick={async () => {
                                if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
                                    try {
                                        await productsService.delete(Number(id));
                                        toast({ title: "Product Deleted", description: "The product has been removed from the catalog." });
                                        await refreshProducts();
                                        navigate("/admin/products");
                                    } catch (error) {
                                        toast({ variant: "destructive", title: "Deletion Failed" });
                                    }
                                }
                            }}
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        className="h-16 px-8 rounded-full border-2 border-border/50"
                        onClick={() => navigate("/admin/products")}
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={submitting}
                        className="h-16 px-12 rounded-full text-lg shadow-2xl shadow-primary/20 bg-primary group"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" />}
                        {isEditing ? "Save Changes" : "Create Product"}
                    </Button>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                <div className="flex justify-center">
                    <TabsList className="bg-muted/30 p-1.5 rounded-full h-auto">
                        <TabsTrigger value="identity" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                            Basic Info
                        </TabsTrigger>
                        <TabsTrigger value="visuals" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                            Visuals
                        </TabsTrigger>
                        <TabsTrigger value="narrative" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                            Description
                        </TabsTrigger>
                        <TabsTrigger value="social" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                            Social & FAQ
                        </TabsTrigger>
                        <TabsTrigger value="config" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                            Configuration
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Identity Tab */}
                <TabsContent value="identity" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                                <SectionHeader icon={Box} title="General" subtitle="Information" />
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Product Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Skin Rejuvenation Serum"
                                        className="h-16 rounded-[2rem] bg-muted/20 border-none text-xl font-serif italic px-8"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Price (Rs.)</Label>
                                        <Input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-xl font-serif font-black"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Old Price (Rs.)</Label>
                                        <Input
                                            type="number"
                                            value={formData.old_price}
                                            onChange={(e) => setFormData({ ...formData, old_price: Number(e.target.value) })}
                                            className="h-14 rounded-2xl bg-muted/20 border-none px-6 text-muted-foreground line-through"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="glass p-8 rounded-[3rem] space-y-6 shadow-sm">
                                <SectionHeader icon={TagIcon} title="Categorization" subtitle="Details" />
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Product Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none px-6 text-xs uppercase font-black tracking-widest">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoriesList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            <div className="p-2 border-t border-border/10 mt-2">
                                                {isAddingNewCategory ? (
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            className="h-8 text-[10px] uppercase font-black"
                                                            placeholder="New Category..."
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (newCategoryName) {
                                                                    setCategoriesList(prev => [...prev, newCategoryName]);
                                                                    setFormData(prev => ({ ...prev, category: newCategoryName }));
                                                                    setIsAddingNewCategory(false);
                                                                    setNewCategoryName("");
                                                                }
                                                            }}
                                                        >Add</Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full h-8 text-[8px] font-black uppercase tracking-widest justify-start"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsAddingNewCategory(true);
                                                        }}
                                                    >+ New Category</Button>
                                                )}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Status Badge</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {BADGES.map(b => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, tag: prev.tag === b ? "" : b }))}
                                                className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${formData.tag === b ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-muted/30 text-muted-foreground hover:bg-primary/5"}`}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-12">
                        <Button
                            type="button"
                            onClick={() => setActiveTab("visuals")}
                            className="h-16 px-12 rounded-full text-sm font-black uppercase tracking-[0.2em] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all group border-2 border-primary/20"
                        >
                            Next: Visuals <Sparkles className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
                        </Button>
                    </div>
                </TabsContent>

                {/* Visuals Tab */}
                <TabsContent value="visuals" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={ImageIcon} title="Primary" subtitle="Image" />
                            <div className="aspect-video rounded-[2rem] overflow-hidden bg-muted relative group">
                                {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center opacity-10"><ImageIcon className="w-20 h-20" /></div>}
                            </div>
                            <Input
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                placeholder="https://image-url.jpg"
                                className="h-12 rounded-2xl bg-muted/20 border-none px-6"
                            />
                        </div>
                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={Layout} title="Product" subtitle="Gallery" />
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {(formData.gallery || []).map((url, i) => (
                                    <div key={i} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 animate-in zoom-in-50">
                                            <img src={url} className="w-full h-full object-cover" />
                                        </div>
                                        <Input
                                            value={url}
                                            onChange={(e) => {
                                                const newGallery = [...(formData.gallery || [])];
                                                newGallery[i] = e.target.value;
                                                setFormData({ ...formData, gallery: newGallery });
                                            }}
                                            className="h-12 rounded-xl bg-muted/20 border-none px-4 flex-1"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeItem('gallery', i)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-2xl border-dashed border-2 gap-2"
                                    onClick={() => addItem('gallery', "")}
                                >
                                    <Plus className="w-4 h-4" /> Add Image URL
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-12">
                        <Button
                            type="button"
                            onClick={() => setActiveTab("narrative")}
                            className="h-16 px-12 rounded-full text-sm font-black uppercase tracking-[0.2em] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all group border-2 border-primary/20"
                        >
                            Continue to Description <Info className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </TabsContent>

                {/* Narrative Tab */}
                <TabsContent value="narrative" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                    <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                        <SectionHeader icon={Info} title="Product" subtitle="Narrative" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Short Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[120px] rounded-[2rem] bg-muted/20 border-none p-6 text-sm font-light leading-relaxed resize-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Detailed Description</Label>
                                <Textarea
                                    value={formData.detailed_description}
                                    onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                                    className="min-h-[120px] rounded-[2rem] bg-muted/20 border-none p-6 text-sm font-light leading-relaxed resize-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Product Highlights</Label>
                                <Button variant="ghost" size="sm" onClick={() => addItem('highlights', "")} className="text-primary gap-2"><Plus className="w-4 h-4" /> Add Highlight</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(formData.highlights || []).map((h, i) => (
                                    <div key={i} className="relative group">
                                        <Input
                                            value={h}
                                            onChange={(e) => {
                                                const newH = [...(formData.highlights || [])];
                                                newH[i] = e.target.value;
                                                setFormData({ ...formData, highlights: newH });
                                            }}
                                            className="h-12 pl-12 rounded-2xl bg-muted/30 border-none text-xs"
                                        />
                                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <button onClick={() => removeItem('highlights', i)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-12">
                        <Button
                            type="button"
                            onClick={() => setActiveTab("social")}
                            className="h-16 px-12 rounded-full text-sm font-black uppercase tracking-[0.2em] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all group border-2 border-primary/20"
                        >
                            View Social & FAQ <MessageSquare className="w-4 h-4 ml-3 group-hover:scale-110 transition-transform" />
                        </Button>
                    </div>
                </TabsContent>

                {/* Social & FAQ Tab */}
                <TabsContent value="social" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={HelpCircle} title="Product" subtitle="FAQ" />
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                {(formData.faqs || []).map((faq, i) => (
                                    <div key={i} className="p-6 rounded-[2.5rem] bg-muted/20 border border-border/10 space-y-4 relative group">
                                        <Input
                                            value={faq.q}
                                            onChange={(e) => updateNestedField('faqs', i, 'q', e.target.value)}
                                            placeholder="Question"
                                            className="h-10 rounded-xl bg-background border-none text-xs font-bold"
                                        />
                                        <Textarea
                                            value={faq.a}
                                            onChange={(e) => updateNestedField('faqs', i, 'a', e.target.value)}
                                            placeholder="Answer"
                                            className="min-h-[80px] rounded-xl bg-background border-none text-xs font-light resize-none"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeItem('faqs', i)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full h-8 w-8 shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-dashed border-2 gap-2"
                                    onClick={() => addItem('faqs', { q: "", a: "" })}
                                >
                                    <Plus className="w-4 h-4" /> Add New Question
                                </Button>
                            </div>
                        </div>
                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={MessageSquare} title="Customer" subtitle="Reviews" />
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                {(formData.reviews_list || []).map((rev, i) => (
                                    <div key={i} className="p-6 rounded-[2.5rem] bg-muted/20 border border-border/10 space-y-4 relative group">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                value={rev.author}
                                                onChange={(e) => updateNestedField('reviews_list', i, 'author', e.target.value)}
                                                placeholder="Reviewer Name"
                                                className="h-10 rounded-xl bg-background border-none text-xs font-bold"
                                            />
                                            <Input
                                                type="number"
                                                max="5"
                                                min="1"
                                                value={rev.rating}
                                                onChange={(e) => updateNestedField('reviews_list', i, 'rating', Number(e.target.value))}
                                                className="h-10 rounded-xl bg-background border-none text-xs font-black"
                                            />
                                        </div>
                                        <Textarea
                                            value={rev.comment}
                                            onChange={(e) => updateNestedField('reviews_list', i, 'comment', e.target.value)}
                                            placeholder="Customer Review Comment"
                                            className="min-h-[80px] rounded-xl bg-background border-none text-xs font-light resize-none"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeItem('reviews_list', i)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full h-8 w-8 shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-dashed border-2 gap-2"
                                    onClick={() => addItem('reviews_list', { author: "", rating: 5, comment: "", date: new Date().toISOString() })}
                                >
                                    <Plus className="w-4 h-4" /> Add Review
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-12">
                        <Button
                            type="button"
                            onClick={() => setActiveTab("config")}
                            className="h-16 px-12 rounded-full text-sm font-black uppercase tracking-[0.2em] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all group border-2 border-primary/20"
                        >
                            Finalize Configuration <Settings className="w-4 h-4 ml-3 group-hover:rotate-90 transition-transform duration-500" />
                        </Button>
                    </div>
                </TabsContent>

                {/* Config Tab */}
                <TabsContent value="config" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={Box} title="Inventory" subtitle="Management" />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">SKU</Label>
                                    <Input
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="PROD-SKU-001"
                                        className="h-12 rounded-2xl bg-muted/20 border-none px-6 font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Current Stock</Label>
                                    <Input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        className="h-12 rounded-2xl bg-muted/20 border-border/20 border-2 px-6 font-black text-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Min Level (Alert)</Label>
                                    <Input
                                        type="number"
                                        value={formData.min_stock_level}
                                        onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                                        className="h-12 rounded-2xl bg-muted/20 border-none px-6 font-black text-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Availability Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none px-6 text-xs uppercase font-black tracking-widest">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest mt-2">
                                {(formData.stock || 0) <= (formData.min_stock_level || 5) ? "Low Stock Mode: Activated" : "Stock levels: Stable"}
                            </p>
                        </div>

                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={Settings} title="Public" subtitle="Rating" />
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Global Rating (5.0)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                                        className="h-14 rounded-2xl bg-muted/20 border-none px-6 font-black text-2xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Total Reviews</Label>
                                    <Input
                                        type="number"
                                        value={formData.reviews}
                                        onChange={(e) => setFormData({ ...formData, reviews: Number(e.target.value) })}
                                        className="h-14 rounded-2xl bg-muted/20 border-none px-6 font-black text-2xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass p-10 rounded-[3rem] space-y-8 shadow-sm">
                            <SectionHeader icon={Info} title="Variations" subtitle="Specs" />
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Sizes</Label>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const newSizes = [...(formData.variants?.sizes || [])];
                                        newSizes.push("");
                                        setFormData({ ...formData, variants: { ...formData.variants, sizes: newSizes } });
                                    }} className="text-primary gap-2"><Plus className="w-4 h-4" /> Add Size</Button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {(formData.variants?.sizes || []).map((size: string, i: number) => (
                                        <div key={i} className="flex gap-2 items-center bg-muted/20 p-2 rounded-xl">
                                            <Input
                                                value={size}
                                                onChange={(e) => {
                                                    const newSizes = [...(formData.variants?.sizes || [])];
                                                    newSizes[i] = e.target.value;
                                                    setFormData({ ...formData, variants: { ...formData.variants, sizes: newSizes } });
                                                }}
                                                className="w-20 h-8 text-[10px] font-bold border-none bg-background px-2"
                                            />
                                            <button onClick={() => {
                                                const newSizes = (formData.variants?.sizes || []).filter((_: any, idx: number) => idx !== i);
                                                setFormData({ ...formData, variants: { ...formData.variants, sizes: newSizes } });
                                            }} className="text-destructive"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between border-t border-border/10 pt-6">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Product Specs</Label>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setFormData({ ...formData, specs: { ...formData.specs, "New Key": "Value" } });
                                    }} className="text-primary gap-2"><Plus className="w-4 h-4" /> Add Spec</Button>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(formData.specs || {}).map(([key, val], i) => (
                                        <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2">
                                            <Input
                                                value={key}
                                                onChange={(e) => {
                                                    const newSpecs = { ...formData.specs };
                                                    const newVal = newSpecs[key];
                                                    delete newSpecs[key];
                                                    newSpecs[e.target.value] = newVal;
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }}
                                                className="h-10 rounded-xl bg-muted/30 border-none text-[10px] font-bold flex-1"
                                            />
                                            <Input
                                                value={val as string}
                                                onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, [key]: e.target.value } })}
                                                className="h-10 rounded-xl bg-muted/30 border-none text-[10px] flex-1"
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                const newSpecs = { ...formData.specs };
                                                delete newSpecs[key];
                                                setFormData({ ...formData, specs: newSpecs });
                                            }} className="text-destructive"><X className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mt-16 pb-12">
                        <Button
                            onClick={handleSave}
                            disabled={submitting}
                            className="h-20 px-20 rounded-full text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 bg-primary hover:scale-105 active:scale-95 transition-all group"
                        >
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-4" /> : <Save className="w-6 h-6 mr-4 group-hover:-translate-y-1 transition-transform" />}
                            {isEditing ? "Save Product Settings" : "Complete Product Creation"}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
    <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
            <h3 className="text-sm font-black uppercase tracking-widest leading-none">{title}</h3>
            <span className="text-2xl font-serif italic text-primary">{subtitle}</span>
        </div>
    </div>
);
