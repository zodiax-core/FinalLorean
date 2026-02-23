import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Home } from "lucide-react";
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

            <main className="max-w-3xl mx-auto px-4 pt-40 pb-20 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="mb-12"
                >
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif mb-6 uppercase tracking-tighter">
                        Ritual <span className="text-primary italic">Confirmed</span>
                    </h1>
                    <p className="text-muted-foreground text-lg font-light max-w-md mx-auto leading-relaxed">
                        Your botanical selection has been manifest. Our guardians are now preparing your essence for delivery.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-10 rounded-[3rem] border-border/20 shadow-2xl mb-12 text-left"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <Package className="w-6 h-6 text-primary" />
                        <h3 className="font-serif text-2xl">Order Details</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black">Status</span>
                            <span className="font-bold text-primary uppercase text-[10px] tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">Pending Processing</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black">Payment Method</span>
                            <span className="font-bold uppercase text-[10px] tracking-widest">Cash on Delivery</span>
                        </div>
                        {orderData?.total_amount && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black">Total Amount</span>
                                <span className="font-bold text-primary">Rs. {Math.round(orderData.total_amount).toLocaleString()}</span>
                            </div>
                        )}
                        {orderData?.id && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black">ID</span>
                                <span className="font-mono text-xs">{orderData.short_id || orderData.id.slice(0, 8)}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild className="h-16 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                        <Link to="/shop">
                            Keep Exploring <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="h-16 rounded-full text-xs font-black uppercase tracking-[0.2em] border-2">
                        <Link to="/">
                            <Home className="mr-2 w-4 h-4" /> Home
                        </Link>
                    </Button>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderSuccess;
