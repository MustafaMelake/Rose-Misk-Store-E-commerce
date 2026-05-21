import NavBar from "@/components/NavBar";
import SearchBar from "@/components/SearchBar";
import ShopContextProvider from "@/context/ShopContext";

export default function Shop({ children }: { children: React.ReactNode }) {
  return (
    <ShopContextProvider>
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[7vw] min-h-screen">
        <NavBar />
        <SearchBar />
        {children}
      </div>
    </ShopContextProvider>
  );
}
