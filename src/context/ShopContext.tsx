import React, { createContext, useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
// 1. هنا السحر: بنستورد الـ Product interface والبيانات من مكان واحد!
import { products, Product } from "../assets/assets";

// 2. تعريف شكل سلة المشتريات
export type CartItems = Record<string, Record<string, number>>;

// 3. تعريف شكل عناصر الطلب والطلب نفسه
export interface OrderItem {
  id: number;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  date: string;
  items: OrderItem[];
  payment: string;
  total: number;
  status: string;
}

interface DeliveryData {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
}

// 4. تعريف محتوى الـ Context
export interface ShopContextType {
  products: Product[]; // بنستخدم الـ Product المستورد
  currency: string;
  delivery_fee: number;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeSearch: () => void;
  cartItems: CartItems;
  setCartItems: React.Dispatch<React.SetStateAction<CartItems>>;
  addToCart: (itemId: string | number, size: string) => void;
  getCartCount: number;
  goToCheckout: () => void;
  total: number;
  subtotal: number;
  placeOrder: (
    items: any,
    method: string,
    address: DeliveryData,
    amount: number
  ) => void;
  userOrders: Order[];
  setUserOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  getPriceBySize: (productId: string | number, size: string) => number;
}

export const ShopContext = createContext<ShopContextType | null>(null);

interface ShopContextProviderProps {
  children: ReactNode;
}

const ShopContextProvider: React.FC<ShopContextProviderProps> = ({
  children,
}) => {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItems>({});
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const navigate = useNavigate();
  const closeSearch = () => setSearchOpen(false);

  const goToCheckout = () => {
    navigate("/placeorder");
  };

  const addToCart = (itemId: string | number, size: string) => {
    const cartData = structuredClone(cartItems);
    const idStr = String(itemId);

    if (cartData[idStr]) {
      cartData[idStr][size] = (cartData[idStr][size] || 0) + 1;
    } else {
      cartData[idStr] = { [size]: 1 };
    }

    setCartItems(cartData);
  };

  const getCartCount = useMemo(() => {
    let count = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        count += Number(cartItems[itemId][size]) || 0;
      }
    }
    return count;
  }, [cartItems]);

  const currency = "EGP "; // تعديل بسيط لرمز الجنيه ليكون أشيك
  const delivery_fee = 10;

  const getPriceBySize = (productId: string | number, size: string) => {
    // مفيش داعي نعمل Casting (as Product[]) لأن products جاية متعرفة جاهزة
    const product = products.find((p) => Number(p.id) === Number(productId));

    if (!product) return 0;

    let price = product.price;
    if (size === "50ML") price *= 1.67;
    else if (size === "100ML") price *= 3.33;

    return price;
  };

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        const qty = cartItems[productId][size];
        const price = getPriceBySize(productId, size);
        sum += price * qty;
      }
    }
    return sum;
  }, [cartItems]);

  const total = subtotal + delivery_fee;

  const placeOrder = (cartData: CartItems, selectedPaymentMethod: string) => {
    const formattedItems = Object.entries(cartData)
      .flatMap(([productId, sizes]) =>
        Object.entries(sizes).map(([size, quantity]) => {
          const product = products.find(
            (p) => Number(p.id) === Number(productId)
          );

          if (!product) return null;

          return {
            id: product.id,
            name: product.name,
            image: Array.isArray(product.image)
              ? product.image[0]
              : product.image,
            size,
            quantity: Number(quantity) || 0,
            price: getPriceBySize(productId, size),
          } as OrderItem;
        })
      )
      .filter((item): item is OrderItem => item !== null); // Type Guard ممتاز إنت عملته

    setUserOrders((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        items: formattedItems,
        payment: selectedPaymentMethod,
        total: subtotal + delivery_fee,
        status: "Pending",
      },
    ]);

    setCartItems({});
    navigate("/orders");
  };

  const value: ShopContextType = {
    products, // هنباصي الـ products مباشرة بدون Casting
    currency,
    delivery_fee,
    searchOpen,
    setSearchOpen,
    closeSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    goToCheckout,
    total,
    subtotal,
    placeOrder,
    userOrders,
    setUserOrders,
    getPriceBySize,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
