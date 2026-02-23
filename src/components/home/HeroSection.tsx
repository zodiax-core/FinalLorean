import { motion } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden gradient-soft"
    >
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle, hsl(var(--rose-light)) 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 min-h-screen flex items-center"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Collection 2024</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-light leading-tight mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Roots of
              <br />
              <span className="text-primary font-medium italic">
                Ancient Wisdom
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 mb-8"
            >
              Discover the power of traditional Ayurveda. Premium herbal hair oils
              crafted with 100% natural ingredients for radiant, healthy hair.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-base"
                asChild
              >
                <Link to="/shop">
                  Shop Collection
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 rounded-full text-base border-foreground/20 hover:bg-foreground/5"
                asChild
              >
                <Link to="/story">Our Story</Link>
              </Button>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] max-w-lg mx-auto">
              {/* Decorative background */}
              <div className="absolute inset-0 rounded-[3rem] gradient-rose opacity-50 blur-3xl transform rotate-6" />

              {/* Main image container */}
              <motion.div
                className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"
                  alt="Premium Herbal Hair Oil"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </motion.div>

              {/* Floating product card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-6 -left-6 z-20 glass rounded-2xl p-4 shadow-xl border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Best Seller</p>
                    <p className="text-xs text-muted-foreground">Amla Growth Oil</p>
                  </div>
                </div>
              </motion.div>


              {/* Stats card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="absolute -top-4 -right-4 z-20 glass rounded-2xl p-4 shadow-xl border border-border/50"
              >
                <p className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  <span className="text-primary">98%</span>
                </p>
                <p className="text-xs text-muted-foreground">Customer Love</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>


      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-3 rounded-full bg-primary" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
