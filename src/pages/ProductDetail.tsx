import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, Heart, ShoppingBag, ArrowLeft, Minus, Plus, Share2,
    ShieldCheck, CheckCircle2, Facebook,
    Twitter, Instagram, ChevronRight, MessageSquare, Info,
    Package, Sparkles, Clock, CreditCard, Loader2, HelpCircle,
    Check, Play, ExternalLink, Youtube, User, Video, Pause,
    Volume2, VolumeX, RotateCcw, Copy
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
import { Product, reviewsService, productsService, marketingService } from "@/services/supabase";
import { emailService } from "@/services/email";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";

const getVideoData = (url: string) => {
    let platform = 'generic';
    let id = '';
    let embedUrl = '';
    let thumb = '';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|shorts\/)([^"&?\/\s]{11})/);
        id = match?.[1] || '';
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
        thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    } else if (url.includes('instagram.com')) {
        platform = 'instagram';
        const match = url.match(/(?:reels?|p)\/([^\/?#&]+)/);
        id = match?.[1] || '';
        embedUrl = `https://www.instagram.com/reels/${id}/embed`;
        thumb = `https://www.instagram.com/reels/${id}/thumbnail`; // Note: Might need IG API for real ones, but common pattern
    } else if (url.includes('tiktok.com')) {
        platform = 'tiktok';
        const match = url.match(/video\/(\d+)/);
        id = match?.[1] || '';
        embedUrl = `https://www.tiktok.com/embed/v2/${id}`;
        // TikTok doesn't have a direct thumb URL that's reliable without API, but we'll use a placeholder or the card's style
    }

    return { platform, id, embedUrl, thumb };
};

const getUsernameFromUrl = (url: string) => {
    try {
        if (url.includes('tiktok.com')) {
            const match = url.match(/@([^/\?]+)/);
            return match ? match[1] : 'Patron';
        }
        if (url.includes('instagram.com')) {
            const parts = url.split('/').filter(Boolean);
            const idx = parts.findIndex(p => p.includes('instagram.com'));
            // Sometimes it's the next part if it's instagram.com/username
            if (parts[idx + 1] && !['reels', 'p', 'reel'].includes(parts[idx + 1])) return parts[idx + 1];
            return 'Patron';
        }
        if (url.includes('youtube.com')) {
            const match = url.match(/@([^/\?]+)/);
            return match ? match[1] : 'Patron';
        }
    } catch (e) { }
    return 'Patron';
};

const getPlatformIcon = (platform: string) => {
    switch (platform) {
        case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
        case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
        case 'tiktok': return <Sparkles className="w-4 h-4 text-cyan-400" />;
        default: return <Play className="w-4 h-4 text-primary" />;
    }
};

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
    const isActuallyLoading = loading || (directLoading && !product);

    const [activeImage, setActiveImage] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState("");
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [realReviews, setRealReviews] = useState<any[]>([]);
    const [fetchingReviews, setFetchingReviews] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [visionsIndex, setVisionsIndex] = useState(0);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [finishedVideos, setFinishedVideos] = useState<Set<string>>(new Set());
    const [tikTokSources, setTikTokSources] = useState<Record<string, string>>({});
    const [subscriberEmail, setSubscriberEmail] = useState("");
    const [subscribing, setSubscribing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
    const reviewCarouselRef = useRef<HTMLDivElement>(null);
    const visionsCarouselRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const buySectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (product?.video_proofs) {
            product.video_proofs.forEach((proof: any) => {
                const url = typeof proof === 'string' ? proof : proof.url;
                if (url && url.includes('tiktok.com') && !tikTokSources[url]) {
                    fetch(`https://www.tikwm.com/api/video/get?url=${encodeURIComponent(url)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.data?.play) {
                                setTikTokSources(prev => ({ ...prev, [url]: data.data.play }));
                            }
                        })
                        .catch(err => console.error("TikTok fetch error:", err));
                }
            });
        }
    }, [product?.video_proofs]);

    const mergedReviews = useMemo(() => {
        const fakeOnes = product?.reviews_list || [];
        const formattedFake = fakeOnes.map((f: any, idx: number) => ({
            id: `fake-${idx}`,
            user_name: f.author,
            rating: f.rating,
            comment: f.comment,
            is_fake: true,
            created_at: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
            verified: true
        }));
        const all = [...formattedFake, ...realReviews];
        return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [product?.reviews_list, realReviews]);

    const displayReviewsCount = useMemo(() => {
        return Math.max(mergedReviews.length, product?.reviews || 0);
    }, [mergedReviews.length, product?.reviews]);

    const displayRating = useMemo(() => {
        if (mergedReviews.length === 0) return Number(product?.rating || 0);
        const totalRating = mergedReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        return Number((totalRating / mergedReviews.length).toFixed(1));
    }, [mergedReviews, product?.rating]);

    useEffect(() => {
        if (product) {
            const fetchReviews = async () => {
                setFetchingReviews(true);
                try {
                    const data = await reviewsService.getByProductId(product.id);
                    setRealReviews(data || []);
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

    useEffect(() => {
        if (product?.video_proofs?.length) {
            const hosts = ['www.tiktok.com', 'www.instagram.com', 'www.youtube.com'];
            hosts.forEach(host => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = `https://${host}`;
                document.head.appendChild(link);
            });
        }
    }, [product?.video_proofs]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        toast({ title: "Link Ritualized", description: "Product essence link copied to clipboard." });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscriberEmail) return;
        setSubscribing(true);
        try {
            await marketingService.subscribe(subscriberEmail);

            // Send welcome email via EmailJS
            try {
                await emailService.sendWelcomeEmail(subscriberEmail);
            } catch (emailError) {
                console.warn("Welcome email could not be sent:", emailError);
            }

            setIsSubscribed(true);
            toast({ title: "Welcome to the Inner Circle", description: "You've successfully subscribed to our newsletter." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Subscription Failed", description: error.message || "The ritual was interrupted." });
        } finally {
            setSubscribing(false);
        }
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

    // Check if admin has entered specs data
    const hasSpecs = product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0;

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title={product.name}
                description={product.description}
                image={product.image}
            />
            <Navbar />

            {/* Sticky Buy Bar (Floating Glass Design) */}
            <AnimatePresence>
                {showStickyBar && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6 pb-10 md:pb-6 pointer-events-none"
                    >
                        <div className="max-w-4xl mx-auto glass rounded-[2.5rem] p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl border border-white/20 pointer-events-auto">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <img src={product.image} className="w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] md:rounded-[1.5rem] object-cover shadow-2xl border-white/30 border" alt="" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-serif text-base md:text-xl font-bold truncate leading-tight">{product.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary font-black text-sm md:text-lg">Rs. {product.price}</span>
                                        {oldPrice > price && <span className="text-[10px] text-muted-foreground line-through decoration-primary/30">Rs. {oldPrice}</span>}
                                    </div>
                                </div>
                                {/* Mobile Actions */}
                                <div className="flex items-center gap-2 sm:hidden ml-auto">
                                    <Button
                                        onClick={() => addToWishlist(product)}
                                        size="icon"
                                        variant="outline"
                                        className={`w-12 h-12 rounded-full border-none transition-all ${isInWishlist(product.id) ? "bg-rose-50 text-rose-500" : "bg-muted/30"}`}
                                    >
                                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`} />
                                    </Button>
                                    <Button onClick={() => addToCart(product, quantity)} size="lg" className="rounded-full px-6 h-12 bg-primary font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all">Manifest</Button>
                                </div>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden sm:flex items-center gap-6">
                                <div className="flex items-center border border-border/20 rounded-full p-1 bg-muted/10 h-10">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all"><Minus className="w-3 h-3" /></button>
                                    <span className="w-10 text-center font-bold text-sm tracking-widest">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => addToWishlist(product)}
                                        size="icon"
                                        variant="outline"
                                        className={`w-12 h-12 rounded-full border-none transition-all ${isInWishlist(product.id) ? "bg-rose-50 text-rose-500 shadow-lg" : "bg-muted/30 hover:bg-rose-50 hover:text-rose-500"}`}
                                    >
                                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`} />
                                    </Button>
                                    <Button onClick={() => addToCart(product, quantity)} className="rounded-full px-10 h-14 shadow-2xl shadow-primary/30 bg-primary font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all">Manifest Into Bag</Button>
                                </div>
                            </div>
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

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-32 mb-16">
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
                                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(displayRating) ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-wider">
                                        {displayRating} <span className="text-muted-foreground/60">({displayReviewsCount})</span>
                                        {product.fake_sold_count ? <span className="ml-2 text-primary">| {product.fake_sold_count}+ vessels manifested</span> : null}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight tracking-tighter uppercase animate-in slide-in-from-left-8 duration-1000 text-center lg:text-left">
                                    {product.name}
                                </h1>

                                <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-light text-balance max-w-xl text-center lg:text-left mx-auto lg:mx-0">
                                    {product.description}
                                </p>

                                {product.stock !== undefined && product.stock <= (product.min_stock_level || 5) && (
                                    <div className="flex items-center justify-center lg:justify-start gap-2 text-red-600 animate-pulse font-black">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] uppercase tracking-[0.2em]">
                                            {product.stock === 0 ? "Out of Stock" : `Botanical Shortage: Only ${product.stock} vessels Left`}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-end justify-center lg:justify-start gap-4">
                                    <span className="text-4xl font-bold font-serif text-primary tracking-tighter">Rs. {product.price}</span>
                                    {oldPrice > 0 && <span className="text-xl text-muted-foreground line-through mb-1.5 font-light tracking-tighter">Rs. {oldPrice}</span>}
                                </div>
                            </div>

                            {/* Combined Actions Section */}
                            <div className="glass p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-border/10 space-y-6 md:space-y-8 mt-4 md:mt-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vessel Volume</Label>
                                        <p className="font-serif italic text-xl text-primary">{product.vessel_volume || (product.variants?.sizes?.[0] || "200ml")}</p>
                                    </div>
                                    <div className="text-right">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Inventory</Label>
                                        {product.stock > 0 ? (
                                            <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-[10px]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Essence Manifested
                                                <span className="text-muted-foreground/60 normal-case font-semibold">· {product.stock} left</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-widest text-[10px]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                Out of Stock
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 h-auto sm:h-16">
                                    <div className="flex items-center border-2 border-border/20 rounded-full p-1 bg-muted/10 h-14 sm:h-full w-full sm:w-auto shrink-0">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 sm:w-10 h-full flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all duration-300"><Minus className="w-4 h-4" /></button>
                                        <span className="w-12 text-center font-black text-lg font-serif italic">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="flex-1 sm:w-10 h-full flex items-center justify-center hover:bg-primary hover:text-white rounded-full transition-all duration-300"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex gap-3 w-full sm:flex-1 h-14 sm:h-full">
                                        <Button
                                            onClick={() => addToCart(product, quantity)}
                                            className="flex-1 h-full rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary group hover:bg-primary/90 transition-all duration-500"
                                        >
                                            Manifest Into Bag
                                            <ShoppingBag className="ml-3 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                        </Button>
                                        <Button
                                            onClick={() => addToWishlist(product)}
                                            variant="outline"
                                            className={`h-full w-14 sm:w-16 rounded-full border-2 transition-all duration-500 shrink-0 flex items-center justify-center ${isInWishlist(product.id) ? "bg-rose-50 border-rose-100 text-rose-500 shadow-lg" : "border-border hover:border-rose-100 hover:text-rose-500"}`}
                                        >
                                            <Heart className={`w-5 h-5 md:w-6 h-6 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Highlights: Pair in one line on mobile ── */}
                {product.highlights && product.highlights.length > 0 && (
                    <div className="mb-24 px-2">
                        <div className="grid grid-cols-2 lg:flex lg:flex-wrap justify-center gap-3">
                            {product.highlights.map((h: string) => (
                                <div
                                    key={h}
                                    className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 bg-muted/20 p-4 sm:px-6 sm:py-3.5 rounded-[1.5rem] sm:rounded-full border border-border/10 group hover:border-primary/30 hover:bg-primary/5 transition-all text-center sm:text-left"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                                    <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Continuous Sections ── */}
                <div className="space-y-32">

                    {/* Narrative panel moved lower */}

                    {/* Specs — only shown if admin has entered data */}
                    {hasSpecs && (
                        <div id="specs" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl font-serif mb-4 uppercase">Technical <span className="text-primary italic">Synthesis</span></h2>
                                <p className="text-muted-foreground text-sm uppercase tracking-widest">Botanical Composition & Molecular Alignments</p>
                            </div>
                            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {Object.entries(product.specs).map(([key, val]) => (
                                    <div key={key} className="flex flex-col gap-2 p-8 rounded-[3rem] bg-muted/20 border border-border/10 hover:border-primary/20 transition-all group">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 group-hover:text-primary transition-colors">{key}</span>
                                        <span className="font-serif italic text-2xl text-foreground">{val as string}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Patron Visions (Video Proofs) ── */}
                    {product.video_proofs && product.video_proofs.length > 0 && (
                        <div id="visions" className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-16">
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-serif mb-4 uppercase tracking-tighter">Patron <span className="text-primary italic">Visions</span></h2>
                                <div className="flex items-center justify-center gap-2">
                                    <Play className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ritual Manifestations In Motion</span>
                                </div>
                            </div>

                            <div className="relative max-w-7xl mx-auto px-4 group">
                                {/* Edge Blurs */}
                                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/40 to-transparent z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/40 to-transparent z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {product.video_proofs && product.video_proofs.length > 2 && visionsIndex > 0 && (
                                    <button
                                        onClick={() => {
                                            const next = visionsIndex - 1;
                                            setVisionsIndex(next);
                                            visionsCarouselRef.current?.scrollTo({
                                                left: (visionsCarouselRef.current?.scrollWidth / product.video_proofs.length) * next,
                                                behavior: 'smooth'
                                            });
                                        }}
                                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 group/btn"
                                    >
                                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <ArrowLeft className="w-6 h-6 relative z-10" />
                                    </button>
                                )}
                                {product.video_proofs && product.video_proofs.length > 2 && visionsIndex < product.video_proofs.length - 1 && (
                                    <button
                                        onClick={() => {
                                            const next = visionsIndex + 1;
                                            setVisionsIndex(next);
                                            visionsCarouselRef.current?.scrollTo({
                                                left: (visionsCarouselRef.current?.scrollWidth / product.video_proofs.length) * next,
                                                behavior: 'smooth'
                                            });
                                        }}
                                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 group/btn"
                                    >
                                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <ArrowLeft className="w-6 h-6 rotate-180 relative z-10" />
                                    </button>
                                )}

                                <motion.div
                                    ref={visionsCarouselRef}
                                    className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory px-4 md:px-0 scroll-smooth cursor-default scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
                                    onScroll={(e) => {
                                        const el = e.currentTarget;
                                        const index = Math.round(el.scrollLeft / (el.scrollWidth / product.video_proofs.length));
                                        if (index !== visionsIndex) setVisionsIndex(index);
                                    }}
                                >
                                    <div className="flex-none w-[5vw] md:w-[20vw]" /> {/* Centering padding */}
                                    {(product.video_proofs || []).map((proof: any, i: number) => {
                                        const url = proof.url;
                                        if (!url) return null;

                                        const { platform: inferredPlatform, embedUrl, thumb } = getVideoData(url);
                                        const platform = proof.platform || inferredPlatform;
                                        const handle = proof.username || getUsernameFromUrl(url);
                                        const redirectionLink = proof.redirection_link || url;

                                        const isPlaying = playingVideo === url;
                                        const isFinished = finishedVideos.has(url);
                                        const tiktokMp4 = tikTokSources[url];
                                        const isUpload = platform === 'upload' || url.includes('supabase.co');

                                        const liquidMorph = {
                                            animate: {
                                                borderRadius: [
                                                    "60% 40% 30% 70% / 60% 30% 70% 40%",
                                                    "30% 60% 70% 40% / 50% 60% 30% 60%",
                                                    "60% 40% 30% 70% / 60% 30% 70% 40%"
                                                ],
                                            },
                                            transition: {
                                                duration: 8,
                                                repeat: Infinity,
                                                ease: "easeInOut" as const
                                            }
                                        };

                                        return (
                                            <div key={i} className="flex-none w-[280px] md:w-[320px] snap-start">
                                                <div className="glass rounded-[3rem] overflow-hidden border-border/10 group/vid-card hover:shadow-2xl transition-all duration-700 relative h-full">
                                                    <div className="aspect-[9/16] bg-black relative overflow-hidden">
                                                        {isPlaying ? (
                                                            isUpload ? (
                                                                <div className="absolute inset-0 z-30">
                                                                    <video
                                                                        src={url}
                                                                        className="w-full h-full object-cover"
                                                                        autoPlay
                                                                        playsInline
                                                                        muted={isMuted}
                                                                        ref={(el) => {
                                                                            if (el) {
                                                                                if (isPaused) el.pause();
                                                                                else el.play().catch(() => { });
                                                                            }
                                                                        }}
                                                                        onEnded={() => {
                                                                            setPlayingVideo(null);
                                                                            setFinishedVideos(prev => new Set(prev).add(url));
                                                                            setIsPaused(false);
                                                                        }}
                                                                    />

                                                                    {/* Custom Controls Overlay */}
                                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 pt-12 flex items-center justify-between z-40 transition-opacity group-hover:opacity-100">
                                                                        <div className="flex items-center gap-4">
                                                                            <motion.button
                                                                                {...liquidMorph}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setIsPaused(!isPaused);
                                                                                }}
                                                                                className="w-12 h-12 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-all shadow-xl border border-white/20"
                                                                            >
                                                                                {isPaused ? <Play className="w-5 h-5 fill-white ml-0.5" /> : <Pause className="w-5 h-5 fill-white" />}
                                                                            </motion.button>
                                                                            <motion.button
                                                                                {...liquidMorph}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setIsMuted(!isMuted);
                                                                                }}
                                                                                className="w-12 h-12 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-all shadow-xl border border-white/20"
                                                                            >
                                                                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                                            </motion.button>
                                                                        </div>

                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPlayingVideo(null);
                                                                                setTimeout(() => setPlayingVideo(url), 0);
                                                                                setIsPaused(false);
                                                                            }}
                                                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                                                                        >
                                                                            <RotateCcw className="w-3 h-3" /> Replay
                                                                        </button>
                                                                    </div>
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        className="absolute top-4 right-4 z-40"
                                                                    >
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(redirectionLink, '_blank');
                                                                            }}
                                                                            size="icon"
                                                                            className="rounded-full w-10 h-10 bg-white/20 backdrop-blur-md text-white hover:bg-primary transition-all shadow-xl"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </Button>
                                                                    </motion.div>
                                                                </div>
                                                            ) : platform === 'tiktok' && tiktokMp4 ? (
                                                                <div className="absolute inset-0 z-30">
                                                                    <video
                                                                        src={tiktokMp4}
                                                                        className="w-full h-full object-cover"
                                                                        controls
                                                                        autoPlay
                                                                        playsInline
                                                                        onEnded={() => {
                                                                            setPlayingVideo(null);
                                                                            setFinishedVideos(prev => new Set(prev).add(url));
                                                                        }}
                                                                    />
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        className="absolute top-4 right-4 z-40"
                                                                    >
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(redirectionLink, '_blank');
                                                                            }}
                                                                            size="icon"
                                                                            className="rounded-full w-10 h-10 bg-white/20 backdrop-blur-md text-white hover:bg-primary transition-all shadow-xl"
                                                                        >
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </Button>
                                                                    </motion.div>
                                                                </div>
                                                            ) : (
                                                                <iframe
                                                                    src={embedUrl}
                                                                    className="absolute inset-0 w-full h-full z-30 bg-black"
                                                                    allow="autoplay; encrypted-media; picture-in-picture"
                                                                    allowFullScreen
                                                                />
                                                            )
                                                        ) : (
                                                            <>
                                                                {thumb || isUpload ? (
                                                                    isUpload ? (
                                                                        <video src={url} className="w-full h-full object-cover grayscale-[0.2] opacity-50" />
                                                                    ) : (
                                                                        <img src={thumb} className="w-full h-full object-cover grayscale-[0.2] group-hover/vid-card:grayscale-0 group-hover/vid-card:scale-105 transition-all duration-[2s]" alt="" />
                                                                    )
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                                                        <Play className="w-12 h-12 text-primary opacity-20" />
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />

                                                                {/* Post-play redirection button */}
                                                                {isFinished && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40"
                                                                    >
                                                                        <div className="flex flex-col items-center gap-6">
                                                                            <Button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    window.open(redirectionLink, '_blank');
                                                                                }}
                                                                                className="rounded-full px-8 h-14 bg-primary text-white font-black uppercase tracking-widest hover:scale-110 transition-all shadow-2xl"
                                                                            >
                                                                                Explore Source <ExternalLink className="ml-3 w-4 h-4" />
                                                                            </Button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPlayingVideo(null);
                                                                                    setTimeout(() => setPlayingVideo(url), 10);
                                                                                    setIsPaused(false);
                                                                                    setFinishedVideos(prev => {
                                                                                        const next = new Set(prev);
                                                                                        next.delete(url);
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors flex items-center gap-2"
                                                                            >
                                                                                <RotateCcw className="w-4 h-4" /> Replay Ritual
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                                                    <button
                                                                        onClick={() => {
                                                                            setPlayingVideo(url);
                                                                            setFinishedVideos(prev => {
                                                                                const next = new Set(prev);
                                                                                next.delete(url);
                                                                                return next;
                                                                            });
                                                                        }}
                                                                        className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-700 group/play"
                                                                    >
                                                                        <Play className="w-8 h-8 fill-white group-hover/play:scale-110 transition-transform ml-1" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}

                                                        <div className="absolute bottom-8 left-8 right-8 z-20 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[10px] font-black uppercase overflow-hidden">
                                                                        {isUpload ? <User className="w-5 h-5" /> : handle.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white truncate">{handle.startsWith('@') ? handle : `@${handle}`}</p>
                                                                        <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest">Patron Testimony</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => window.open(redirectionLink, '_blank')}
                                                                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
                                                                    title="Open Ritual Source"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center justify-between pt-5 border-t border-white/10">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm">
                                                                        {isUpload ? <Video className="w-4 h-4 text-primary" /> : getPlatformIcon(platform)}
                                                                    </div>
                                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">{isUpload ? 'Ritual' : platform}</span>
                                                                </div>
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-primary text-primary" />)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="flex-none w-[5vw] md:w-[20vw]" /> {/* Centering padding */}
                                </motion.div>
                            </div>
                        </div>
                    )}
                    <div id="reviews" className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-16">
                        <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-serif mb-4 uppercase tracking-tighter">Patron <span className="text-primary italic">Proof</span></h2>
                            <div className="flex items-center justify-center gap-2">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest">Trusted by {Math.max(mergedReviews.length, product.reviews || 0)} Patrons</span>
                            </div>
                        </div>

                        {/* Reviews — arrow-nav carousel */}
                        {mergedReviews.length > 0 ? (
                            <div className="relative">
                                {/* Prev button */}
                                {carouselIndex > 0 && (
                                    <button
                                        onClick={() => {
                                            const next = carouselIndex - 1;
                                            setCarouselIndex(next);
                                            reviewCarouselRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                                        }}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-background border-2 border-border/20 shadow-xl flex items-center justify-center hover:border-primary/40 hover:text-primary transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                )}

                                {/* Next button */}
                                {carouselIndex < mergedReviews.length - 1 && (
                                    <button
                                        onClick={() => {
                                            const next = carouselIndex + 1;
                                            setCarouselIndex(next);
                                            reviewCarouselRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                                        }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-background border-2 border-border/20 shadow-xl flex items-center justify-center hover:border-primary/40 hover:text-primary transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </button>
                                )}

                                {/* Cards row */}
                                <div
                                    ref={reviewCarouselRef}
                                    className="flex gap-6 overflow-x-hidden pb-2 snap-x snap-mandatory"
                                >
                                    {mergedReviews.map((rev: any, i: number) => (
                                        <div
                                            key={rev.id || i}
                                            className="glass flex-none w-[280px] sm:w-[400px] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-6 border-border/10 hover:shadow-xl transition-all duration-500 relative snap-start"
                                        >
                                            {rev.is_fake && (
                                                <div className="absolute top-6 right-6 text-[8px] font-black uppercase tracking-[0.3em] text-primary/30">Curated</div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-1 text-primary">
                                                    {[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < rev.rating ? "fill-primary" : "opacity-20"}`} />)}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                                    {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-base font-light leading-relaxed italic text-foreground/90 line-clamp-4">"{rev.comment}"</p>

                                            {rev.admin_reply && (
                                                <div className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 relative">
                                                    <div className="absolute -left-1 top-4 bottom-4 w-1 bg-primary rounded-full" />
                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60 mb-2">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Guardian Response
                                                    </div>
                                                    <p className="text-sm font-medium italic text-primary/80">"{rev.admin_reply}"</p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 sm:gap-4 pt-4 border-t border-border/10">
                                                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-[10px] sm:text-sm font-black text-primary uppercase shadow-inner shrink-0">
                                                    {(rev.user_name || "P").slice(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-serif font-bold text-xs sm:text-sm tracking-tight truncate">{rev.user_name || "Anonymous Patron"}</p>
                                                    <p className="text-[8px] sm:text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Dot indicators */}
                                {mergedReviews.length > 1 && (
                                    <div className="flex justify-center gap-2 mt-6">
                                        {mergedReviews.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setCarouselIndex(i);
                                                    reviewCarouselRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                                                }}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex
                                                    ? 'w-6 bg-primary'
                                                    : 'w-2 bg-border hover:bg-primary/40'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-24 text-center space-y-6 glass rounded-[4rem] border-dashed border-2">
                                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                                    <MessageSquare className="w-10 h-10 opacity-30" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-serif italic text-2xl text-foreground">Awaiting the first Patron's voice...</p>
                                    <p className="text-muted-foreground text-sm uppercase tracking-widest">Share your botanical experience with the collective.</p>
                                </div>
                            </div>
                        )}

                        {/* Review Submission Form — AFTER reviews */}
                        <div className="max-w-3xl mx-auto glass p-10 rounded-[3rem] border-border/10 space-y-6">
                            <h3 className="font-serif italic text-2xl text-center">Share your Botanical Experience</h3>
                            {user ? (
                                isReviewSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-10 space-y-4"
                                    >
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-10 h-10 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-serif italic text-2xl text-foreground">Insight Manifested</p>
                                            <p className="text-muted-foreground text-sm uppercase tracking-widest">Your Patron Proof has been added to the collective.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsReviewSubmitted(false)}
                                            className="rounded-full px-8 h-12 border-primary/20 text-primary"
                                        >
                                            Submit Another Insight
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <form className="space-y-6" onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const comment = formData.get('comment') as string;
                                        const rating = Number(formData.get('rating'));

                                        if (!comment || !rating) {
                                            toast({ title: "Ritual Incomplete", description: "Please provide both rating and insight.", variant: "destructive" });
                                            return;
                                        }

                                        try {
                                            setSubmittingReview(true);
                                            await reviewsService.create({
                                                product_id: product.id,
                                                user_id: user.id,
                                                user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                                                rating,
                                                comment,
                                                status: 'approved'
                                            });
                                            // Optimistically prepend the new review so it shows instantly
                                            const newReview = {
                                                id: `new-${Date.now()}`,
                                                user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patron',
                                                rating,
                                                comment,
                                                is_fake: false,
                                                created_at: new Date().toISOString(),
                                                verified: true,
                                            };
                                            setRealReviews(prev => [newReview, ...prev]);
                                            setCarouselIndex(0);
                                            setIsReviewSubmitted(true);
                                            toast({ title: "Insight Manifested", description: "Your Patron Proof has been added to the collective." });
                                            (e.target as HTMLFormElement).reset();
                                        } catch (err) {
                                            toast({ title: "Manifestation Failed", description: "Could not post review.", variant: "destructive" });
                                        } finally {
                                            setSubmittingReview(false);
                                        }
                                    }}>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <div key={s} className="relative group">
                                                        <input type="radio" name="rating" value={s} id={`star-${s}`} className="peer absolute opacity-0 cursor-pointer" required />
                                                        <label htmlFor={`star-${s}`} className="cursor-pointer text-muted-foreground peer-checked:text-primary hover:text-primary transition-colors">
                                                            <Star className="w-10 h-10 fill-current" />
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Alignment Rating</p>
                                        </div>
                                        <div className="space-y-4">
                                            <textarea
                                                name="comment"
                                                placeholder="Describe your ritual experience with this essence..."
                                                className="w-full h-36 bg-muted/20 rounded-[2rem] p-6 border border-border/10 focus:border-primary/30 focus:ring-0 outline-none font-light italic text-base transition-all resize-none"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={submittingReview}
                                                className="w-full h-14 rounded-full bg-primary font-black uppercase tracking-widest shadow-xl shadow-primary/10 disabled:opacity-60"
                                            >
                                                {submittingReview ? (
                                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Manifesting...</span>
                                                ) : 'Submit Insight'}
                                            </Button>
                                        </div>
                                    </form>
                                )
                            ) : (
                                <div className="text-center py-8 space-y-6">
                                    <Info className="w-12 h-12 mx-auto text-primary/40" />
                                    <p className="text-muted-foreground font-light text-lg">You must be logged in to share your botanical experience.</p>
                                    <Button onClick={() => navigate('/auth')} variant="outline" className="rounded-full px-10 h-12 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">Sign In to Manifest</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Narrative — Restructured and moved here */}
                    <div id="narrative" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="rounded-[2rem] md:rounded-[3rem] border border-border/10 bg-muted/5 overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
                            <div className="flex flex-col md:flex-row md:items-stretch">
                                <div className="p-8 md:p-12 md:w-1/3 md:border-r border-border/10 flex flex-col justify-center gap-6 bg-muted/5">
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Sparkles className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-serif italic text-primary leading-tight tracking-tight">{product.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">The Ritual Narrative</p>
                                    </div>
                                    <div className="h-px w-12 bg-primary/30" />
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        A manifestation of botanical excellence, curated for the modern patron.
                                    </p>
                                </div>
                                <div className="p-8 md:p-12 md:w-2/3">
                                    <div className="prose prose-primary max-w-none">
                                        <p className="text-lg md:text-xl text-muted-foreground/80 font-light leading-relaxed italic">
                                            {product.detailed_description || product.description}
                                        </p>
                                    </div>

                                    {/* SEO Tags Dispay */}
                                    {product.tags && product.tags.length > 0 && (
                                        <div className="mt-12 pt-12 border-t border-border/10">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6">Synthesis Alignments (Tags)</p>
                                            <div className="flex flex-wrap gap-3">
                                                {product.tags.map((tag: string) => (
                                                    <span key={tag} className="px-5 py-2 rounded-full bg-muted/40 border border-border/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:border-primary/30 hover:text-primary transition-all cursor-default">
                                                        #{tag.replace(/\s+/g, '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div id="faq" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-serif mb-4 uppercase tracking-tighter">Ritual <span className="text-primary italic">Inquiries</span></h2>
                            <HelpCircle className="w-8 h-8 mx-auto text-primary/20" />
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <Accordion type="single" collapsible className="space-y-6">
                                {(product.faqs || [
                                    { q: "When is the optimal cycle for use?", a: "Manifest this essence during your evening ritual. Apply to the scalp, massage gently, and leave overnight for maximum absorption." },
                                    { q: "Is it compatible with all hair alignments?", a: "Yes, our botanical formulation is clinically synthesized to harmonize with all hair alignments, including color-treated and chemically processed hair." }
                                ]).map((faq: any, i: number) => (
                                    <AccordionItem key={i} value={`item-${i}`} className="border-none">
                                        <AccordionTrigger className="glass px-10 py-8 rounded-[2.5rem] hover:no-underline text-xl font-serif italic focus:bg-primary/5 transition-all duration-500 border-border/10 data-[state=open]:rounded-b-none data-[state=open]:border-primary/20">
                                            {faq.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="glass px-12 py-8 text-muted-foreground font-light text-lg leading-relaxed border-t-0 rounded-b-[2.5rem] border-border/10 bg-muted/5 animate-in slide-in-from-top-4 duration-500">
                                            {faq.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>

                <RecentlyViewedProducts currentId={product.id} products={products} />

                {/* Upsell Grid */}
                <div className="mb-32 mt-32">
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

                {/* The Inner Circle */}
                <div className="bg-primary rounded-[2.5rem] md:rounded-[4rem] p-7 sm:p-10 md:p-14 text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
                    <div className="relative z-10 max-w-5xl mx-auto">
                        {/* Header row — icon + title side by side on mobile */}
                        <div className="flex items-center gap-4 mb-4 md:hidden">
                            <Sparkles className="w-6 h-6 opacity-40 shrink-0" />
                            <h2 className="text-2xl font-serif italic leading-tight">The Inner Circle</h2>
                        </div>
                        <div className="hidden md:flex flex-row items-center gap-12 lg:gap-16">
                            <div className="shrink-0 text-left space-y-3">
                                <Sparkles className="w-8 h-8 opacity-30 animate-pulse" />
                                <h2 className="text-4xl font-serif italic">The Inner Circle</h2>
                                <p className="text-primary-foreground/60 font-light text-sm max-w-xs text-balance">
                                    Become a patron of Lorean — receive exclusive access to upcoming botanical manifestations.
                                </p>
                            </div>
                            <div className="flex-1">
                                {isSubscribed ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 text-center"
                                    >
                                        <div className="flex items-center justify-center gap-3 text-white mb-1">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                            <p className="font-serif italic text-lg">You have subscribed</p>
                                        </div>
                                        <p className="text-[10px] uppercase tracking-widest opacity-60">The botanical secrets will find you soon.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubscribe}>
                                        <div className="flex flex-row gap-3 p-2 bg-white/10 rounded-[2rem] backdrop-blur-xl border border-white/20">
                                            <Input
                                                value={subscriberEmail}
                                                onChange={(e) => setSubscriberEmail(e.target.value)}
                                                type="email"
                                                required
                                                placeholder="Your Email Artifact"
                                                className="h-12 rounded-full bg-transparent border-none text-white placeholder:text-white/40 px-8 focus-visible:ring-0 text-sm"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={subscribing}
                                                className="h-12 rounded-full px-10 bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-[10px] shadow-lg shrink-0"
                                            >
                                                {subscribing ? "Joining..." : "Join Ritual"}
                                            </Button>
                                        </div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mt-3 text-center">Privacy is curated. We never disseminate artifact data.</p>
                                    </form>
                                )}
                            </div>
                        </div>
                        {/* Mobile: stacked layout */}
                        <div className="md:hidden space-y-5">
                            <p className="text-primary-foreground/65 font-light text-sm leading-relaxed">
                                Become a patron of Lorean — receive exclusive access to upcoming botanical manifestations.
                            </p>
                            {isSubscribed ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center"
                                >
                                    <div className="flex items-center justify-center gap-3 text-white mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                        <p className="font-serif italic text-xl">You have subscribed</p>
                                    </div>
                                    <p className="text-[9px] uppercase tracking-widest opacity-60"> Secrets are on the way.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="space-y-3">
                                    <Input
                                        value={subscriberEmail}
                                        onChange={(e) => setSubscriberEmail(e.target.value)}
                                        type="email"
                                        required
                                        placeholder="Your Email Artifact"
                                        className="h-13 w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-5 focus-visible:ring-0 focus-visible:border-white/40 text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={subscribing}
                                        className="w-full h-12 rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-[10px] shadow-lg"
                                    >
                                        {subscribing ? "Joining..." : "Join Ritual"}
                                    </Button>
                                </form>
                            )}
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 text-center">Privacy is curated. We never disseminate artifact data.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
