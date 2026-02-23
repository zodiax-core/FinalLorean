import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const collections = [
  {
    id: 1,
    name: "Growth Elixirs",
    description: "Traditional Ayurvedic formulas for stimulating hair follicles and boosting density",
    image: "https://images.unsplash.com/photo-1626015568117-6490696b9909?w=800&q=80",
    productCount: 8,
    color: "from-amber-200/50 to-orange-100/50",
  },
  {
    id: 2,
    name: "Scalp Therapy",
    description: "Cooling and purifying oils for a balanced, flake-free scalp environment",
    image: "https://images.unsplash.com/photo-1615485500704-8e990f3900f7?w=800&q=80",
    productCount: 6,
    color: "from-green-200/50 to-emerald-100/50",
  },
  {
    id: 3,
    name: "Nourishing Rituals",
    description: "Deep conditioning blends that restore shine and manageability to dry hair",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
    productCount: 12,
    color: "from-yellow-200/50 to-amber-100/50",
  },
  {
    id: 4,
    name: "Ancient Strengths",
    description: "Time-tested herbal infusions to prevent breakage and split ends",
    image: "https://images.unsplash.com/photo-1600880292203-75edcbbeaeb1?w=800&q=80",
    productCount: 5,
    color: "from-stone-200/50 to-orange-100/50",
  },
  {
    id: 5,
    name: "Luminous Luster",
    description: "Lightweight finishing serums for instant silkiness and radiant glow",
    image: "https://images.unsplash.com/photo-1616160976258-f79116c11d7c?w=800&q=80",
    productCount: 7,
    color: "from-rose-200/50 to-pink-100/50",
  },
  {
    id: 6,
    name: "Traditional Roots",
    description: "Pure, single-origin oils for comprehensive hair wellness",
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80",
    productCount: 9,
    color: "from-brown-200/50 to-stone-100/50",
  },
];

const featuredCollection = {
  name: "Himalayan Harvest 2024",
  description: "Experience the purity of our limited-batch oils, cold-pressed from herbs harvested at high altitudes for maximum potency.",
  image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80",
  productCount: 15,
};

const Collections = () => {
  return (
    <div className="min-h-screen bg-background">
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
              Curated herbal oil sets designed for your unique hair wellness journey
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] overflow-hidden"
          >
            <div className="absolute inset-0">
              <img
                src={featuredCollection.image}
                alt={featuredCollection.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            </div>
            <div className="relative z-10 p-12 md:p-16 lg:p-20 max-w-xl">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                Featured Collection
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-light mb-4"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {featuredCollection.name}
              </h2>
              <p className="text-muted-foreground mb-6">
                {featuredCollection.description}
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                {featuredCollection.productCount} products
              </p>
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium group"
                >
                  Explore Collection
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl font-light mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              All <span className="text-primary italic">Collections</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <Link to="/shop">
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/5]">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${collection.color} opacity-60`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <span className="text-sm text-primary font-medium mb-2">
                        {collection.productCount} products
                      </span>
                      <h3
                        className="text-2xl font-medium mb-2 group-hover:text-primary transition-colors"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                      <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-4 transition-all">
                        <span>Shop Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Collections;
