import "./global.css";
import ShopContextProvider from "../context/ShopContext";
import { ThemeProvider } from "../components/ThemeContext";
import { Metadata } from "next";
import { auth } from "../../lib/auth";
import GuestWelcomeBanner from "@/components/GuestWelcomeBanner";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: {
    default: "Rose Misk | Luxury Fragrances",
    template: "%s | Rose Misk",
  },
  description:
    "اكتشف عالم الفخامة مع روز مسك، أرقى العطور والروائح الشرقية والغربية بجودة استثنائية.",
  keywords: [
    "عطور",
    "مسك",
    "Rose Misk",
    "برفانات",
    "عطور شرقية",
    "Luxury Perfumes",
    "Fragrances",
  ],
  authors: [{ name: "Rose Misk Team" }],
  openGraph: {
    title: "Rose Misk | Luxury Fragrances",
    description: "أرقى أنواع المسك والعطور الفاخرة في متجر واحد.",
    url: "https://rose-misk.vercel.app",
    siteName: "Rose Misk",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isGuest = true; // نفترض أنه زائر كإجراء احتياطي

  try {
    // محاولة جلب الجلسة بشكل آمن
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    // إذا كان هناك مستخدم، إذن هو ليس زائراً
    isGuest = !session?.user;
  } catch (error) {
    // في حالة وجود خطأ في متغيرات Vercel أو الداتا بيز، سيتم طباعة الخطأ هنا ولن ينهار الموقع
    console.error("Session fetch error:", error);
  }
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased bg-white dark:bg-black">
        <ThemeProvider>
          <ShopContextProvider>
            {children}
            {isGuest && <GuestWelcomeBanner />}
          </ShopContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
