import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Truck, Globe, Clock, PackageCheck } from "lucide-react";

const Shipping = () => {
    const methods = [
        { icon: Truck, title: "Standard Delivery", time: "3-5 Business Days", price: "Free on orders over Rs. 5000" },
        { icon: Clock, title: "Express Shipping", time: "1-2 Business Days", price: "Rs. 1000.00" },
        { icon: Globe, title: "International", time: "7-14 Business Days", price: "Calculated at checkout" },
        { icon: PackageCheck, title: "Tracked Shipping", time: "Always Included", price: "Free" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Shipping <span className="text-primary italic">Information</span></h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                            We deliver our luxury skincare to over 50 countries worldwide. Here's everything you need to know about getting your order.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {methods.map((m, i) => (
                            <motion.div
                                key={m.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-8 rounded-3xl border border-border/50 flex gap-6 items-start"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <m.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-1">{m.title}</h3>
                                    <p className="text-primary font-medium text-sm mb-2">{m.time}</p>
                                    <p className="text-muted-foreground text-sm">{m.price}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-muted/30 p-10 rounded-3xl text-center"
                    >
                        <h2 className="text-2xl font-serif mb-4">Handling Times</h2>
                        <p className="text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
                            Please note that orders placed after 2pm CET will be processed the following business day. During peak promotional periods, please allow an additional 24-48 hours for processing.
                        </p>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Shipping;
