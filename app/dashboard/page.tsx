"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!user || error) {
        router.push("/");
      }
    };
    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.rpc("get_unique_categories");
      if (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } else {
        const rawCategories = data
          .map((item: any) => item?.category?.trim())
          .filter((c: string) => c && c.length > 0);
        setCategories(rawCategories);
      }
      setLoading(false);
    };

    fetchCategories();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <div className="w-full flex justify-between items-center p-4 border-b">
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <ThemeToggle />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-8 w-full max-w-none">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : categories.length > 0 ? (
          <div className="flex flex-col gap-6">
            {/* Row 1: 5 items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.slice(0, 5).map((cat) => (
                <CategoryCard
                  key={cat}
                  category={cat}
                  onClick={() =>
                    router.push(
                      `/dashboard/category?name=${encodeURIComponent(cat)}`
                    )
                  }
                />
              ))}
            </div>

            {/* Row 2: 4 items */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(5, 9).map((cat) => (
                <CategoryCard
                  key={cat}
                  category={cat}
                  onClick={() =>
                    router.push(
                      `/dashboard/category?name=${encodeURIComponent(cat)}`
                    )
                  }
                />
              ))}
            </div>

            {/* Row 3: Remaining */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(9).map((cat) => (
                <CategoryCard
                  key={cat}
                  category={cat}
                  onClick={() =>
                    router.push(
                      `/dashboard/category?name=${encodeURIComponent(cat)}`
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center">No categories found.</p>
        )}
      </div>
    </div>
  );
}

// ✅ Fixed CategoryCard
function CategoryCard({
  category,
  onClick,
}: {
  category: string;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="h-28 w-full min-w-[140px] rounded-2xl p-4 flex flex-col justify-center items-center text-center cursor-pointer transition-all transform hover:scale-[1.04] hover:bg-orange-600 hover:text-white"
    >
      <p className="text-sm font-semibold line-clamp-2">{category}</p>
    </Card>
  );
}
