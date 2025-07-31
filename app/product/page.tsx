"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import { ThemeToggle } from "@/components/ThemeToggle";

// ==== Outer Component with Suspense ====
export default function ProductScraper() {
  return (
    <Suspense
      fallback={<div className="p-6 text-foreground">Loading product...</div>}
    >
      <ProductScraperContent />
    </Suspense>
  );
}

// ==== Actual Logic Component ====
function ProductScraperContent() {
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [userId, setUserId] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rawProductName = searchParams.get("name");
  const productName = rawProductName || "";

  useEffect(() => {
    const fetchUserAndData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setError("⚠️ User not logged in");
        return;
      }

      setUserId(user.id);

      try {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("blinkit_link, zepto_link, bigbasket_link")
          .ilike("product_name", productName)
          .single();

        if (productError || !product) {
          throw new Error("❌ Product not found in Supabase.");
        }

        const blinkitLinks = (product.blinkit_link || "")
          .split(",")
          .map((l: string) => l.trim())
          .filter(Boolean);

        const zeptoLinks = (product.zepto_link || "")
          .split(",")
          .map((l: string) => l.trim())
          .filter(Boolean);

        const bigbasketLinks = (product.bigbasket_link || "")
          .split(",")
          .map((l: string) => l.trim())
          .filter(Boolean);

        const requests: Promise<Response>[] = [];

        if (blinkitLinks.length > 0) {
          const blinkitUrl = new URL(
            "https://a367546c-7427-43e0-8a51-0b1bc178922b-00-26eswvwllxnay.picard.replit.dev"
          );
          blinkitLinks.forEach((link: string) =>
            blinkitUrl.searchParams.append("url", link)
          );
          blinkitUrl.searchParams.append("user_id", user.id);
          requests.push(fetch(blinkitUrl.toString()));
        }

        if (bigbasketLinks.length > 0) {
          const bbUrl = new URL(
            "https://1831d196-9e89-40b6-917b-1a7565711d22-00-mz7rvvgk42pb.janeway.replit.dev"
          );
          bigbasketLinks.forEach((link: string) =>
            bbUrl.searchParams.append("url", link)
          );
          bbUrl.searchParams.append("user_id", user.id);
          requests.push(fetch(bbUrl.toString()));
        }

        if (zeptoLinks.length > 0) {
          const zeptoUrl = new URL("https://epic-ladybug-glad.ngrok-free.app");
          zeptoLinks.forEach((link: string) =>
            zeptoUrl.searchParams.append("url", link)
          );
          zeptoUrl.searchParams.append("user_id", user.id);
          requests.push(
            fetch(zeptoUrl.toString(), {
              headers: { "ngrok-skip-browser-warning": "any" },
            })
          );
        }

        if (requests.length === 0) {
          throw new Error("❌ No links to fetch.");
        }

        const responses = await Promise.all(requests);
        const jsons = await Promise.all(responses.map((res) => res.json()));
        const allData = jsons.flat();
        setData(allData);
      } catch (err: any) {
        setError(err.message || "Unknown error occurred");
      }
    };

    fetchUserAndData();
  }, [productName, supabase]);

  const section = (title: string, sourceKey: string, colorClass: string) => {
    const filtered = data.filter((item) =>
      item.url?.includes(sourceKey.toLowerCase())
    );
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-2 w-full">
        <h3 className="text-lg font-semibold text-gray-300 px-6">{title}</h3>
        <div className="flex gap-4 overflow-x-auto px-6 pb-2">
          {filtered.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-64"
            >
              <Card
                className={`${colorClass} w-full rounded-xl shadow-md transition-transform hover:scale-105`}
              >
                <CardContent className="p-4 space-y-1 text-white">
                  <p>
                    <strong>Product:</strong> {item.display_name}
                  </p>
                  <p>
                    <strong>Unit:</strong> {item.unit}
                  </p>
                  <p>
                    <strong>Price:</strong>{" "}
                    {item.available ? `₹${item.price}` : "Not Available"}
                  </p>
                  <p>
                    <strong>Available:</strong>{" "}
                    {item.available ? "✅ Yes" : "❌ No"}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="p-6 space-y-12">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <button
          onClick={handleLogout}
          className="text-sm text-red-400 hover:text-red-500"
        >
          Logout
        </button>

        <h1 className="text-lg font-bold text-center text-white">
          {productName} & similar products
        </h1>

        <ThemeToggle />
      </div>

      {/* Error message */}
      {error && (
        <div className="text-center text-red-500 text-sm mt-2">{error}</div>
      )}

      {/* Full-width horizontal sections */}
      {data.length > 0 && (
        <div className="space-y-12">
          {section("🟡 Blinkit", "blinkit", "bg-yellow-700")}
          <hr className="border-gray-600" />
          {section("🟢 BigBasket", "bigbasket", "bg-green-700")}
          <hr className="border-gray-600" />
          {section("🟣 Zepto", "zepto", "bg-purple-700")}
        </div>
      )}
    </div>
  );
}
