import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { useProducts } from "@/context/ProductsContext";

const GRADIENT_COLORS = [
  "from-amber-200/50 to-orange-100/50",
  "from-emerald-200/50 to-teal-100/50",
  "from-yellow-200/50 to-amber-100/50",
  "from-stone-200/50 to-orange-100/50",
  "from-rose-200/50 to-pink-100/50",
  "from-amber-700/30 to-stone-800/40",
];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&q=80",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80",
  "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&q=80",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80",
];

const Collections = () => {
  const { categories, products, loading } = useProducts();

  const collections = useMemo(() => {
    return categories.map((cat, idx) => {
      const catProducts = products.filter(
        p => p.category?.toLowerCase() === cat.name.toLowerCase()
      );
      const productCount = catProducts.length;
      const image = cat.image || catProducts.find(p => p.image)?.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
      const description = cat.description || `Handcrafted botanical blends for our signature ${cat.name} line.`;

      return {
        id: cat.id || idx,
        name: cat.name,
        description,
        image,
        productCount,
        color: GRADIENT_COLORS[idx % GRADIENT_COLORS.length],
      };
    });
  }, [categories, products]);

  // Featured Collection: category with most products, or the first one
  const featuredCollection = useMemo(() => {
    if (collections.length === 0) return null;
    return [...collections].sort((a, b) => b.productCount - a.productCount)[0];
  }, [collections]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Collections"
        description="Curated herbal oil sets designed for your unique hair wellness journey. Discover the power of ancient Ayurvedic wisdom."
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-light mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Our <span className="text-primary italic">Collections</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Curated herbal oil rituals organized by botanical benefits and formulations
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Collection */}
      {featuredCollection && (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-border/20"
            >
              <div className="absolute inset-0">
                <img
                  src={featuredCollection.image}
                  alt={featuredCollection.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
              </div>
              <div className="relative z-10 p-8 sm:p-12 md:p-16 lg:p-20 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Collection
                </span>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-light mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {featuredCollection.name}
                </h2>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base leading-relaxed">
                  {featuredCollection.description}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-primary/80 mb-8 uppercase tracking-widest">
                  {featuredCollection.productCount} {featuredCollection.productCount === 1 ? "Product" : "Products"} Available
                </p>
                <Link to={`/shop?category=${encodeURIComponent(featuredCollection.name)}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all group"
                  >
                    Explore Collection
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Collections Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary block mb-2">
              Botanical Taxonomy
            </span>
            <h2
              className="text-3xl sm:text-4xl font-light mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              All <span className="text-primary italic">Collections</span>
            </h2>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-muted/30 animate-pulse border border-border/20" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">No collections available currently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                >
                  <Link to={`/shop?category=${encodeURIComponent(collection.name)}`}>
                    <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] border border-border/20 shadow-md group-hover:shadow-2xl transition-all duration-500">
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${collection.color} opacity-40`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <span className="text-xs text-primary font-black uppercase tracking-widest mb-2">
                          {collection.productCount} {collection.productCount === 1 ? "Product" : "Products"}
                        </span>
                        <h3
                          className="text-2xl md:text-3xl font-medium mb-2 group-hover:text-primary transition-colors"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {collection.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
                          {collection.description}
                        </p>
                        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                          <span>View Lineage</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Collections;
