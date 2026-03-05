import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { emailService } from "@/services/email";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await emailService.sendContactForm(formData);
            setSubmitted(true);
            toast({
                title: "Message Summoned",
                description: "Your inquiry has been relayed to our care team."
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Ritual Interrupted",
                description: error.message || "Something went wrong. Please try again later."
            });
        } finally {
            setSubmitting(false);
        }
    };

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
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Contact <span className="text-primary italic">Us</span></h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                            We'd love to hear from you. Whether you have a question about our products, orders, or simply want to say hello.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div className="flex gap-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-1">Email Us</h3>
                                    <p className="text-muted-foreground">hello@lorean.com</p>
                                    <p className="text-muted-foreground">care@lorean.com</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                    <Phone className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-1">Call Us</h3>
                                    <p className="text-muted-foreground">+92 325 7978051</p>
                                    <p className="text-muted-foreground">Mon - Fri, 9am - 6pm</p>
                                </div>
                            </div>
                            {/* <div className="flex gap-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-1">Visit Us</h3>
                                    <p className="text-muted-foreground">12 bis Place Royale</p>
                                    <p className="text-muted-foreground">75001 Paris, France</p>
                                </div>
                            </div> */}
                        </motion.div>

                        {/* Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card p-10 rounded-3xl border border-border/50 shadow-sm"
                        >
                            {submitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-serif italic mb-4">Message Manifested</h3>
                                    <p className="text-muted-foreground mb-8">
                                        Our care team has received your message. We shall respond as soon as the botanical spirits guide us.
                                    </p>
                                    <Button
                                        onClick={() => setSubmitted(false)}
                                        variant="outline"
                                        className="rounded-full px-8"
                                    >
                                        Send Another
                                    </Button>
                                </motion.div>
                            ) : (
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Full Name</label>
                                            <Input
                                                required
                                                placeholder="Jane Doe"
                                                className="rounded-xl h-12"
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Email Address</label>
                                            <Input
                                                required
                                                placeholder="jane@example.com"
                                                type="email"
                                                className="rounded-xl h-12"
                                                value={formData.email}
                                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Subject</label>
                                        <Input
                                            required
                                            placeholder="How can we help?"
                                            className="rounded-xl h-12"
                                            value={formData.subject}
                                            onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Message</label>
                                        <Textarea
                                            required
                                            placeholder="Share your thoughts..."
                                            className="rounded-xl min-h-[150px]"
                                            value={formData.message}
                                            onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-14 rounded-xl text-lg group bg-primary hover:bg-primary/90"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Manifesting...
                                            </>
                                        ) : (
                                            <>
                                                Send Message
                                                <MessageSquare className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Contact;
