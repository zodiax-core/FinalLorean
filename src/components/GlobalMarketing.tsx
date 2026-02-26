import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShoppingBag, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingService, productsService, Product } from "@/services/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function GlobalMarketing() {
    const navigate = useNavigate();
    const [config, setConfig] = useState<any>(null);
    const [popupProduct, setPopupProduct] = useState<Product | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarketing = async () => {
            try {
                const settings = await marketingService.getMarketingConfig();
                setConfig(settings);

                if (settings?.popup_product_id) {
                    const product = await productsService.getById(settings.popup_product_id);
                    setPopupProduct(product);

                    // Show popup only if not seen this session
                    const hasSeenPopup = sessionStorage.getItem("LRN_POPUP_SEEN");
                    if (!hasSeenPopup) {
                        setTimeout(() => {
                            setShowPopup(true);
                            sessionStorage.setItem("LRN_POPUP_SEEN", "true");
                        }, 3000); // 3 second delay for elegance
                    }
                }
            } catch (error) {
                console.error("Marketing fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMarketing();
    }, []);

    useEffect(() => {
        if (config?.hero_bar?.enabled && config?.hero_bar?.text) {
            document.documentElement.style.setProperty('--hero-bar-height', '40px');
            document.body.classList.add('has-hero-bar');
        } else {
            document.documentElement.style.setProperty('--hero-bar-height', '0px');
            document.body.classList.remove('has-hero-bar');
        }
        return () => {
            document.documentElement.style.setProperty('--hero-bar-height', '0px');
            document.body.classList.remove('has-hero-bar');
        };
    }, [config?.hero_bar?.enabled, config?.hero_bar?.text]);

    if (loading || !config) return null;

    return (
        <>
            {/* Hero Bar */}
            <AnimatePresence>
                {config.hero_bar?.enabled && config.hero_bar?.text && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
                        style={{ backgroundColor: config.hero_bar.bg_color || "#000000" }}
                    >
                        <div
                            className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center"
                            style={{ color: config.hero_bar.text_color || "#ffffff" }}
                        >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] leading-tight">
                                {config.hero_bar.text}
                            </span>
                            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Popup Modal */}
            <AnimatePresence>
                {showPopup && popupProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl glass rounded-[3.5rem] overflow-hidden shadow-2xl border-2 border-white/10"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowPopup(false)}
                                className="absolute top-8 right-8 z-10 w-12 h-12 rounded-full glass hover:bg-white/20 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative aspect-square md:aspect-auto h-[300px] md:h-auto overflow-hidden">
                                    <img
                                        src={popupProduct.image}
                                        alt={popupProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-10">
                                        <div className="flex gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80 italic">Curated Excellence</p>
                                    </div>
                                </div>
                                <div className="p-12 flex flex-col justify-center space-y-8 bg-background/40">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Limited Offering</h4>
                                        <h2 className="text-5xl font-serif tracking-tight leading-tight">
                                            {popupProduct.name.split(' ').slice(0, -1).join(' ')} <br />
                                            <span className="text-primary italic">{popupProduct.name.split(' ').slice(-1)}</span>
                                        </h2>
                                        <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs">
                                            {popupProduct.description || "Indulge in our most sought-after elixir, crafted for those who seek the extraordinary."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Ritual Exchange</p>
                                            <p className="text-3xl font-serif italic text-primary">Rs. {popupProduct.price}</p>
                                        </div>
                                        <div className="w-px h-12 bg-border/20" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Stock</p>
                                            <p className="text-base font-bold uppercase">{popupProduct.stock > 0 ? 'Available' : 'Sold Out'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            size="lg"
                                            onClick={() => {
                                                setShowPopup(false);
                                                navigate(`/product/${popupProduct.id}`);
                                            }}
                                            className="flex-1 h-16 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary group"
                                        >
                                            View Ritual  <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={() => setShowPopup(false)}
                                            className="h-16 rounded-full px-10 text-xs font-black uppercase tracking-widest border-2"
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
