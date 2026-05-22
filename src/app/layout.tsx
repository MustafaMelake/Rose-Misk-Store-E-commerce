import "./global.css";
import ShopContextProvider from "../context/ShopContext";
import { ThemeProvider } from "../components/ThemeContext";
import { Metadata } from "next";

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
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased bg-white dark:bg-black">
        <ThemeProvider>
          <ShopContextProvider>{children}</ShopContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
