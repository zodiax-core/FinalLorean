import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

export const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
    const { pathname } = useLocation();

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Scroll to top on route change
        lenis.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);

        return () => {
            lenis.destroy();
        };
    }, [pathname]);

    return <>{children}</>;
};
