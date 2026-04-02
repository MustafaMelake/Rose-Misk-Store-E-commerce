import React, { useContext } from "react";
import { Route, Routes } from "react-router-dom";
// بنشيل امتداد .jsx لأن TypeScript بيعرف يوصل للملفات تلقائياً
import Home from "./pages/Home";
import Fragrances from "./pages/Fragrances";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import { ShopContext } from "./context/ShopContext";
import { ThemeProvider } from "./components/ThemeContext";

// تعريف الـ Component باستخدام React.FC (Functional Component)
const App: React.FC = () => {
  // ملاحظة: الـ TypeScript هيطلع "Warning" بسيط هنا لحد ما نحول ملف ShopContext لـ .tsx
  const context = useContext(ShopContext);

  if (!context) {
    return null; // حماية في حالة الـ Context مكنش موجود
  }

  const { searchOpen } = context;

  return (
    <ThemeProvider>
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-white dark:bg-black min-h-screen">
        <NavBar />
        <SearchBar isOpen={searchOpen} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Fragrances" element={<Fragrances />} />
          <Route path="/About" element={<About />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/PlaceOrder" element={<PlaceOrder />} />
          <Route path="/Orders" element={<Orders />} />
        </Routes>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
