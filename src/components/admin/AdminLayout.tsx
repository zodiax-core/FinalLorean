import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, Bell, Search, User, Clock, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import { useTheme } from "../theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { notificationService } from "@/services/supabase";
import { requestNotificationPermission } from "@/lib/firebase";
import { toast as sonnerToast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme, setTheme, isAutoSchedule, setIsAutoSchedule } = useTheme();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await notificationService.getStats(user?.id);
                setUnreadCount(stats.unread);
            } catch (error) {
                console.error("Stats fetch error:", error);
            }
        };

        if (user) {
            fetchStats();

            // Request FCM & Browser Notification permission
            requestNotificationPermission(user.id).catch(err => {
                console.error("FCM Setup Failed:", err);
            });

            const channel = notificationService.subscribeToNotifications(user.id, (payload: any) => {
                fetchStats();

                // Show in-app notification & Desktop notification
                if (payload.new) {
                    // In-app Sonner
                    sonnerToast(payload.new.title, {
                        description: payload.new.message,
                        action: {
                            label: "View",
                            onClick: () => navigate("/admin/notifications")
                        }
                    });

                    // Desktop Browser Notification
                    if (Notification.permission === 'granted') {
                        new Notification(payload.new.title, {
                            body: payload.new.message,
                            icon: "/favicon.ico"
                        });
                    }
                }
            });
            return () => {
                notificationService.unsubscribe(channel);
            };
        }
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <AdminSidebar className="hidden lg:block shrink-0" />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-20 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile Sidebar Trigger */}
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 border-r border-border">
                                <AdminSidebar className="w-full border-none h-full" />
                            </SheetContent>
                        </Sheet>

                        <div className="hidden md:flex items-center gap-2 max-w-md w-full relative group">
                            <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search inventory..."
                                className="pl-10 h-11 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-4">
                        {/* Auto Schedule Toggle */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsAutoSchedule(!isAutoSchedule)}
                                        className={cn(
                                            "rounded-xl w-11 h-11 transition-all",
                                            isAutoSchedule ? "bg-primary/20 text-primary shadow-inner" : "hover:bg-primary/10 hover:text-primary"
                                        )}
                                    >
                                        <Clock className={cn("w-5 h-5", isAutoSchedule && "animate-pulse")} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isAutoSchedule ? "Disable" : "Enable"} Day/Night Schedule</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isAutoSchedule}
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="rounded-xl w-11 h-11 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </Button>

                        {/* Notifications */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/admin/notifications")}
                            className="rounded-xl w-11 h-11 relative hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background px-1 animate-in zoom-in">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="p-1 pr-3 gap-3 rounded-xl h-12 hover:bg-muted transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-xs font-bold leading-none">{user?.user_metadata?.full_name || "Admin"}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{user?.email}</p>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="rounded-lg">Dashboard Profile</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg">System Settings</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-destructive">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-4xl font-serif tracking-tight">Admin <span className="text-primary italic">Dashboard</span></h2>
                            <p className="text-muted-foreground font-light">Welcome back, Administrator. Here is the overview of your store.</p>
                        </div>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
