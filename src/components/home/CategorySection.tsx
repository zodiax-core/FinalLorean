import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductsContext";
import { Tag, Sparkles, Wind, Droplets, Leaf } from "lucide-react";

const icons = [Leaf, Droplets, Wind, Tag, Sparkles];

const CategorySection = () => {
    const { categories, loading } = useProducts();

    if (loading || categories.length === 0) return null;

    return (
        <section className="py-24 bg-card/30 border-y border-border/50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">
                        Botanical Taxonomy
                    </span>
                    <h2
                        className="text-4xl sm:text-5xl font-light mb-4"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                        Browse <span className="text-primary italic">by Category</span>
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Explore our collection organized by their specific botanical benefits
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {categories.map((category, index) => {
                        const Icon = icons[index % icons.length];
                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Link
                                    to={`/shop?category=${encodeURIComponent(category.name)}`}
                                    className="group flex flex-col items-center gap-4 p-8 rounded-[3rem] bg-background shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-border/10"
                                >
                                    <div className="w-20 h-20 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                        <Icon className="w-10 h-10" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-serif italic text-xl group-hover:text-primary transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            Explore Lineage
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
