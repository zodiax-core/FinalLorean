import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { marketingService } from "@/services/supabase";
import { emailService } from "@/services/email";
import { useToast } from "@/components/ui/use-toast";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      await marketingService.subscribe(email);

      // Send welcome email via EmailJS (optional but recommended for "proper backend")
      try {
        await emailService.sendWelcomeEmail(email);
      } catch (emailError) {
        console.warn("Welcome email could not be sent, but subscription was successful:", emailError);
      }

      setIsSubscribed(true);
      toast({
        title: "Welcome to the Inner Circle",
        description: "You've successfully subscribed to our newsletter."
      });
      setEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: error.message || "Something went wrong."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-rose opacity-30" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-[3rem] p-12 md:p-16 text-center border border-border/50 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>

          <h2
            className="text-3xl sm:text-4xl font-light mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Join Our <span className="text-primary italic">Inner Circle</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Subscribe to receive exclusive offers, hair wellness tips, and be the
            first to know about new product launches.
          </p>

          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-medium mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                You have subscribed
              </p>
              <p className="text-muted-foreground">
                Welcome to the inner circle. The botanical secrets will find you soon.
              </p>
            </motion.div>
          ) : (
            <>
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-14 rounded-full px-6 bg-background/80 border-border/50 focus:border-primary"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground group"
                >
                  {submitting ? "Subscribing..." : "Join Ritual"}
                  <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-4">
                No spam, unsubscribe anytime. We respect your privacy.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
