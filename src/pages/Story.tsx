import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Story = () => {
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
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Our <span className="text-primary italic">Story</span></h1>
                        <div className="w-24 h-1 bg-primary mx-auto"></div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1617092223126-a2d555d31525?w=800&q=80"
                                alt="Our Heritage"
                                className="rounded-3xl shadow-2xl"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl font-serif">A Legacy of Luster</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed font-light">
                                Founded in the heart of the Himalayas, Lorean began with a simple belief: that premium hair care should be as pure as the earth it comes from. Our journey started with a single infusion of Amla, and a dream to restore the ancient ritual of oiling for hair that glows with health.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed font-light">
                                Today, we continue to bridge the gap between ancient Ayurvedic wisdom and modern extraction science, creating rituals that honor both your roots and the world we share.
                            </p>
                        </motion.div>

                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Story;
