import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        // Also try to reach lenis if it's on window
        if ((window as any).lenis) {
            (window as any).lenis.scrollTo(0, { immediate: true });
        }
    }, [pathname]);

    return null;
}
