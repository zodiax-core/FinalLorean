import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { SmoothScroll } from "./components/SmoothScroll";
import ErrorBoundary from "./components/ErrorBoundary";

// Providers
import { ProductsProvider } from "./context/ProductsContext";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalMarketing from "./components/GlobalMarketing";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Shop from "./pages/Shop";
import Dashboard from "./pages/Dashboard";
import Collections from "./pages/Collections";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";

// Shared Pages
import Story from "./pages/Story";
import Sustainability from "./pages/Sustainability";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Admin
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminInventory from "./pages/admin/Inventory";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminOrders from "./pages/admin/Orders";
import AdminCategories from "./pages/admin/Categories";
import AdminCustomers from "./pages/admin/Customers";
import AdminShipping from "./pages/admin/Shipping";
import AdminReturns from "./pages/admin/Returns";
import AdminDiscounts from "./pages/admin/Discounts";
import AdminReviews from "./pages/admin/Reviews";
import AdminVendors from "./pages/admin/Vendors";
import AdminTaxes from "./pages/admin/Taxes";
import AdminNotifications from "./pages/admin/Notifications";
import AdminSettings from "./pages/admin/Settings";
import AdminSupport from "./pages/admin/Support";
import AdminSupportDetail from "./pages/admin/SupportDetail";

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
                    <GlobalMarketing />
                    <SmoothScroll>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/product/:id" element={<ProductDetail />} />
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
                          <Route path="support" element={<AdminSupport />} />
                          <Route path="support/:id" element={<AdminSupportDetail />} />
                          <Route path="*" element={<div className="flex items-center justify-center p-20 text-muted-foreground font-serif">Admin Page Under Construction</div>} />
                        </Route>

                        {/* Catch-all */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
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
