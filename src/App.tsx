import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { SmoothScroll } from "./components/SmoothScroll";
import ErrorBoundary from "./components/ErrorBoundary";

// Providers
import { Suspense, lazy } from "react";
import { ProductsProvider } from "./context/ProductsContext";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalMarketing from "./components/GlobalMarketing";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Shop from "./pages/Shop";
// Lazy Load Heavy Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Collections = lazy(() => import("./pages/Collections"));
const About = lazy(() => import("./pages/About"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Shared Pages
const Story = lazy(() => import("./pages/Story"));
const Sustainability = lazy(() => import("./pages/Sustainability"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// Admin - Lazily Loaded
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));
const AdminProductForm = lazy(() => import("./pages/admin/ProductForm"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminShipping = lazy(() => import("./pages/admin/Shipping"));
const AdminReturns = lazy(() => import("./pages/admin/Returns"));
const AdminDiscounts = lazy(() => import("./pages/admin/Discounts"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminVendors = lazy(() => import("./pages/admin/Vendors"));
const AdminTaxes = lazy(() => import("./pages/admin/Taxes"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const AdminSupport = lazy(() => import("./pages/admin/Support"));
const AdminSupportDetail = lazy(() => import("./pages/admin/SupportDetail"));

const RitualLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lorean-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <ProductsProvider>
              <WishlistProvider>
                <CartProvider>
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <ScrollToTop />
                    <GlobalMarketing />
                    <SmoothScroll>
                      <Suspense fallback={<RitualLoader />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/my-orders" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/orders" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/customerorder" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/product/:idOrSlug" element={<ProductDetail />} />
                          <Route path="/collections" element={<Collections />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/order-success" element={<OrderSuccess />} />
                          <Route path="/track" element={<TrackOrder />} />
                          <Route path="/track/:id" element={<TrackOrder />} />

                          {/* Additional Pages */}
                          <Route path="/story" element={<Story />} />
                          <Route path="/sustainability" element={<Sustainability />} />
                          <Route path="/careers" element={<Careers />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/faq" element={<FAQ />} />
                          <Route path="/shipping" element={<Shipping />} />
                          <Route path="/returns" element={<Returns />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/terms" element={<Terms />} />

                          {/* Admin Routes - Protected */}
                          <Route
                            path="/admin"
                            element={
                              <ProtectedRoute requireAdmin={true}>
                                <AdminLayout />
                              </ProtectedRoute>
                            }
                          >
                            <Route index element={<AdminDashboard />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="products/new" element={<AdminProductForm />} />
                            <Route path="products/edit/:id" element={<AdminProductForm />} />
                            <Route path="categories" element={<AdminCategories />} />
                            <Route path="inventory" element={<AdminInventory />} />
                            <Route path="customers" element={<AdminCustomers />} />
                            <Route path="shipping" element={<AdminShipping />} />
                            <Route path="returns" element={<AdminReturns />} />
                            <Route path="discounts" element={<AdminDiscounts />} />
                            <Route path="reviews" element={<AdminReviews />} />
                            <Route path="vendors" element={<AdminVendors />} />
                            <Route path="taxes" element={<AdminTaxes />} />
                            <Route path="notifications" element={<AdminNotifications />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="marketing" element={<AdminSettings defaultTab="marketing" />} />
                            <Route path="contact" element={<AdminContactMessages />} />
                            <Route path="support" element={<AdminSupport />} />
                            <Route path="support/:id" element={<AdminSupportDetail />} />
                            <Route path="*" element={<div className="flex items-center justify-center p-20 text-muted-foreground font-serif">Admin Page Under Construction</div>} />
                          </Route>

                          {/* Catch-all */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </SmoothScroll>
                  </BrowserRouter>
                </CartProvider>
              </WishlistProvider>
            </ProductsProvider>
          </AuthProvider>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
