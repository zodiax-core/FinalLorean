import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { cartItems, removeFromCart, updateQuantity, subtotal, itemCount } = useCart();
  const navigate = useNavigate();

  const shippingThreshold = 150;
  const shipping = subtotal > shippingThreshold ? 0 : 15;
  const total = subtotal + shipping;

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
            className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md md:max-w-lg z-[70] bg-background shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 md:p-8 border-b border-border/50">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h2
                    className="text-lg md:text-2xl font-serif uppercase tracking-tight"
                  >
                    Your <span className="text-primary italic">Selection</span>
                  </h2>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {itemCount} botanical items
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>

            {/* Progress Banner */}
            {subtotal > 0 && subtotal < shippingThreshold && (
              <div className="mx-5 md:mx-8 mt-4 md:mt-6 p-3 md:p-4 rounded-2xl md:rounded-3xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] md:text-xs text-center mb-2 md:mb-3">
                  Add <span className="font-bold text-primary">Rs. {(shippingThreshold - subtotal).toFixed(0)}</span> more for <span className="font-serif italic font-bold">Complimentary Shipping</span>
                </p>
                <div className="h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(subtotal / shippingThreshold) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 md:space-y-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30" />
                  </div>
                  <h3
                    className="text-xl md:text-2xl font-serif italic"
                  >
                    Empty Ritual
                  </h3>
                  <p className="text-muted-foreground text-xs md:text-sm font-light max-w-[180px] md:max-w-[200px] mx-auto">
                    Your collection is currently empty. Begin your journey in our shop.
                  </p>
                  <Button onClick={onClose} className="rounded-full px-8 h-10 md:h-12 bg-primary text-xs md:text-sm">
                    Explore Collection
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 md:gap-6 p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-card border border-border/50 shadow-sm relative group overflow-hidden"
                    >
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4
                            className="font-serif text-sm md:text-lg leading-tight truncate"
                          >
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 md:mt-4">
                          <div className="flex items-center gap-3 md:gap-4 bg-background px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-border/50 scale-90 md:scale-100 origin-left">
                            <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-primary"><Minus className="w-2.5 h-2.5 md:w-3 md:h-3" /></button>
                            <span className="text-[10px] md:text-xs font-bold w-3 md:w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-primary"><Plus className="w-2.5 h-2.5 md:w-3 md:h-3" /></button>
                          </div>
                          <span className="font-serif font-bold text-sm md:text-lg">
                            Rs. {(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 md:p-8 border-t border-border/50 space-y-4 md:space-y-6 bg-card/10 backdrop-blur-xl">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between text-[10px] md:text-xs font-medium text-muted-foreground">
                    <span>Essence Subtotal</span>
                    <span>Rs. {subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] md:text-xs font-medium text-muted-foreground">
                    <span>Shipping Logistics</span>
                    <span className={shipping === 0 ? "text-primary font-bold" : ""}>{shipping === 0 ? "Complimentary" : `Rs. ${shipping.toFixed(0)}`}</span>
                  </div>
                  <Separator className="my-1 md:my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-base md:text-lg font-serif italic">Total Ritual</span>
                    <span className="text-xl md:text-3xl font-serif font-bold text-primary">Rs. {total.toFixed(0)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    onClose();
                    navigate("/checkout");
                  }}
                  className="w-full h-12 md:h-16 rounded-2xl md:rounded-3xl bg-primary hover:bg-primary/90 text-sm md:text-lg group transition-all shadow-2xl shadow-primary/20"
                >
                  Complete Selection
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Separator = ({ className }: { className?: string }) => (
  <div className={`h-px bg-border/50 ${className}`} />
);

export default CartDrawer;
