import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";
import { settingsService } from "@/services/supabase";

const FloatingSocialIcons = () => {
    const [socialLinks, setSocialLinks] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();

    // Don't render on admin pages
    const isAdminPage = location.pathname.startsWith("/admin");

    useEffect(() => {
        let mounted = true;
        const fetchFloatingIcons = async () => {
            try {
                const configs = await settingsService.getAllConfigs();
                if (!mounted) return;

                // Explicitly check for disabled flag (defaults to true if null/undefined for backward compatibility)
                if (configs?.marketing?.floating_icons_enabled === false) return;

                const floating = configs?.marketing?.floating_social_links;
                if (floating && Array.isArray(floating) && floating.length > 0) {
                    setSocialLinks(floating);
                } else if (configs?.marketing?.custom_social_links?.length > 0) {
                    // Fallback: if no specific floating links set, use all custom social links
                    setSocialLinks(configs.marketing.custom_social_links);
                }
            } catch (err) {
                console.error("Floating social links fetch failed", err);
            }
        };
        fetchFloatingIcons();
        return () => { mounted = false; };
    }, []);

    if (isAdminPage || socialLinks.length === 0) return null;

    const content = (
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col-reverse items-center gap-3 group/floating-container" style={{ position: 'fixed' }}>
            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-5 h-5 relative z-10" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <UserRound className="w-5 h-5 relative z-10" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Floating Icons */}
            <AnimatePresence>
                {isExpanded && socialLinks.map((url, i) => {
                    let hostname = "";
                    try {
                        const validUrl = url.startsWith('http') ? url : `https://${url}`;
                        hostname = new URL(validUrl).hostname;
                    } catch (e) { }
                    if (!hostname) return null;

                    return (
                        <motion.a
                            key={i}
                            href={url.startsWith('http') ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: 10 }}
                            transition={{
                                delay: i * 0.06,
                                type: "spring",
                                stiffness: 400,
                                damping: 20
                            }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-11 h-11 rounded-full bg-card border border-border/30 flex items-center justify-center shadow-xl hover:border-primary transition-all duration-300 group/icon backdrop-blur-md"
                            title={hostname}
                        >
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                                alt={hostname}
                                className="w-5 h-5 object-contain transition-transform group-hover/icon:scale-110"
                                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                            />
                        </motion.a>
                    );
                })}
            </AnimatePresence>
        </div>
    );

    return createPortal(content, document.body);
};

export default FloatingSocialIcons;
