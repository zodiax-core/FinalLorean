import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Leaf, Heart, Award, Users, Sparkles, Globe } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const values = [
  {
    icon: Leaf,
    title: "Natural Ingredients",
    description: "We source only the finest botanical ingredients from sustainable farms around the world.",
  },
  {
    icon: Heart,
    title: "Cruelty Free",
    description: "Never tested on animals. We believe beauty should be kind to all living beings.",
  },
  {
    icon: Award,
    title: "Quality First",
    description: "Every product undergoes rigorous testing to ensure the highest quality standards.",
  },
  {
    icon: Globe,
    title: "Eco-Conscious",
    description: "Sustainable packaging and carbon-neutral shipping for a better planet.",
  },
];

const stats = [
  { value: "50K+", label: "Happy Customers" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "100%", label: "Natural Ingredients" },
  { value: "15+", label: "Years Experience" },
];

const team = [
  {
    name: "Elena Rosetti",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  },
  {
    name: "Sophie Chen",
    role: "Head of Product",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  },
  {
    name: "Maya Johnson",
    role: "Lead Researcher",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  },
];

const About = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1615485290382-441e4d019cb5?w=1920&q=80"
            alt="About Lorean Herbal Oil"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Our Story
            </span>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-light mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Hair Care Born from
              <br />
              <span className="text-primary italic">Nature's Wisdom</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Founded with a passion for ancient wellness, Lorean was born from a simple belief:
              that true hair vitality comes from embracing nature's gifts. We create luxury
              herbal hair oils that honor both your hair and our planet.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">
                Our Mission
              </span>
              <h2
                className="text-3xl sm:text-4xl font-light mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Empowering Your <span className="text-primary italic">Hair Vitality</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                At Lorean, we believe that hair care is more than just maintenance—it's a
                ritual of self-care, a moment of connection with your roots. Our mission
                is to create oils that not only transform your hair but also
                nurture your scalp.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every formula is meticulously crafted by our team of experts, combining
                ancient Ayurvedic botanical wisdom with modern extraction techniques. The result?
                Oils that deliver visible growth and strength while being 100% gentle
                and kind to our planet.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"
                  alt="Premium Herbal Oil"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 glass rounded-2xl p-6 shadow-xl border border-border/50">
                <p className="text-3xl font-light text-primary mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  15+
                </p>
                <p className="text-sm text-muted-foreground">Years of Excellence</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">
              What We Stand For
            </span>
            <h2
              className="text-3xl sm:text-4xl font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Our <span className="text-primary italic">Values</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center p-8 rounded-3xl bg-card border border-border/50 shadow-lg"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
                >
                  <value.icon className="w-8 h-8 text-primary" />
                </motion.div>
                <h3
                  className="text-xl font-medium mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 gradient-rose">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p
                  className="text-4xl sm:text-5xl font-light text-primary mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">
              The People Behind Lorean
            </span>
            <h2
              className="text-3xl sm:text-4xl font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Meet Our <span className="text-primary italic">Team</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                <h3
                  className="text-xl font-medium mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {member.name}
                </h3>
                <p className="text-muted-foreground text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
