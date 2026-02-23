import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Establishment into ritual was successful.",
        });

        // If email is admin, navigate to admin dashboard, else where they came from
        if (formData.email === "zodiaxcore@gmail.com") {
          navigate("/admin");
        } else {
          navigate(from, { replace: true });
        }
      } else {
        // Handle Signup
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Please check your email for the confirmation link.",
        });

        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ritual Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <Link to="/" className="inline-block mb-12">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <img src="/logo.png" alt="Lorean Logo" className="h-10 w-auto" />
              <h1 className="text-3xl font-serif uppercase tracking-tighter"></h1>
            </motion.div>
          </Link>

          {/* Header */}
          <div className="mb-10">
            <motion.h2
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-serif mb-4 leading-tight"
            >
              {isLogin ? "Welcome to the ritual" : "Begin your journey"}
            </motion.h2>
            <p className="text-muted-foreground font-light text-balance">
              {isLogin
                ? "Sign in to witness the evolution of botanical luxury."
                : "Join the Inner Circle and customize your aesthetic experience."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-2"
                >
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Universal Identity</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-14 pl-14 rounded-2xl bg-muted/20 border-border/10 focus:bg-background transition-all font-light"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Ethereal Email</Label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ritual@lorean.com"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-14 pl-14 rounded-2xl bg-muted/20 border-border/10 focus:bg-background transition-all font-light"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Access Key</Label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-14 pl-14 pr-14 rounded-2xl bg-muted/20 border-border/10 focus:bg-background transition-all font-light"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-2"
                >
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Re-authenticate Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="h-14 pl-14 rounded-2xl bg-muted/20 border-border/10 focus:bg-background transition-all font-light"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Regenerate Key?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Commence Ritual" : "Finalize Legacy"}
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-10">
            <p className="text-muted-foreground text-xs font-light">
              {isLogin ? "Not a patron yet?" : "Already part of the ritual?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-black uppercase tracking-widest hover:underline ml-2"
              >
                {isLogin ? "Claim Identity" : "Identify Self"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Luxury Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="hidden lg:flex flex-1 relative overflow-hidden bg-black"
      >
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80"
            alt="Luxury beauty"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-20 text-center w-full h-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-black/40 backdrop-blur-2xl rounded-[4rem] p-16 max-w-lg border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] space-y-8 relative overflow-hidden group"
          >
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>

            <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-serif italic text-white leading-tight">
                Exclusivity is a <br />
                <span className="text-primary font-bold not-italic">Ritual</span>
              </h3>
              <p className="text-white/70 font-light text-lg tracking-wide">
                Access the Inner Circle of Lorean, where botanical performance meets quantum luxury.
              </p>
            </div>

            <div className="pt-10 flex justify-center gap-10">
              {[
                { label: "Purity", value: "98%" },
                { label: "Patrons", value: "2.4k" },
                { label: "Status", value: "Elite" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-serif text-white">{stat.value}</span>
                  <span className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Subtle branding at bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 flex items-center gap-6"
          >
            <span className="h-px w-12 bg-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Lorean Archives</span>
            <span className="h-px w-12 bg-white" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
