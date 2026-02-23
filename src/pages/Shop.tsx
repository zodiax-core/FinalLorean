import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, Grid3X3, LayoutList, Heart, ShoppingBag, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const category = searchParams.get("category") || "All";
    setSelectedCategory(category);
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  const { products, categories: dbCategories, loading } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  const categories = useMemo(() => ["All", ...dbCategories.map(c => c.name)], [dbCategories]);

  const filteredProducts = selectedCategory === "All"
    ? (products || [])
    : (products || []).filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-light mb-4 text-balance"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Shop <span className="text-primary italic">Collection</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-balance">
              Discover our curated selection of luxury herbal hair oils
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="py-6 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} products
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="featured">
                <SelectTrigger className="w-40 rounded-full bg-card">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Best Rating</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden sm:flex items-center gap-1 bg-muted rounded-full p-1 border border-border/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-full transition-colors ${viewMode === "grid" ? "bg-background shadow-inner text-primary" : "text-muted-foreground"
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-full transition-colors ${viewMode === "list" ? "bg-background shadow-inner text-primary" : "text-muted-foreground"
                    }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 min-h-[500px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-muted-foreground font-serif text-xl italic animate-pulse">Unveiling our luxury collection...</p>
            </div>
          ) : (
            <div className={`grid gap-8 ${viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
              }`}>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                  className={`group ${viewMode === "list" ? "flex gap-8 items-center bg-card p-6 rounded-[2rem] border border-border/50 hover:shadow-xl transition-all" : ""}`}
                >
                  <Link to={`/product/${product.id}`} className={`block relative overflow-hidden rounded-[2.5rem] bg-card shadow-lg flex-shrink-0 border border-border/30 ${viewMode === "list" ? "w-64" : ""}`}>
                    <div className={`relative overflow-hidden ${viewMode === "list" ? "aspect-square" : "aspect-[4/5]"}`}>
                      <motion.img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.8 }}
                      />
                      {product.tag && (
                        <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground text-[10px] font-bold uppercase tracking-widest z-10">
                          {product.tag}
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end justify-center pb-8 z-20"
                      >
                        <div className="flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center shadow-xl transition-all duration-300 ${isInWishlist(product.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-background/95 hover:bg-primary hover:text-primary-foreground"
                              }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToWishlist(product);
                            }}
                          >
                            <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:shadow-primary/30 transition-all duration-300"
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(product, 1);
                            }}
                          >
                            <ShoppingBag className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </Link>
                  <div className={`${viewMode === "list" ? "flex-1" : "p-6"}`}>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                      ))}
                      <span className="text-xs font-bold text-muted-foreground ml-1">({product.reviews})</span>
                    </div>
                    <Link to={`/product/${product.id}`}>
                      <h3
                        className="text-xl font-medium mb-3 group-hover:text-primary transition-colors line-clamp-1"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground/60">{product.category}</p>
                      <p className="text-2xl font-serif font-bold text-primary">Rs. {product.price}</p>
                    </div>
                    {viewMode === "list" && product.description && (
                      <p className="mt-4 text-muted-foreground line-clamp-2 text-sm font-light leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;
