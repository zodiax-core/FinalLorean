import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Leaf, Droplets, Recycle, ShieldCheck } from "lucide-react";

const Sustainability = () => {
    const values = [
        { icon: Leaf, title: "Nature First", desc: "100% organic and wild-harvested ingredients." },
        { icon: Droplets, title: "Water Preservation", desc: "Eco-friendly distillation processes that save water." },
        { icon: Recycle, title: "Zero Waste", desc: "Glass packaging designed for infinite recycling." },
        { icon: ShieldCheck, title: "Ethical Sourcing", desc: "Fair trade partnerships with local communities." },
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
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Our Commitment to <span className="text-primary italic">Sustainability</span></h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                            Nature's healing shouldn't cost the earth. We are dedicated to creating herbal oils that are as gentle on our planet as they are on your hair and scalp.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-8 rounded-3xl border border-border/50 hover:shadow-xl transition-all text-center"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <v.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-medium mb-3">{v.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Sustainability;
