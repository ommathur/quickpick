"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";

export default function CategoryPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryName = searchParams.get("name");

  const [products, setProducts] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryName) return;

    const fetchData = async () => {
      setLoading(true);
      let allProducts: any[] = [];
      let from = 0;
      let to = 999;
      let keepFetching = true;

      while (keepFetching) {
        const { data, error } = await supabase
          .from("products")
          .select("product_name, sub_category")
          .eq("category", categoryName)
          .order("sub_category", { ascending: true })
          .range(from, to);

        if (error) {
          console.error("Error fetching products:", error);
          keepFetching = false;
        }

        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          from += 1000;
          to += 1000;
        } else {
          keepFetching = false;
        }
      }

      const cleaned = allProducts.map((p) => ({
        product_name: p.product_name?.trim(),
        sub_category: p.sub_category?.trim() || "",
      }));

      const uniqueSubs = [
        ...new Set(cleaned.map((p) => p.sub_category).filter(Boolean)),
      ];

      setProducts(cleaned);
      setSubcategories(uniqueSubs);
      setLoading(false);
    };

    fetchData();
  }, [supabase, categoryName]);

  const filteredProducts = useMemo(() => {
    if (!activeSub) return products;
    return products.filter((p) => p.sub_category === activeSub);
  }, [products, activeSub]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!categoryName) {
    return <div className="p-6 text-foreground">Invalid category</div>;
  }

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <div className="w-full border-b border-border p-4 flex items-center justify-between bg-background shrink-0">
        <div className="w-1/3" />
        <div className="w-1/3 text-center">
          <h1 className="text-xl font-semibold capitalize">{categoryName}</h1>
        </div>
        <div className="w-1/3 flex justify-end items-center gap-2">
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main: Sidebar + Scrollable Product Grid */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[288px] border-r border-border p-4 overflow-y-auto bg-background shrink-0">
          <h2 className="text-lg font-semibold mb-4">Sub-Categories</h2>
          <div className="space-y-2">
            <Button
              onClick={() => setActiveSub(null)}
              className={`w-full justify-start text-left rounded-xl transition-all ${
                !activeSub
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-muted hover:bg-orange-700 text-foreground"
              }`}
            >
              All
            </Button>
            {subcategories.map((sub) => (
              <Button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`w-full justify-start text-left rounded-xl transition-all ${
                  sub === activeSub
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-muted hover:bg-orange-700 text-foreground"
                }`}
              >
                {sub}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid - scrollable only */}
        <div className="flex-1 h-full overflow-y-auto p-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((p, i) => (
                <Card
                  key={i}
                  onClick={() =>
                    router.push(
                      `/product?name=${encodeURIComponent(p.product_name)}`
                    )
                  }
                  className="h-28 rounded-xl p-4 flex flex-col justify-center items-center text-center cursor-pointer transition-all transform hover:scale-[1.04] hover:bg-orange-600 hover:text-white"
                >
                  <p className="text-sm font-medium line-clamp-2">
                    {p.product_name}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
