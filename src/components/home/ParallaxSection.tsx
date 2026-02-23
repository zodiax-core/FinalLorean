import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Leaf, Droplets, Sun, Heart } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Pure botanical ingredients sourced from organic farms",
  },
  {
    icon: Droplets,
    title: "Deep Hydration",
    description: "Advanced formulas that lock in moisture for 48 hours",
  },
  {
    icon: Sun,
    title: "UV Protection",
    description: "Shield your skin from harmful rays naturally",
  },
  {
    icon: Heart,
    title: "Cruelty Free",
    description: "Never tested on animals, always tested on kindness",
  },
];

const ParallaxSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden py-24"
    >
      {/* Parallax Background */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 gradient-rose opacity-40" />
        <img
          src="https://images.unsplash.com/photo-1617092223126-a2d555d31525?w=1920&q=80"
          alt="Natural Herbal Ingredients"
          className="w-full h-[120%] object-cover opacity-30"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block"
          >
            Why Choose Us
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-light mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Nature's <span className="text-primary italic">Healing Touch</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            We believe in the power of ancient Ayurvedic wisdom to transform your hair.
            Our oils are cold-pressed and infused with the finest handpicked herbs.
          </motion.p>
        </div>


        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="glass rounded-3xl p-8 text-center border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
                >
                  <feature.icon className="w-8 h-8 text-primary" />
                </motion.div>
                <h3
                  className="text-xl font-medium mb-3 group-hover:text-primary transition-colors"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-primary/20 blur-xl"
      />
    </section>
  );
};

export default ParallaxSection;
