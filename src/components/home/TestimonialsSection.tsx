import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { settingsService } from "@/services/supabase";

const DEFAULT_TESTIMONIALS = [
  {
    id: "1",
    name: "Ayesha Khan",
    role: "Verified Buyer · Lahore",
    content: "Lórean's herbal oils have completely revived my hair. After just three weeks of consistent ritual oiling, the hair fall drastically reduced and my hair feels thicker and full of natural shine!",
    rating: 5,
  },
  {
    id: "2",
    name: "Fatima Zahra",
    role: "Verified Buyer · Karachi",
    content: "The Rosemary & Amla Oil is pure magic! It smells so soothing and herbal without feeling heavy or sticky. I have recommended it to all my friends and family.",
    rating: 5,
  },
  {
    id: "3",
    name: "Bilal Ahmed",
    role: "Verified Buyer · Islamabad",
    content: "Best scalp therapy oil I have ever used. It deeply calmed my dry scalp from the very first week and noticeably strengthened my hair roots. Truly premium authentic quality.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    settingsService.getAllConfigs().then((data) => {
      const adminTestimonials = data?.marketing?.testimonials;
      if (Array.isArray(adminTestimonials) && adminTestimonials.length > 0) {
        setTestimonials(adminTestimonials);
      }
    }).catch(() => { /* silently fall back to defaults */ });
  }, []);

  return (
    <section className="py-24 bg-card/50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">
            Testimonials
          </span>
          <h2
            className="text-4xl sm:text-5xl font-light mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Loved by <span className="text-primary italic">Thousands</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            See what our community has to say about their Lórean experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-background rounded-3xl p-8 shadow-lg border border-border/50 h-full relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote className="w-12 h-12 text-primary" />
                </div>

                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>

                  <p className="text-foreground/80 leading-relaxed mb-6 italic">
                    "{testimonial.content}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-base shrink-0 shadow-inner">
                    {testimonial.name ? testimonial.name.slice(0, 1) : "L"}
                  </div>
                  <div>
                    <p className="font-medium text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {testimonial.name}
                    </p>
                    {testimonial.role && (
                      <p className="text-xs text-muted-foreground mt-0.5">{testimonial.role}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
