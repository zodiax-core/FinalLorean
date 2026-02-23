import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const Careers = () => {
    const jobs = [
        { title: "Senior Product Designer", type: "Full-time", location: "Himalayas / Remote" },
        { title: "Ayurvedic Research Scientist", type: "Full-time", location: "Kerala, India" },
        { title: "Regional Marketing Manager", type: "Full-time", location: "New York, USA" },
        { title: "Herbal Content Strategist", type: "Contract", location: "London / Remote" },
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
                        <h1 className="text-4xl md:text-6xl font-serif mb-6">Join the <span className="text-primary italic">Movement</span></h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                            We are always looking for passionate individuals who believe in the power of clean, luxury beauty.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {jobs.map((job, i) => (
                            <motion.div
                                key={job.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-8 rounded-3xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-lg transition-all"
                            >
                                <div>
                                    <h3 className="text-2xl font-serif mb-1">{job.title}</h3>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <span>{job.type}</span>
                                        <span>•</span>
                                        <span>{job.location}</span>
                                    </div>
                                </div>
                                <Button className="rounded-full px-8">Apply Now</Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Careers;
