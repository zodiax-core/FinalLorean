import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { RotateCcw, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Returns = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Returns & <span className="text-primary italic">Refunds</span></h1>
                        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                            Our "Happiness Guarantee" means if you're not satisfied, neither are we. We offer simple and free returns within 30 days.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <RotateCcw className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-medium">30-Day Window</h3>
                            <p className="text-sm text-muted-foreground">Return any product within 30 days of receiving it for a full refund.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-medium">Free Returns</h3>
                            <p className="text-sm text-muted-foreground">We provide a prepaid shipping label for all returns within the EU and USA.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <HelpCircle className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-medium">Instant Support</h3>
                            <p className="text-sm text-muted-foreground">Our care team is available 24/7 to help you with the returns process.</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card p-12 rounded-3xl border border-border shadow-sm max-w-2xl mx-auto"
                    >
                        <h2 className="text-2xl font-serif mb-6">Start a Return</h2>
                        <p className="text-muted-foreground mb-8">Please enter your order number and email address to begin.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="outline" className="rounded-full px-10 h-14">Track Order</Button>
                            <Button className="rounded-full px-10 h-14">Start Process</Button>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Returns;
