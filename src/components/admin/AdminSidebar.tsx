import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { notificationService } from "@/services/supabase";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    List,
    Archive,
    Users,
    CreditCard,
    Truck,
    RotateCcw,
    Tag,
    Megaphone,
    Star,
    Store,
    Receipt,
    Bell,
    Settings,
    LifeBuoy,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export const menuItems = [
    { icon: Store, label: "View Website", path: "/" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: List, label: "Categories", path: "/admin/categories" },
    { icon: Archive, label: "Inventory", path: "/admin/inventory" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Truck, label: "Shipping", path: "/admin/shipping" },
    { icon: RotateCcw, label: "Returns & Refunds", path: "/admin/returns" },
    { icon: Tag, label: "Discounts / Coupons", path: "/admin/discounts" },
    { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
    { icon: Star, label: "Reviews & Ratings", path: "/admin/reviews" },
    { icon: Store, label: "Vendors / Sellers", path: "/admin/vendors" },
    { icon: Receipt, label: "Taxes", path: "/admin/taxes" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
    { icon: LifeBuoy, label: "Support / Tickets", path: "/admin/support" },
];

interface AdminSidebarProps {
    className?: string;
}

export const AdminSidebar = ({ className = "" }: AdminSidebarProps) => {
    const location = useLocation();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await notificationService.getStats(user?.id);
                setUnreadCount(stats.unread);
            } catch (error) {
                console.error("Sidebar stats fetch error:", error);
            }
        };

        if (user) {
            fetchStats();
            const channel = notificationService.subscribeToNotifications(user.id, () => {
                fetchStats();
            });
            return () => {
                notificationService.unsubscribe(channel);
            };
        }
    }, [user]);

    return (
        <aside className={cn(
            "w-72 h-screen sticky top-0 bg-card border-r border-border overflow-y-auto overflow-x-hidden scroll-smooth",
            "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40",
            className
        )} style={{ scrollbarWidth: 'thin' }}>
            <div className="p-8 pb-4">
                <Link to="/admin" className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="Lorean Logo"
                        className="h-6 w-auto object-contain dark:invert"
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Portal</span>
                </Link>
            </div>

            <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn(
                                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-primary-foreground" : "text-primary"
                                )} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                            {item.label === "Notifications" && unreadCount > 0 && (
                                <span className={cn(
                                    "flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1.5",
                                    isActive
                                        ? "bg-white text-primary"
                                        : "bg-primary text-white"
                                )}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                            {isActive && !unreadCount && (
                                <ChevronRight className="w-4 h-4 text-primary-foreground/50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 p-6 mx-4 mb-8 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Pro Tip</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Check the "Marketing" tab to manage your active campaigns.
                </p>
            </div>
        </aside>
    );
};
