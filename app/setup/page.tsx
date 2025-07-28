"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function SetupPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const [bookmarkletCode, setBookmarkletCode] = useState(
    "Loading your personal code..."
  );
  const [copyButtonText, setCopyButtonText] = useState("Copy Code");
  const [uploaded, setUploaded] = useState({
    zepto: false,
    blinkit: false,
    bigbasket: false,
  });
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/save-session`;

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setBookmarkletCode("Could not get user token. Please log in again.");
        return;
      }

      setUserToken(token);
      setUserId(session.user.id);

      // Bookmarklet setup
      const jsCode = `(function(){
      try {
        const t="${token}", h=window.location.hostname;
        let s="";
        if(h.includes("zeptonow")) s="Zepto";
        else if(h.includes("blinkit")) s="Blinkit";
        else if(h.includes("bigbasket")) s="Bigbasket";
        else { alert("This works only on Zepto, Blinkit, or Bigbasket."); return; }

        const d={};
        for(let i=0;i<localStorage.length;i++){
          const k=localStorage.key(i);
          d[k]=localStorage.getItem(k);
        }
        const j={cookies:document.cookie, localStorage:d};

        if (s === "Bigbasket") {
          navigator.clipboard.writeText(JSON.stringify({ store: s, session_data: j }))
            .then(() => alert("✅ BigBasket session copied to clipboard. Now go to your dashboard tab and click 'Upload BigBasket Data'."))
            .catch(err => alert("❌ Clipboard error: " + err));
          return;
        }

        fetch("${functionUrl}", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
          },
          body: JSON.stringify({ session_data: j, store: s })
        })
        .then(r => {
          if(!r.ok) throw new Error("Upload failed");
          alert("✅ " + s + " session uploaded successfully!");
        })
        .catch(e => {
          console.error("Error:", e);
          alert("❌ Upload failed. See console.");
        });
      } catch(e) {
        alert("❌ Bookmarklet error: " + e.message);
      }
    })();`;

      setBookmarkletCode(`javascript:${encodeURIComponent(jsCode)}`);

      // Start polling after token/user setup
      pollingInterval = setInterval(async () => {
        const { data } = await supabase.from("user_sessions").select("store");

        const stores = data?.map((entry) => entry.store.toLowerCase()) || [];

        setUploaded((prev) => {
          const updated = {
            zepto: stores.includes("zepto"),
            blinkit: stores.includes("blinkit"),
            bigbasket: prev.bigbasket, // manual upload
          };

          // Stop polling if all three are uploaded
          if (updated.zepto && updated.blinkit && updated.bigbasket) {
            clearInterval(pollingInterval);
          }

          return updated;
        });
      }, 5000); // every 5 seconds
    };

    init();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  useEffect(() => {
    const completeOnboardingAndRedirect = async () => {
      if (!userId) return;

      try {
        await supabase
          .from("profiles")
          .update({ onboarding_complete: true })
          .eq("id", userId);

        router.push("/dashboard");
      } catch (err) {
        console.error("Onboarding completion failed:", err);
      }
    };

    if (uploaded.zepto && uploaded.blinkit && uploaded.bigbasket) {
      completeOnboardingAndRedirect();
    }
  }, [uploaded, userId, router]);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopyButtonText("Copied!");
    setTimeout(() => setCopyButtonText("Copy Code"), 2000);
  };

  const handleBigBasketUpload = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsed = JSON.parse(clipboardText);

      if (!parsed || parsed.store !== "Bigbasket" || !parsed.session_data) {
        alert("❌ Clipboard does not contain valid BigBasket session data.");
        return;
      }

      if (!userToken) {
        alert("❌ Missing user token. Please refresh and log in again.");
        return;
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userToken,
        },
        body: JSON.stringify({
          session_data: parsed.session_data,
          store: "Bigbasket",
        }),
      });

      if (!response.ok) throw new Error("Upload failed");

      setUploaded((prev) => ({ ...prev, bigbasket: true }));
      alert("✅ BigBasket session uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("❌ Failed to upload BigBasket session: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Connect Your Accounts</CardTitle>
          <CardDescription>
            Follow the steps below to create your personalized bookmarklet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">
              Step 1: Copy your personal code
            </h3>
            <div className="flex gap-2">
              <Textarea
                readOnly
                value={bookmarkletCode}
                className="font-mono text-xs whitespace-nowrap overflow-auto flex-grow"
                rows={5}
              />
              <Button onClick={handleCopy} variant="outline">
                {copyButtonText}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">
              Step 2: Create a new bookmark
            </h3>
            <p className="text-sm text-muted-foreground">
              Right-click your bookmarks bar, select "Add page...", name it
              something like <strong>"Send Session"</strong>, and paste the
              copied code into the URL field.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">
              Step 3: Upload BigBasket Data
            </h3>
            <Button onClick={handleBigBasketUpload}>
              Upload BigBasket Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Run the bookmarklet on BigBasket first to copy the session to your
              clipboard, then come back here and click this button.
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <h3 className="font-semibold">Upload Status</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li className={uploaded.zepto ? "text-green-600" : ""}>
                Zepto – {uploaded.zepto ? "Uploaded ✅" : "Pending"}
              </li>
              <li className={uploaded.blinkit ? "text-green-600" : ""}>
                Blinkit – {uploaded.blinkit ? "Uploaded ✅" : "Pending"}
              </li>
              <li className={uploaded.bigbasket ? "text-green-600" : ""}>
                BigBasket – {uploaded.bigbasket ? "Uploaded ✅" : "Pending"}
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground pt-4 text-center">
            After setting up, click the bookmarklet on Zepto, Blinkit, or
            BigBasket every few days to refresh your session data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
