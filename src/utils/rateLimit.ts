
// Simple client-side rate limiter to prevent spamming actions
// For true security, this should also be implemented on the server (Edge Functions)

const rateLimitMap = new Map<string, number>();

/**
 * Checks if a specific action (key) is allowed based on the interval.
 * @param key The unique key for the action (e.g. 'contact_form_127.0.0.1')
 * @param limitInMs The interval in milliseconds (default 5000ms = 5s)
 * @returns true if allowed, false if rate limited
 */
export const checkRateLimit = (key: string, limitInMs: number = 5000): boolean => {
    const now = Date.now();
    const lastAction = rateLimitMap.get(key) || 0;

    if (now - lastAction < limitInMs) {
        return false;
    }

    rateLimitMap.set(key, now);
    return true;
};

/**
 * Get remaining time in seconds for the rate limit
 */
export const getRateLimitRemaining = (key: string, limitInMs: number = 5000): number => {
    const now = Date.now();
    const lastAction = rateLimitMap.get(key) || 0;
    const remaining = limitInMs - (now - lastAction);
    return Math.max(0, Math.ceil(remaining / 1000));
};
