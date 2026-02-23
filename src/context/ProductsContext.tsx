import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { productsService, categoriesService, Product, Category } from "@/services/supabase";

interface ProductsContextType {
    products: Product[];
    categories: Category[];
    loading: boolean;
    error: any;
    getProductById: (id: number) => Product | undefined;
    refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch products first — only show active products on storefront
            let productsData: Product[] = [];
            try {
                const allProducts = await productsService.getAll();
                // Strictly filter out archived, draft, or truly deleted products.
                productsData = (allProducts || []).filter(p => {
                    const s = p.status?.toLowerCase() || 'active';
                    return s !== 'archived' && s !== 'draft' && s !== 'deleted';
                });
                setProducts(productsData);
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setProducts([]);
                productsData = [];
            }

            // Fetch categories independently — ONLY use official categories from the database
            try {
                const categoriesData = await categoriesService.getAll();
                setCategories(categoriesData || []);
            } catch (err) {
                console.error("Failed to fetch categories, deriving from active products:", err);
                const uniqueCats = Array.from(new Set((productsData || []).map(p => p.category))).filter(Boolean);
                setCategories(uniqueCats.map((name, i) => ({ id: i, name })));
            }
        } catch (err) {
            console.error("Critical failure in loadData:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getProductById = (id: number) => {
        return products.find(p => p.id === id);
    };

    return (
        <ProductsContext.Provider value={{ products, categories, loading, error, getProductById, refreshProducts: loadData }}>
            {children}
        </ProductsContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) throw new Error("useProducts must be used within ProductsProvider");
    return context;
};
