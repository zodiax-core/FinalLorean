import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, Heart, ShoppingBag, ArrowLeft, Minus, Plus, Share2,
    ShieldCheck, Truck, RotateCcw, CheckCircle2, Facebook,
    Twitter, Instagram, ChevronRight, MessageSquare, Info,
    Package, Sparkles, Clock, CreditCard, Loader2, HelpCircle,
    Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Product, reviewsService, productsService } from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";

const RecentlyViewedProducts = ({ currentId, products }: { currentId: number, products: Product[] }) => {
    const viewed = useMemo(() => {
        try {
            const ids = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
            const filteredIds = ids.filter((id: any) => Number(id) !== currentId);
            return products.filter(p => filteredIds.includes(p.id)).slice(0, 4);
        } catch (e) {
            return [];
        }
    }, [currentId, products]);

    if (viewed.length === 0) return null;

    return (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <h2 className="text-2xl sm:text-4xl font-serif mb-6 sm:mb-12">Your <span className="text-primary italic">Stalker List</span> </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                {viewed.map(p => (
                    <Link to={`/product/${p.id}`} key={p.id} className="group glass p-2 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-2xl transition-all border-border/30">
                        <div className="aspect-[4/5] rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden bg-muted mb-2 sm:mb-4 relative">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                            <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors" />
                        </div>
                        <h4 className="font-medium text-[10px] sm:text-sm mb-0.5 sm:mb-1 line-clamp-1 px-1">{p.name}</h4>
                        <p className="text-primary font-bold tracking-tight text-xs sm:text-base px-1">Rs. {p.price}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { products, loading, getProductById } = useProducts();
    const { addToCart } = useCart();
    const { addToWishlist, isInWishlist } = useWishlist();

    const productId = useMemo(() => {
        const num = Number(id);
        return isNaN(num) ? null : num;
    }, [id]);

    const contextProduct = useMemo(() => productId ? getProductById(productId) : null, [productId, products]);
    const [directProduct, setDirectProduct] = useState<Product | null>(null);
    const [directLoading, setDirectLoading] = useState(false);

    // Fallback: fetch directly from Supabase if not found in context
    useEffect(() => {
        if (!loading && !contextProduct && productId) {
            setDirectLoading(true);
            productsService.getById(productId).then(data => {
                setDirectProduct(data);
            }).catch(err => {
                console.error("Direct fetch failed:", err);
            }).finally(() => {
                setDirectLoading(false);
            });
        }
    }, [loading, contextProduct, productId]);

    const product = contextProduct || directProduct;
    // Show loading if we are still fetching from context OR if we've decided to fetch direct but haven't finished
    const isActuallyLoading = loading || (directLoading && !product);

    const [activeImage, setActiveImage] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState("");
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [realReviews, setRealReviews] = useState<any[]>([]);
    const [fetchingReviews, setFetchingReviews] = useState(false);
    const buySectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (product) {
            const fetchReviews = async () => {
                setFetchingReviews(true);
                try {
                    const data = await reviewsService.getByProductId(product.id);
                    setRealReviews(data);
                } catch (error) {
                    console.error("Reviews fetch error:", error);
                } finally {
                    setFetchingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [product]);

    const gallery = useMemo(() => {
        if (!product) return [];
        const imgs = [product.image];
        if (product.gallery && Array.isArray(product.gallery)) {
            imgs.push(...product.gallery.filter(img => img && img !== product.image));
        }
        return imgs;
    }, [product]);

    useEffect(() => {
        if (product) {
            setActiveImage(product.image);
            if (product.variants?.sizes?.length) setSelectedSize(product.variants.sizes[0]);
            window.scrollTo({ top: 0, behavior: "smooth" });

            try {
                const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
                if (!recentlyViewed.includes(product.id)) {
                    const updated = [product.id, ...recentlyViewed].filter(id => id !== null).slice(0, 10);
                    localStorage.setItem("recentlyViewed", JSON.stringify(updated));
                }
            } catch (e) {
                console.error("Storage error", e);
            }
        }
    }, [product]);

    useEffect(() => {
        const handleScroll = () => {
            if (buySectionRef.current) {
                const rect = buySectionRef.current.getBoundingClientRect();
                setShowStickyBar(rect.bottom < 0);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        toast({ title: "Link Ritualized", description: "Product essence link copied to clipboard." });
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isActuallyLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-serif text-lg animate-pulse">Establishing botanical connection...</p>
            </div>
        );
    }

    if (!isActuallyLoading && !product) {
        return (
            <div className="min-h-screen bg-background text-center py-40">
                <Navbar />
                <h2 className="text-4xl font-serif mb-6 uppercase tracking-tighter">Manifestation <span className="text-primary">Failed</span></h2>
                <p className="text-muted-foreground mb-8">The botanical essence you seek has dissolved into the ether.</p>
                <Button onClick={() => navigate('/shop')} className="rounded-full px-12 h-14 bg-primary">Back to Collection</Button>
                <Footer />
            </div>
        );
    }

    const price = Number(product.price) || 0;
    const oldPrice = Number(product.old_price) || 0;
    const discountPercentage = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title={product.name}
                description={product.description}
                image={product.image}
            />
            <Navbar />

            {/* Sticky Buy Bar */}
            <AnimatePresence>
                {showStickyBar && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-xl border-t border-border/50 p-3 md:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-12"
                    >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <img src={product.image} className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover shadow-lg" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="font-serif text-sm md:text-lg font-medium truncate">{product.name}</p>
                                <p className="text-primary font-bold text-sm md:text-base">Rs. {product.price}</p>
                            </div>
                            <div className="flex items-center gap-2 sm:hidden">
                                <Button
                                    onClick={() => addToWishlist(product)}
                                    size="icon"
                                    variant="outline"
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${isInWishlist(product.id) ? "bg-rose-50 border-rose-100 text-rose-500" : "border-border"}`}
                                >
                                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`} />
                                </Button>
                                <Button onClick={() => addToCart(product, quantity)} size="sm" className="rounded-full px-6 h-10 bg-primary font-black uppercase tracking-widest text-[10px]">Add</Button>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-4">
                            <div className="flex items-center border border-border/50 rounded-full p-1 bg-muted/50 h-10">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all"><Minus className="w-3 h-3" /></button>
                                <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all"><Plus className="w-3 h-3" /></button>
                            </div>
                            <Button onClick={() => addToCart(product, quantity)} className="rounded-full px-8 h-12 shadow-lg shadow-primary/20 bg-primary font-black uppercase tracking-widest text-xs">Manifest Into Bag</Button>
                            <Button
                                onClick={() => addToWishlist(product)}
                                size="icon"
                                variant="outline"
                                className={`w-12 h-12 rounded-full border-2 transition-all ${isInWishlist(product.id) ? "bg-rose-50 border-rose-100 text-rose-500 shadow-lg" : "border-border hover:border-rose-100 hover:text-rose-500"}`}
                            >
                                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-12">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link to="/shop" className="hover:text-primary transition-colors">Collection</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-primary font-black truncate max-w-[150px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-32 mb-32">
                    {/* Left: Interactive Gallery */}
                    <div className="space-y-8">
                        <motion.div
                            layoutId={`product-image-${product.id}`}
                            className="aspect-[4/5] rounded-[3.5rem] overflow-hidden bg-muted group relative shadow-2xl border border-border/10 cursor-crosshair"
                        >
                            <motion.img
                                key={activeImage}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={activeImage}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                            />
                            <div className="absolute top-8 left-8 flex flex-col gap-3">
                                {product.tag && <Badge className="bg-primary/90 backdrop-blur-md text-primary-foreground px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{product.tag}</Badge>}
                                {discountPercentage > 0 && <Badge variant="destructive" className="px-5 py-2 rounded-full text-[10px] font-black tracking-widest">-{discountPercentage}% Off</Badge>}
                            </div>
                            <Button
                                size="icon"
                                onClick={handleShare}
                                className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white hover:text-primary shadow-xl"
                            >
                                {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                            </Button>
                        </motion.div>

                        {gallery.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {gallery.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(img)}
                                        className={`w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all duration-500 ${activeImage === img ? "border-primary shadow-lg scale-105" : "border-transparent opacity-50 hover:opacity-100"}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Premium Synthesis */}
                    <div className="flex flex-col h-full" ref={buySectionRef}>
                        <div className="flex-1 space-y-10">
                            <div className="flex items-center justify-between">
                                <span className="text-primary font-black tracking-[0.3em] uppercase text-[10px] bg-primary/5 px-6 py-2 rounded-full border border-primary/10">{product.category}</span>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/10">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-foreground">{product.rating} <span className="text-muted-foreground/60">({product.reviews})</span></span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight tracking-tighter uppercase animate-in slide-in-from-left-8 duration-1000">
                                    {product.name}
                                </h1>

                                <p className="text-muted-foreground text-lg leading-relaxed font-light text-balance max-w-xl">
                                    {product.description}
                                </p>

                                {product.stock !== undefined && product.stock <= (product.min_stock_level || 5) && (
                                    <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                            {product.stock === 0 ? "Out of Stock" : `Botanical Shortage: Only ${product.stock} vessels Left`}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-end gap-4 pb-6">
                                    <span className="text-4xl font-bold font-serif text-primary tracking-tighter">Rs. {product.price}</span>
                                    {oldPrice > 0 && <span className="text-xl text-muted-foreground line-through mb-1.5 font-light tracking-tighter">Rs. {oldPrice}</span>}
                                </div>
                            </div>

                            {/* Scan Highlights */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(product.highlights || []).slice(0, 4).map((h: string) => (
                                    <div key={h} className="flex items-center gap-4 bg-muted/20 p-5 rounded-[2rem] border border-border/10 group hover:border-primary/30 transition-all">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">{h}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Options Synthesis */}
                            <div className="space-y-8 mt-4">
                                {product.variants?.sizes?.length > 0 && (
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vessel Volume</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {product.variants.sizes.map((size: string) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-6 md:px-10 py-3 md:py-5 rounded-[1.5rem] md:rounded-[2rem] border-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-500 ${selectedSize === size ? "bg-primary border-primary text-white shadow-xl scale-105" : "border-border hover:border-primary/20 text-muted-foreground"}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex items-center gap-2 sm:gap-4 h-14">
                                    {/* All-in-one row for both mobile and desktop */}
                                    <div className="flex items-center border-2 border-border/20 rounded-full p-0.5 sm:p-1 bg-muted/10 h-full shrink-0">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all duration-300"><Minus className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                                        <span className="w-8 sm:w-10 text-center font-black text-base sm:text-lg font-serif italic">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all duration-300"><Plus className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                                    </div>
                                    <Button
                                        onClick={() => addToCart(product, quantity)}
                                        className="flex-1 h-full rounded-full text-[9px] sm:text-sm font-black uppercase tracking-widest sm:tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary group hover:bg-primary/90 transition-all duration-500 min-w-0"
                                    >
                                        <span className="truncate">Manifest Into Bag</span>
                                        <ShoppingBag className="hidden sm:block ml-3 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                    </Button>
                                    <Button
                                        onClick={() => addToWishlist(product)}
                                        variant="outline"
                                        className={`h-full w-14 rounded-full border-2 transition-all duration-500 shrink-0 flex items-center justify-center ${isInWishlist(product.id) ? "bg-rose-50 border-rose-100 text-rose-500 shadow-lg" : "border-border hover:border-rose-100 hover:text-rose-500"}`}
                                    >
                                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Secure Trust Protocol */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-12 border-t border-border/30">
                                {[
                                    { icon: ShieldCheck, label: "Vault Secured" },
                                    { icon: Truck, label: "Ethereal Shipping" },
                                    { icon: RotateCcw, label: "Ritual Returns" }
                                ].map((trust, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-primary/60">
                                            <trust.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{trust.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Extended Manifest */}
                <section className="mb-32">
                    <Tabs defaultValue="narrative" className="space-y-16">
                        <div className="flex justify-start sm:justify-center overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                            <TabsList className="bg-muted/10 p-1 rounded-full h-auto border border-border/10 flex-nowrap shrink-0">
                                <TabsTrigger value="narrative" className="rounded-full px-6 md:px-8 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg transition-all duration-500">Narrative</TabsTrigger>
                                <TabsTrigger value="specs" className="rounded-full px-6 md:px-8 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg transition-all duration-500">Specs</TabsTrigger>
                                <TabsTrigger value="reviews" className="rounded-full px-6 md:px-8 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg transition-all duration-500 whitespace-nowrap">Patron Proof ({product.reviews})</TabsTrigger>
                                <TabsTrigger value="faq" className="rounded-full px-6 md:px-8 py-2 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg transition-all duration-500">FAQ</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="narrative" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="max-w-3xl mx-auto glass p-12 rounded-[3rem] text-center space-y-8 border-border/10 shadow-sm">
                                <Sparkles className="w-10 h-10 text-primary mx-auto opacity-20" />
                                <h3 className="text-3xl font-serif italic text-balance leading-tight">{product.name}: The Ritual Synthesis</h3>
                                <p className="text-lg text-muted-foreground font-light leading-relaxed text-balance">
                                    {product.detailed_description || product.description}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="specs" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(product.specs || { "Texture": "Silky Elixir", "Absorption": "Instant", "Fragrance": "Celestial Bloom", "Hair Type": "All Alignments" }).map(([key, val]) => (
                                    <div key={key} className="flex flex-col gap-1 p-6 rounded-[2rem] bg-muted/5 border border-border/10 hover:bg-muted/10 transition-colors">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{key}</span>
                                        <span className="font-serif italic text-lg text-primary">{val as string}</span>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
                            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                                {realReviews.length > 0 ? (
                                    realReviews.map((rev: any, i: number) => (
                                        <div key={rev.id || i} className="glass p-10 rounded-[3rem] space-y-6 flex flex-col justify-between border-border/10">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-1 text-primary">
                                                        {[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < rev.rating ? "fill-primary" : "opacity-20"}`} />)}
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                                        {new Date(rev.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-lg font-light leading-relaxed italic">"{rev.comment}"</p>

                                                {rev.admin_reply && (
                                                    <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 relative mt-4">
                                                        <div className="absolute -left-2 top-4 bottom-4 w-1 bg-primary rounded-full" />
                                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60 mb-2">
                                                            <ShieldCheck className="w-3 h-3" /> Guardian Response
                                                        </div>
                                                        <p className="text-sm font-medium italic text-primary/80">"{rev.admin_reply}"</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 pt-6 border-t border-border/20">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                                    {(rev.user_name || "P").slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-serif font-bold text-sm tracking-tight">{rev.user_name || "Anonymous Patron"}</p>
                                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Patron</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-20 text-center space-y-4 opacity-50">
                                        <MessageSquare className="w-12 h-12 mx-auto" />
                                        <p className="font-serif italic text-lg text-muted-foreground">No botanical insights have been shared for this essence yet.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="faq" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="max-w-3xl mx-auto">
                                <Accordion type="single" collapsible className="space-y-4">
                                    {(product.faqs || [
                                        { q: "When is the optimal cycle for use?", a: "Manifest this essence during your evening ritual. Apply to the scalp, massage gently, and leave overnight for maximum absorption." },
                                        { q: "Is it compatible with all hair alignments?", a: "Yes, our botanical formulation is clinically synthesized to harmonize with all hair alignments, including color-treated and chemically processed hair." }
                                    ]).map((faq: any, i: number) => (
                                        <AccordionItem key={i} value={`item-${i}`} className="border-none">
                                            <AccordionTrigger className="glass px-10 py-8 rounded-[2rem] hover:no-underline text-lg font-serif italic focus:bg-primary/5 transition-colors">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="px-12 py-8 text-muted-foreground font-light text-lg leading-relaxed border-t border-border/10">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </TabsContent>
                    </Tabs>
                </section>

                <RecentlyViewedProducts currentId={product.id} products={products} />

                {/* Upsell Grid */}
                <div className="mb-32">
                    <div className="flex items-end justify-between mb-16">
                        <h2 className="text-5xl md:text-6xl font-serif tracking-tight">Luxury <span className="text-primary italic">Alternatives</span></h2>
                        <Link to="/shop" className="text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors">Explore All <ArrowLeft className="w-4 h-4 rotate-180" /></Link>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.filter(p => p.id !== product.id).slice(0, 4).map(p => (
                            <Link to={`/product/${p.id}`} key={p.id} className="group glass p-4 rounded-[2.5rem] hover:shadow-2xl transition-all border-border/30">
                                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-muted mb-6">
                                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                </div>
                                <div className="space-y-4 px-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{p.category}</p>
                                    <h4 className="font-serif text-xl tracking-tight leading-tight group-hover:text-primary transition-colors">{p.name}</h4>
                                    <p className="text-2xl font-serif font-black text-primary">Rs. {p.price}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Newsletter Ritual */}
                <div className="bg-primary rounded-[4rem] p-16 md:p-24 text-primary-foreground text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
                    <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                        <Sparkles className="w-12 h-12 mx-auto opacity-30 animate-pulse" />
                        <div className="space-y-3">
                            <h2 className="text-4xl md:text-5xl font-serif italic text-balance leading-tight">The Inner Circle</h2>
                            <p className="text-primary-foreground/70 font-light text-lg text-balance">Become a patron of Lorean and receive exclusive access to upcoming botanical manifestations.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/10 rounded-[2.5rem] backdrop-blur-xl border border-white/20">
                            <Input placeholder="Your Email Artifact" className="h-14 rounded-full bg-transparent border-none text-white placeholder:text-white/40 px-8 focus-visible:ring-0 text-base" />
                            <Button className="h-14 rounded-full px-12 bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-[10px] shadow-lg">Join Ritual</Button>
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Privacy is curated. We never disseminate artifact data.</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
