import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { settingsService } from "@/services/supabase";

const Footer = () => {
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const isDark = resolvedTheme === "dark";
  const logoSrc = isDark ? "/logo-dark.png?v=3" : "/logo.png?v=3";

  useEffect(() => {
    const root = window.document.documentElement;
    const updateTheme = () => {
      setResolvedTheme(root.classList.contains("dark") ? "dark" : "light");
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [socialLinksData, setSocialLinksData] = useState<string[]>([]);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const configs = await settingsService.getAllConfigs();
        if (configs?.marketing?.custom_social_links) {
          setSocialLinksData(configs.marketing.custom_social_links);
        }
      } catch (err) {
        console.error("Social links fetch failed", err);
      }
    };
    fetchSocials();
  }, []);

  const footerLinks = {
    shop: [
      { name: "All Products", path: "/shop" },
      { name: "New Arrivals", path: "/shop/new" },
      { name: "Best Sellers", path: "/shop/best-sellers" },
      { name: "Gift Sets", path: "/shop/gifts" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Our Story", path: "/story" },
      { name: "Sustainability", path: "/sustainability" },
      { name: "Careers", path: "/careers" },
    ],
    support: [
      { name: "Contact Us", path: "/contact" },
      { name: "FAQ", path: "/faq" },
      { name: "Shipping", path: "/shipping" },
      { name: "Returns", path: "/returns" },
    ],
  };

  return (
    <footer className="bg-card border-t border-border/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="inline-block group">
              <img
                src={logoSrc}
                alt="Lórean Logo"
                className="h-auto w-auto max-h-12 max-w-[160px] object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </Link>
            <p className="text-muted-foreground/80 text-lg md:text-base leading-relaxed max-w-sm font-light">
              Premium herbal hair oils crafted with ancient Ayurvedic wisdom.
              Your journey to thick, healthy, and radiant hair begins here.
            </p>
            {socialLinksData && socialLinksData.length > 0 && (
              <div className="flex gap-4">
                {socialLinksData.map((url, i) => {
                  let hostname = "";
                  try {
                    const validUrl = url.startsWith('http') ? url : `https://${url}`;
                    hostname = new URL(validUrl).hostname;
                  } catch (e) { }
                  if (!hostname) return null;

                  return (
                    <motion.a key={i} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 rounded-full bg-muted/50 border border-border/10 flex items-center justify-center hover:bg-primary transition-all duration-300 group overflow-hidden">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                        alt={hostname}
                        className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-all filter grayscale group-hover:grayscale-0 group-hover:invert"
                        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                      />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Shop</h3>
            <ul className="space-y-4">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Company</h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Support</h3>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-24 pt-10 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              © {new Date().getFullYear()} Lórean.
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30 font-black">Crafted for Excellence</p>
          </div>
          <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Ritual
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Essence
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
