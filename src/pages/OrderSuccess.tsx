import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Home, Mail, Sparkles, MapPin, Truck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const OrderSuccess = () => {
    const location = useLocation();
    const orderData = location.state?.order;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 pt-44 pb-32 text-center">
                {/* Ritual Success Header */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="mb-12 relative"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none opacity-20">
                        <Sparkles className="w-24 h-24 text-primary animate-pulse" />
                    </div>

                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_50px_rgba(201,162,76,0.2)]">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif mb-6 uppercase tracking-tighter text-foreground">
                        Ritual <span className="text-primary italic">Manifested</span>
                    </h1>

                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="h-px w-12 bg-primary/30" />
                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-primary">Sacred Confirmation</span>
                        <div className="h-px w-12 bg-primary/30" />
                    </div>

                    <p className="text-muted-foreground text-lg font-light max-w-lg mx-auto leading-relaxed font-serif italic">
                        "Your botanical selection has been heard by the guardians. The essence is now traveling toward your abode."
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
                    {/* Order Details Logic Block */}
                    <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-3 glass p-8 md:p-10 rounded-[3rem] border border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.04)] text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Package className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="font-serif text-2xl tracking-tight">Order Receipt</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Ritual ID</p>
                                    <p className="font-mono text-xs font-bold bg-muted/50 px-3 py-1 rounded-full">
                                        #{(orderData?.short_id || orderData?.id?.slice(0, 8) || "PENDING")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                                        <Truck className="w-3 h-3" /> Delivery Manifest
                                    </h4>
                                    <div className="bg-muted/30 p-6 rounded-2xl border border-border/10">
                                        <p className="font-bold text-lg mb-1">{orderData?.full_name || "Inner Circle Patron"}</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {orderData?.address}{orderData?.city ? `, ${orderData.city}` : ""}<br />
                                            {orderData?.state} {orderData?.postal_code}
                                        </p>
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-6 pb-8 border-bottom border-border/10">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Manifest Date</p>
                                        <p className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Exchange Method</p>
                                        <p className="text-sm font-medium uppercase tracking-tighter">{orderData?.payment_method || "Processing"}</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border/10 flex items-center justify-between">
                                    <span className="font-serif italic text-xl">Sacred Total</span>
                                    <span className="text-2xl font-serif font-black text-primary">
                                        Rs. {Math.round(orderData?.total_amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Side Info / Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 text-left relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
                            <Mail className="w-12 h-12 mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="font-serif text-2xl mb-4 italic">A parchment is arriving...</h3>
                            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
                                We've dispatched a digital scroll (confirmation email) to your inbox. Please check your junk or spam rituals if it hasn't manifested.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-col gap-4"
                        >
                            <Button asChild size="lg" className="h-16 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 group">
                                <Link to="/shop">
                                    Continue the Journey <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </Link>
                            </Button>
                            <Button variant="outline" asChild size="lg" className="h-14 rounded-full text-xs font-black uppercase tracking-[0.2em] border-2 bg-white hover:bg-muted transition-colors">
                                <Link to="/">
                                    <Home className="mr-3 w-4 h-4" /> Return to Sanctuary
                                </Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderSuccess;
