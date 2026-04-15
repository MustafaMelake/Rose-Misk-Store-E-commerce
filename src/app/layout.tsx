import "./global.css";
import NavBar from "../components/NavBar";
import SearchBar from "../components/SearchBar";
import ShopContextProvider from "../context/ShopContext";
import { ThemeProvider } from "../components/ThemeContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased bg-white dark:bg-black">
        <ThemeProvider>
          <ShopContextProvider>
            <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[7vw] min-h-screen">
              <NavBar />
              <SearchBar />
              {children}
            </div>
          </ShopContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
