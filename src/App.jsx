import React, { useContext } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
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

const App = () => {
  const { searchOpen } = useContext(ShopContext);
  return (
    <ThemeProvider>
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-white dark:bg-black">
        <NavBar />
        <SearchBar isOpen={searchOpen} />
        <HashRouter>
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
        </HashRouter>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
