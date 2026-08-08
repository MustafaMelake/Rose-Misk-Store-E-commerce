"use client";

import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { getAllProducts } from "@/lib/actions/product.actions";
import {
  getUserCart,
  updateCartInDB,
  mergeCartAction,
} from "@/lib/actions/cart.actions";
import { authClient } from "@/lib/auth-client";
import { createOrder, getUserOrders } from "@/lib/actions/order.actions";
import { MAX_CART_QTY } from "@/lib/cart-limits";

export type CartItems = Record<string, Record<string, number>>;
export interface ProductVariant {
  id: number;
  volume: string;
  price: number;
  isAvailable: boolean;
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
  subtotal: number;
  placeOrder: (
    cartData: CartItems,
    paymentMethod: string,
    formData: DeliveryData,
    total: number
  ) => Promise<{
    success: boolean;
    orderId?: number;
    message?: string;
    reason?: string;
    fieldErrors?: Record<string, string>;
  }>;
  userOrders: Order[];
  setUserOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  refreshOrders: () => Promise<void>;
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

  // 1. تحميل المنتجات
  useEffect(() => {
    const fetchAll = async () => {
      const data = await getAllProducts(1, 100);
      // Server DTO -> client model: variant prices are already numbers at
      // runtime (serialized from Prisma.Decimal in the action).
      setProducts(
        data?.products && Array.isArray(data.products)
          ? (data.products as unknown as Product[])
          : []
      );
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const initializeCart = async () => {
      // Corrupt localStorage must never break cart init: parse defensively
      // and drop the stored value if it isn't valid JSON of the right shape.
      let localCart: CartItems = {};
      try {
        const localData = localStorage.getItem("rose_misk_cart");
        const parsed = localData ? JSON.parse(localData) : {};
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          localCart = parsed;
        } else {
          localStorage.removeItem("rose_misk_cart");
        }
      } catch {
        localStorage.removeItem("rose_misk_cart");
      }

      if (userId) {
        if (Object.keys(localCart).length > 0) {
          localStorage.removeItem("rose_misk_cart");
          await mergeCartAction(localCart);
        }
        const result = await getUserCart();
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

  // Whether a variant can be ordered, or null if the product/variant isn't
  // loaded yet (in which case we don't block — the server re-checks anyway).
  const isVariantAvailable = (
    productId: string | number,
    size: string
  ): boolean | null => {
    const product = products.find((p) => String(p.id) === String(productId));
    const variant = product?.variants.find((v) => v.volume === size);
    return variant ? variant.isAvailable : null;
  };

  const addToCart = async (itemId: string | number, size: string) => {
    const idStr = String(itemId);
    const currentQty = cartItems[idStr]?.[size] || 0;

    // Nothing to add if the admin has switched this volume off.
    if (isVariantAvailable(itemId, size) === false) return;

    // Abuse guard only — quantities are no longer bounded by stock.
    if (currentQty + 1 > MAX_CART_QTY) return;

    let cartData = structuredClone(cartItems);
    if (cartData[idStr]) {
      cartData[idStr][size] = currentQty + 1;
    } else {
      cartData[idStr] = { [size]: 1 };
    }

    setCartItems(cartData);

    if (userId) {
      await updateCartInDB(Number(itemId), size, cartData[idStr][size]);
    }
  };

  const updateQuantity = async (
    itemId: string | number,
    size: string,
    quantity: number
  ) => {
    let cartData = structuredClone(cartItems);
    const idStr = String(itemId);
    let finalQuantity = quantity;

    if (quantity <= 0) {
      if (cartData[idStr]) delete cartData[idStr][size];
      if (cartData[idStr] && Object.keys(cartData[idStr]).length === 0)
        delete cartData[idStr];
    } else {
      // Cap at the per-line abuse limit the server also enforces.
      finalQuantity = Math.min(quantity, MAX_CART_QTY);
      if (!cartData[idStr]) cartData[idStr] = {};
      cartData[idStr][size] = finalQuantity;
    }

    setCartItems(cartData);

    if (userId) {
      await updateCartInDB(Number(itemId), size, finalQuantity);
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

  // Memoized so consumers (e.g. the /orders page) can safely depend on it for
  // focus/interval refresh without re-subscribing every render (G1).
  const refreshOrders = useCallback(async () => {
    if (userId) {
      const result = await getUserOrders();
      if (result.success && result.orders) {
        setUserOrders(result.orders);
      }
    }
  }, [userId]);
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // G10 — when the server rejects checkout because something is unavailable,
  // pull fresh products and drop every cart line whose variant is switched off
  // (or gone), so the shopper isn't stuck retrying an impossible order.
  // Quantities are left alone. Signed-in users' DB cart is synced to match.
  const reconcileCartWithStock = async () => {
    const data = await getAllProducts(1, 100);
    const fresh =
      data?.products && Array.isArray(data.products)
        ? (data.products as unknown as Product[])
        : [];
    setProducts(fresh);

    const availableFor = (productId: string, size: string): boolean => {
      const product = fresh.find((p) => String(p.id) === productId);
      const variant = product?.variants.find((v) => v.volume === size);
      return variant ? variant.isAvailable : false;
    };

    setCartItems((prev) => {
      const next: CartItems = {};
      for (const productId in prev) {
        for (const size in prev[productId]) {
          if (availableFor(productId, size)) {
            if (!next[productId]) next[productId] = {};
            next[productId][size] = prev[productId][size];
          } else if (userId) {
            // Keep the persisted DB cart in step for signed-in users.
            updateCartInDB(Number(productId), size, 0);
          }
        }
      }
      return next;
    });
  };

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

    const result = await createOrder(orderPayload, formattedItems);

    if (result.success) {
      setCartItems({});
      if (userId) {
        await refreshOrders();
      }
      localStorage.removeItem("rose_misk_cart");

      return { success: true, orderId: result.orderId };
    } else {
      // G10 — drop unavailable lines so the shopper can retry.
      if (result.reason === "unavailable") {
        await reconcileCartWithStock();
      }
      return {
        success: false,
        message: result.message || "Failed to create order",
        reason: result.reason,
        fieldErrors: result.fieldErrors,
      };
    }
  };

  const value = {
    products,
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
    subtotal,
    placeOrder,
    userOrders,
    setUserOrders,
    refreshOrders,
    getPriceBySize,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
