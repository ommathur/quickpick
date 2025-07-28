"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Session } from "@supabase/supabase-js"; // Import the Session type

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();

  // --- NEW: Function to handle redirection logic ---
  // This avoids repeating code.
  const handleRedirect = async (session: Session) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", session.user.id)
      .single();

    if (profile?.onboarding_complete) {
      router.push("/dashboard");
    } else {
      router.push("/setup");
    }
  };

  useEffect(() => {
    // --- NEW: Check for an existing session on page load ---
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // If a session exists, redirect the user.
        handleRedirect(data.session);
      }
    };
    checkSession();

    // This listener handles redirection after a user signs in on this page.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleRedirect(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md border rounded-xl p-6 sm:p-8 shadow-md bg-card text-card-foreground space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          Welcome to QuickPick
        </h1>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#f97316",
                  brandAccent: "#ea580c",
                  inputText: "var(--foreground)",
                  inputBackground: "var(--background)",
                },
              },
            },
          }}
          theme="default"
          providers={[]}
        />
      </div>
    </div>
  );
}
