import React, { createContext, useEffect, useState, ReactNode } from "react";

// 1. تعريف الأنواع المتاحة للثيم
type Theme = "light" | "dark";

// 2. تعريف شكل البيانات داخل الـ Context
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// 3. إنشاء الـ Context مع قيمة افتراضية undefined للحماية
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// 4. تعريف الـ Props الخاصة بالـ Provider
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // استعادة الثيم من localStorage مع التأكد إنه نوع valid (Theme)
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
