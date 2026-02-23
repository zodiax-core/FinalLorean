import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-serif mb-4">Privacy <span className="text-primary italic">Policy</span></h1>
                        <p className="text-muted-foreground font-light italic text-sm">Last updated: January 25, 2024</p>
                    </motion.div>

                    <div className="prose prose-stone dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed font-light">
                        <section>
                            <h2 className="text-2xl font-serif text-foreground font-medium mb-4 italic">1. Introduction</h2>
                            <p>Welcome to Lorean. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground font-medium mb-4 italic">2. Data We Collect</h2>
                            <p>Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>Identity Data (name, username)</li>
                                <li>Contact Data (email, phone, address)</li>
                                <li>Financial Data (payment details)</li>
                                <li>Technical Data (IP address, browser type)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground font-medium mb-4 italic">3. How We Use Your Data</h2>
                            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>To process and deliver your order.</li>
                                <li>To manage our relationship with you.</li>
                                <li>To enable you to participate in a prize draw or competition.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Privacy;
