import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, TrendingUp, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/context/ProductsContext";

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDrawer = ({ isOpen, onClose }: SearchDrawerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { products, categories } = useProducts();

  const trendingSearches = useMemo(() => {
    return categories.length > 0
      ? categories.map(c => c.name).slice(0, 5)
      : ["Hair Growth", "Nourishment", "Scalp Care", "Amla Oil", "Rosemary"];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
    ).slice(0, 6);
  }, [searchQuery, products]);

  const popularProducts = products.slice(0, 3);

  const handleProductClick = (id: number) => {
    onClose();
    navigate(`/product/${id}`);
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
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background shadow-2xl rounded-b-[2.5rem] max-h-[80vh] overflow-hidden"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for botanical magic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-16 pl-14 pr-6 rounded-[2rem] bg-muted/50 border-0 text-xl focus-visible:ring-primary font-serif italic"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Trending Searches */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Trending</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {trendingSearches.map((search) => (
                    <motion.button
                      key={search}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchQuery(search)}
                      className="px-6 py-2.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all text-sm font-medium"
                    >
                      {search}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="overflow-y-auto max-h-[40vh] custom-scrollbar pr-2">
                {searchQuery.trim() ? (
                  <div>
                    <h2 className="text-2xl font-serif mb-6 flex items-center justify-between">
                      Search <span className="text-primary italic">Results</span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{filteredProducts.length} items</span>
                    </h2>
                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center gap-6 p-5 rounded-[2rem] bg-card hover:bg-card-foreground/5 cursor-pointer transition-all border border-border/50 group"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-lg truncate group-hover:text-primary transition-colors">{product.name}</p>
                              <p className="text-primary font-bold">${product.price}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-muted-foreground font-serif italic text-xl">No essences found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-serif mb-6">Popular <span className="text-primary italic">Essentials</span></h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {popularProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleProductClick(product.id)}
                          className="flex items-center gap-6 p-5 rounded-[2rem] bg-card hover:bg-card-foreground/5 cursor-pointer transition-all border border-border/50 group"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                          />
                          <div>
                            <p className="font-serif text-lg group-hover:text-primary transition-colors">{product.name}</p>
                            <p className="text-primary font-bold">${product.price}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchDrawer;
