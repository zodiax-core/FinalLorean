import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Home, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20 overflow-hidden relative">
        {/* Background Aura */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] animate-pulse" />
        </div>

        <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <span className="text-[180px] md:text-[240px] font-serif font-black text-primary/10 tracking-tighter leading-none select-none">404</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-bounce shadow-2xl">
                  <Search className="w-12 h-12 text-primary" />
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-[-20px]"
            >
              <h1 className="text-4xl md:text-5xl font-serif mb-4 uppercase tracking-tighter">Lost in the <span className="text-primary italic">Botanical</span> Mist</h1>
              <p className="text-muted-foreground font-light text-lg text-balance max-w-md mx-auto">
                The essence you are searching for has either evaporated or was never part of our collection.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => navigate("/")}
              className="h-16 px-10 rounded-full text-lg shadow-2xl shadow-primary/20 group"
            >
              <Home className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" />
              Return to Sanctuary
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="h-16 px-10 rounded-full text-lg hover:bg-primary/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Preceding Ritual
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-6 pt-12"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Still Exploring?
              </p>
              <p className="text-xs text-muted-foreground">Join 2,400+ patrons discovering Lorean ritual.</p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
