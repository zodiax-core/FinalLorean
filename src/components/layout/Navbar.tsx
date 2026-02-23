import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingBag, Heart, Search, Menu, X, User,
  ChevronRight, LayoutDashboard, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchDrawer from "@/components/shop/SearchDrawer";
import WishlistDrawer from "@/components/shop/WishlistDrawer";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const location = useLocation();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Collections", path: "/collections" },
    { name: "About", path: "/about" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled
          ? "glass"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.img
                src="/logo.png"
                alt="Lorean Logo"
                className="h-10 md:h-14 w-auto object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path}>
                  <motion.span
                    className={`text-xs font-black uppercase tracking-[0.2em] transition-all relative ${location.pathname === link.path
                      ? "text-primary"
                      : "text-foreground/60 hover:text-primary"
                      }`}
                  >
                    {link.name}
                    {location.pathname === link.path && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </motion.span>
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsWishlistOpen(true)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors hidden sm:block relative"
              >
                <Heart className="w-5 h-5" />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-black rounded-full flex items-center justify-center shadow-lg border border-background"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-black rounded-full flex items-center justify-center shadow-lg border border-background"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <div className="hidden md:block">
                {!user ? (
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 px-6"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ritual Login</span>
                    </Button>
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full gap-3 text-foreground hover:bg-primary/5 px-4 pr-2 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest max-w-[80px] truncate">
                          {user.user_metadata?.full_name?.split(' ')[0] || "Patron"}
                        </span>
                        <ChevronRight className="w-3 h-3 rotate-90 opacity-40" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 mt-2 shadow-2xl border-border/10">
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-4 py-3">
                        Patron Account
                      </DropdownMenuLabel>
                      <Link to="/dashboard">
                        <DropdownMenuItem className="rounded-xl gap-3 py-3 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold font-serif italic">My Rituals</span>
                        </DropdownMenuItem>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin">
                          <DropdownMenuItem className="rounded-xl gap-3 py-3 cursor-pointer bg-primary/5 text-primary">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Admin Portal</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      <DropdownMenuSeparator className="opacity-10" />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="rounded-xl gap-3 py-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">End Session</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 md:hidden text-foreground/70"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="fixed inset-0 z-50 bg-background/98 backdrop-blur-2xl md:hidden flex flex-col"
          >
            <div className="p-8 flex justify-between items-center border-b border-border/50">
              <img src="/logo.png" alt="Lorean Logo" className="h-10 w-auto" />
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <nav className="flex-1 flex flex-col justify-center items-center gap-12 p-8">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-4xl font-serif hover:text-primary transition-colors uppercase tracking-tighter"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="p-12 border-t border-border/50 text-center">
              {!user ? (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-16 rounded-full text-lg uppercase font-black tracking-widest shadow-xl shadow-primary/20">
                    Sign Into Ritual
                  </Button>
                </Link>
              ) : (
                <div className="space-y-4">
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-16 rounded-full text-lg uppercase font-black tracking-widest border-2">
                      My Rituals
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full h-12 text-destructive font-black uppercase tracking-widest"
                  >
                    End Session
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers */}
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
