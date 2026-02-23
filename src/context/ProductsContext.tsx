import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { productsService, categoriesService, Product, Category } from "@/services/supabase";
import { products as fallbackProducts } from "@/data/products";

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
            // Fetch products first
            let productsData: Product[] = [];
            try {
                productsData = await productsService.getAll();
                setProducts(productsData || []);
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setProducts(fallbackProducts as any);
                productsData = fallbackProducts as any;
            }

            // Fetch categories independently
            try {
                const categoriesData = await categoriesService.getAll();
                const officialNames = (categoriesData || []).map(c => c.name);
                const productNames = Array.from(new Set((productsData || []).map(p => p.category))).filter(Boolean);

                // Merge everything into a consistent unique list
                const allUniqueNames = Array.from(new Set([...officialNames, ...productNames]));

                setCategories(allUniqueNames.map((name, i) => {
                    const official = (categoriesData || []).find(c => c.name === name);
                    return {
                        id: official?.id || -(i + 1),
                        name,
                        created_at: official?.created_at || new Date().toISOString()
                    };
                }));
            } catch (err) {
                console.error("Failed to fetch categories, deriving from products:", err);
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
