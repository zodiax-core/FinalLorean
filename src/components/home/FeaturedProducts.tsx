import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Product } from "@/services/supabase";

import { useProducts } from "@/context/ProductsContext";

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-3xl bg-card shadow-lg">
        {/* Image */}
        <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
          />

          {/* Tag */}
          {product.tag && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-primary-foreground text-[10px] font-bold uppercase tracking-widest z-10">
              {product.tag}
            </div>
          )}

          {/* Quick actions overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent flex items-end justify-center pb-6"
          >
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  addToWishlist(product);
                }}
                className={`w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors ${isWishlisted ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground"
                  }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </Link>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
          <Link to={`/product/${product.id}`}>
            <h3
              className="text-lg font-medium mb-3 group-hover:text-primary transition-colors cursor-pointer"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between mt-auto">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/60">{product.category}</p>
            <p className="text-xl font-serif font-bold text-primary">Rs. {product.price}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedProducts = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 4);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <section ref={containerRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
        style={{
          y,
          background: `radial-gradient(circle, hsl(var(--rose-light)) 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">
            Curated For You
          </span>
          <h2
            className="text-4xl sm:text-5xl font-light mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Featured <span className="text-primary italic">Collection</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover our handpicked selection of luxury botanical essences
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            asChild
          >
            <Link to="/shop">View All Products</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
