import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WishlistDrawer = ({ isOpen, onClose }: WishlistDrawerProps) => {
  const { wishlistItems, removeFromWishlist, itemCount } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-[70] bg-background shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-8 border-b border-border/50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-serif uppercase tracking-tight"
                  >
                    Your <span className="text-primary italic">Favorites</span>
                  </h2>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {itemCount} botanical saved
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              {wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/30" />
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-serif italic"
                  >
                    Pure Potential
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm font-light max-w-[200px] mx-auto">
                    No items saved yet. Explore our botanical rituals to find your match.
                  </p>
                  <Button onClick={onClose} className="rounded-full px-8 h-12 bg-primary">
                    Begin Journey
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {wishlistItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 sm:gap-6 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-card border border-border/50 shadow-sm relative group overflow-hidden"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                          <h4
                            className="font-serif text-base sm:text-lg leading-tight truncate"
                          >
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 sm:mt-4">
                          <span className="font-serif font-bold text-base sm:text-lg">
                            ${(item.price || 0).toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="rounded-full h-9 sm:h-10 px-4 sm:px-6 bg-primary hover:bg-primary/90 text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                          >
                            <ShoppingBag className="w-3 h-3 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {wishlistItems.length > 0 && (
              <div className="p-4 sm:p-8 border-t border-border/50 space-y-4 sm:space-y-6 bg-card/10 backdrop-blur-xl">
                <p className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Your luxury collection grows.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
