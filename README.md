# ⚡ QuickPick

QuickPick is a blazing-fast, minimal shopping aggregator and comparison tool for grocery products — giving users instant access to prices and availability of products across platforms like Blinkit, BigBasket, and Zepto — using real-time data fetching.

🔗 Live: [getquickpick.vercel.app](https://getquickpick.vercel.app)

Built with ❤️ by [Om Mathur](https://github.com/ommathur)

---

## 🚀 What is QuickPick?

QuickPick simplifies grocery search by letting users:

- 🔍 Find a product (e.g., "Milk", "Tomato Sauce")
- 📦 View real-time price and availability across Blinkit, BigBasket, and Zepto
- 🧠 Search by category, sub-category, or exact product name from your Supabase database
- 🖱️ Click a product to instantly see detailed info fetched live from ecommerce sites
- ✅ Authenticated dashboard setup with onboarding flow — no public access required

It’s built for speed, simplicity, and data clarity.

---

## ✅ Core Features

### 🔐 User Authentication

- Login using Supabase Auth
- Auto-redirect to `/dashboard` if authenticated
- If onboarding incomplete, redirected to `/setup`
- Session persistence handled via Supabase + Next.js App Router

### 🏠 Dashboard Page

- Lists all product categories (fetched from Supabase via RPC)
- Dynamically renders animated category cards
- Each category card links to a per-category page

### 🗂️ Category Page

- Displays sub-categories and all products under a category
- Users can filter products by sub-category
- Clicking a product name navigates to product details

### 🔍 Product Page

- Scrapes product data in real-time using URLs stored in Supabase:
  - blinkit
  - bigbasket
  - zepto  
- Sends links to serverless scrapers via fetch calls to:
  - Blinkit endpoint
  - BigBasket endpoint
  - Zepto endpoint (via ngrok)

- Displays:
  - Product name
  - Unit (e.g. 1kg, 500ml)
  - Price (₹)
  - Availability ✅/❌
  
### 🧠 Supabase Integration

- Supabase Tables:
  - products: includes product name, category, sub-category, and URL references
  - profiles: stores onboarding status


---

## 🛠 Tech Stack

| Area              | Stack / Library Used                                      |
|-------------------|-----------------------------------------------------------|
| Framework         | Next.js 13+ (App Router with `use client`)                |
| Data Fetching     | Supabase Client + Edge-safe async fetch logic             |
| UI Components     | ShadCN UI (via Tailwind CSS), including Button and Card   |
| Styling / Design  | Tailwind CSS + Dark Mode Support via `ThemeToggle`        |
| Auth              | Supabase Auth + `@supabase/auth-ui-react`                |
| Realtime          | Supabase's auth and database querying                     |
| QR / Utilities    | Not used here (those are in ClipCast)                     |
| Serverless APIs   | Custom hosted scrapers (Blinkit, Zepto, Bigbasket)        |
| Deployment        | Hosted on **Vercel** with auto-build & edge performance   |


---

## ⚠️ Notes

- The project uses multiple Replit/Ngrok endpoints for scraping - be sure to refresh your credentials/bookmarks using the setup guide.
- There's a bookmarklet instruction (in a file) that assists with copying session cookies quickly from platforms like BigBasket or Blinkit — required for scraper accuracy.
- Product links are stored in Supabase in `products` table as comma-separated values and parsed using JS code.

---

## 👋 Author

Made by **Om Mathur**  
For collabs, reach out via [GitHub](https://github.com/ommathur)

---

QuickPick — save time, save money, skip the app-hopping. 🛒⚡
