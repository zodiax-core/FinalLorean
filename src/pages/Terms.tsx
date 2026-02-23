import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Terms = () => {
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
                        <h1 className="text-4xl md:text-5xl font-serif mb-4">Terms of <span className="text-primary italic">Service</span></h1>
                        <p className="text-muted-foreground font-light italic text-sm">Last updated: January 25, 2024</p>
                    </motion.div>

                    <div className="prose prose-stone dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed font-light">
                        <section>
                            <h2 className="text-2xl font-serif text-foreground font-medium mb-4 italic">1. Agreement to Terms</h2>
                            <p>These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity and Lorean, concerning your access to and use of our website.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground font-medium mb-4 italic">2. Intellectual Property Rights</h2>
                            <p>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site and the trademarks, service marks, and logos contained therein are owned or controlled by us or licensed to us.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground font-medium mb-4 italic">3. User Representations</h2>
                            <p>By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary.</p>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Terms;
