import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
}

const SEO = ({
    title,
    description,
    image,
    article = false,
}: SEOProps) => {
    const { pathname } = useLocation();
    const siteName = "Lorean | Ancient Herbal Hair Rituals";
    const defaultDescription = "Lorean - Premium herbal hair oils crafted with ancient Ayurvedic wisdom. Discover our collection for healthy, thick, and radiant hair.";
    const siteUrl = "https://lorean.online";
    const defaultImage = "/og-image.png";

    const seo = {
        title: title ? `${title} | Lorean` : siteName,
        description: description || defaultDescription,
        image: `${siteUrl}${image || defaultImage}`,
        url: `${siteUrl}${pathname}`,
    };

    useEffect(() => {
        // Basic meta tags update
        document.title = seo.title;

        const updateMetaTag = (selector: string, attribute: string, content: string) => {
            let element = document.querySelector(selector);
            if (element) {
                element.setAttribute(attribute, content);
            } else {
                // Create element if it doesn't exist
                const name = selector.includes('property') ? 'property' : 'name';
                const value = selector.match(/"([^"]+)"/)?.[1] || '';
                element = document.createElement('meta');
                element.setAttribute(name, value);
                element.setAttribute(attribute, content);
                document.head.appendChild(element);
            }
        };

        updateMetaTag('meta[name="description"]', 'content', seo.description);
        updateMetaTag('meta[property="og:title"]', 'content', seo.title);
        updateMetaTag('meta[property="og:description"]', 'content', seo.description);
        updateMetaTag('meta[property="og:image"]', 'content', seo.image);
        updateMetaTag('meta[property="og:url"]', 'content', seo.url);
        updateMetaTag('meta[property="og:type"]', 'content', article ? 'article' : 'website');

        updateMetaTag('meta[name="twitter:title"]', 'content', seo.title);
        updateMetaTag('meta[name="twitter:description"]', 'content', seo.description);
        updateMetaTag('meta[name="twitter:image"]', 'content', seo.image);

        // Canonical link
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', seo.url);

    }, [seo.title, seo.description, seo.image, seo.url, article]);

    return null;
};

export default SEO;
