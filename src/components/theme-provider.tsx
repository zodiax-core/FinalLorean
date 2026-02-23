import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system" | "schedule";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isAutoSchedule: boolean;
    setIsAutoSchedule: (enabled: boolean) => void;
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    isAutoSchedule: false,
    setIsAutoSchedule: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );
    const [isAutoSchedule, setIsAutoSchedule] = useState<boolean>(
        () => localStorage.getItem("lorean-auto-schedule") === "true"
    );

    useEffect(() => {
        const root = window.document.documentElement;
        const applyTheme = (targetTheme: string) => {
            root.classList.remove("light", "dark");
            root.classList.add(targetTheme);
        };

        const updateScheduledTheme = () => {
            if (!isAutoSchedule) return;

            const hour = new Date().getHours();
            // Morning (6am) to Evening (6pm) is light, otherwise dark
            const scheduledTheme = hour >= 6 && hour < 18 ? "light" : "dark";
            applyTheme(scheduledTheme);
        };

        if (isAutoSchedule) {
            updateScheduledTheme();
            const interval = setInterval(updateScheduledTheme, 60000); // Check every minute
            return () => clearInterval(interval);
        } else {
            if (theme === "system") {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                applyTheme(systemTheme);
            } else {
                applyTheme(theme);
            }
        }
    }, [theme, isAutoSchedule]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
        isAutoSchedule,
        setIsAutoSchedule: (enabled: boolean) => {
            localStorage.setItem("lorean-auto-schedule", String(enabled));
            setIsAutoSchedule(enabled);
        },
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
