import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ShopContextProvider from "./context/ShopContext.js";
import { HashRouter } from "react-router-dom";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </HashRouter>
  </StrictMode>
);
