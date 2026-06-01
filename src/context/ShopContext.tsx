"use client";

import React, {
  createContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { getAllProducts } from "../../lib/actions/product.actions";
import {
  getUserCart,
  updateCartInDB,
  mergeCartAction,
} from "../../lib/actions/cart.actions";
import { authClient } from "../../lib/auth-client";
import { createOrder, getUserOrders } from "../../lib/actions/order.actions";

export type CartItems = Record<string, Record<string, number>>;
export interface ProductVariant {
  id: number;
  volume: string;
  price: number;
  stock: number;
}
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  images: string[];
  company: string;
  isFeatured: boolean;
  variants: ProductVariant[];
}
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

export interface ShopContextType {
  products: Product[];
  currency: string;
  delivery_fee: number;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeSearch: () => void;
  cartItems: CartItems;
  setCartItems: React.Dispatch<React.SetStateAction<CartItems>>;
  addToCart: (itemId: string | number, size: string) => void;
  updateQuantity: (
    itemId: string | number,
    size: string,
    quantity: number
  ) => void;
  getCartCount: number;
  goToCheckout: () => void;
  total: number;
  subtotal: number;
  placeOrder: (
    cartData: CartItems,
    paymentMethod: string,
    formData: DeliveryData,
    total: number
  ) => Promise<{ success: boolean; orderId?: number; message?: string }>;
  userOrders: Order[];
  setUserOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  getPriceBySize: (productId: string | number, size: string) => number;
}

export const ShopContext = createContext<ShopContextType | null>(null);

const ShopContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItems>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const router = useRouter();
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  const currency = "EGP ";
  const delivery_fee = 80;

  // 1. تحميل المنتجات
  useEffect(() => {
    const fetchAll = async () => {
      const data = await getAllProducts(1, 100);
      setProducts(
        data?.products && Array.isArray(data.products) ? data.products : []
      );
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const initializeCart = async () => {
      const localData = localStorage.getItem("rose_misk_cart");
      const localCart = localData ? JSON.parse(localData) : {};

      if (userId) {
        if (Object.keys(localCart).length > 0) {
          localStorage.removeItem("rose_misk_cart");
          await mergeCartAction(userId, localCart);
        }
        const result = await getUserCart(userId);
        if (result.success) {
          setCartItems(result.cartData);
        }
      } else {
        setCartItems(localCart);
      }
      setIsCartLoaded(true);
    };

    initializeCart();
  }, [userId]);

  useEffect(() => {
    if (!userId && isCartLoaded) {
      if (Object.keys(cartItems).length > 0) {
        localStorage.setItem("rose_misk_cart", JSON.stringify(cartItems));
      } else {
        localStorage.removeItem("rose_misk_cart");
      }
    }
  }, [cartItems, userId, isCartLoaded]);

  const getPriceBySize = (productId: string | number, size: string) => {
    const product = products.find((p) => String(p.id) === String(productId));
    const variant = product?.variants.find((v) => v.volume === size);
    return variant ? variant.price : 0;
  };

  const addToCart = async (itemId: string | number, size: string) => {
    let cartData = structuredClone(cartItems);
    const idStr = String(itemId);

    if (cartData[idStr]) {
      cartData[idStr][size] = (cartData[idStr][size] || 0) + 1;
    } else {
      cartData[idStr] = { [size]: 1 };
    }

    setCartItems(cartData);

    if (userId) {
      await updateCartInDB(userId, Number(itemId), size, cartData[idStr][size]);
    }
  };

  const updateQuantity = async (
    itemId: string | number,
    size: string,
    quantity: number
  ) => {
    let cartData = structuredClone(cartItems);
    const idStr = String(itemId);

    if (quantity <= 0) {
      if (cartData[idStr]) delete cartData[idStr][size];
      if (cartData[idStr] && Object.keys(cartData[idStr]).length === 0)
        delete cartData[idStr];
    } else {
      if (!cartData[idStr]) cartData[idStr] = {};
      cartData[idStr][size] = quantity;
    }

    setCartItems(cartData);

    if (userId) {
      await updateCartInDB(userId, Number(itemId), size, quantity);
    }
  };

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        sum += getPriceBySize(productId, size) * cartItems[productId][size];
      }
    }
    return sum;
  }, [cartItems, products]);

  const total = subtotal + delivery_fee;

  const fetchUserOrders = async () => {
    if (userId) {
      const result = await getUserOrders(userId);
      if (result.success && result.orders) {
        setUserOrders(result.orders);
      }
    }
  };
  useEffect(() => {
    fetchUserOrders();
  }, [userId]);

  const placeOrder = async (
    cartData: CartItems,
    paymentMethod: string,
    formData: DeliveryData,
    total: number
  ) => {
    const formattedItems = Object.entries(cartData)
      .flatMap(([productId, sizes]) =>
        Object.entries(sizes).map(([size, quantity]) => ({
          id: Number(productId),
          size,
          quantity: Number(quantity),
        }))
      )
      .filter((item) => item.quantity > 0);

    const orderPayload = {
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      governorate: formData.state,
      address: `${formData.street}, ${formData.city}, ${formData.zipcode}`,
      paymentMethod,
      totalAmount: total,
    };

    const result = await createOrder(
      userId || null,
      orderPayload,
      formattedItems
    );

    if (result.success) {
      setCartItems({});
      if (userId) {
        await fetchUserOrders();
      }
      localStorage.removeItem("rose_misk_cart");

      return { success: true, orderId: result.orderId };
    } else {
      return {
        success: false,
        message: result.message || "Failed to create order",
      };
    }
  };

  const value = {
    products,
    currency,
    delivery_fee,
    searchOpen,
    setSearchOpen,
    closeSearch: () => setSearchOpen(false),
    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    getCartCount: useMemo(() => {
      let count = 0;
      for (const id in cartItems)
        for (const s in cartItems[id]) count += cartItems[id][s];
      return count;
    }, [cartItems]),
    goToCheckout: () => router.push("/placeorder"),
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
