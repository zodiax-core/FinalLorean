import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
    const faqs = [
        { q: "How often should I use the hair oils?", a: "For best results, we recommend using our oils 2-3 times a week. Apply to the scalp and hair lengths, leave for at least 2 hours or overnight, and wash with a gentle shampoo." },
        { q: "Are your oils suitable for colored or chemically treated hair?", a: "Yes, our oils are 100% natural and free from harsh chemicals, making them safe and highly beneficial for color-treated or chemically processed hair." },
        { q: "Will the oil make my hair feel greasy?", a: "Our oils are designed to be used as a pre-wash treatment or as a very light finishing serum. When used as a treatment and washed out, they leave no greasy residue, only soft and nourished hair." },
        { q: "Do you test on animals?", a: "Never. We are proudly cruelty-free and committed to ethical practices across our entire supply chain." },
        { q: "When will my order arrive?", a: "Standard shipping typically takes 3-5 business days. Express shipping options are available at checkout for 1-2 business day delivery." },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-32 pb-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Frequently Asked <span className="text-primary italic">Questions</span></h1>
                        <p className="text-lg text-muted-foreground font-light">
                            Everything you need to know about our products and services.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/50 py-2">
                                    <AccordionTrigger className="text-left text-lg font-medium hover:text-primary transition-colors">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-lg font-light leading-relaxed pt-2 pb-6">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default FAQ;
