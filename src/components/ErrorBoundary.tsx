import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Home } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Handle chunk loading failures (stale build objects)
        const errorMessage = error.message.toLowerCase();
        if (
            errorMessage.includes("failed to fetch dynamically imported module") ||
            errorMessage.includes("error loading dynamically imported module") ||
            errorMessage.includes("loading chunk") ||
            errorMessage.includes("failed to fetch")
        ) {
            console.log("Chunk loading error detected. Re-validating application manifest...");
            // Use a short delay to avoid infinite reload loops
            const lastReload = sessionStorage.getItem("last_chunk_reload") || "0";
            const now = Date.now();
            if (now - parseInt(lastReload) > 5000) {
                sessionStorage.setItem("last_chunk_reload", now.toString());
                window.location.reload();
            }
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full text-center space-y-6 glass p-10 rounded-[3rem]">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <RefreshCcw className="w-10 h-10 animate-spin-slow" />
                        </div>
                        <h1 className="text-3xl font-serif">Oops! Something went wrong</h1>
                        <p className="text-muted-foreground font-light leading-relaxed">
                            We encountered an unexpected error while preparing your experience. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <pre className="text-[10px] bg-muted p-4 rounded-xl text-left overflow-auto max-h-32 text-muted-foreground border border-border/50">
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full h-14 rounded-full text-lg shadow-xl shadow-primary/20"
                            >
                                Refresh Page
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = "/"}
                                className="w-full h-14 rounded-full"
                            >
                                <Home className="w-4 h-4 mr-2" /> Back to Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
