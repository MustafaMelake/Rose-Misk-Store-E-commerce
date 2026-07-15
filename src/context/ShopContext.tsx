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
<<<<<<< HEAD
  delivery_fee: number;
=======
>>>>>>> client-release
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
<<<<<<< HEAD
  total: number;
=======
>>>>>>> client-release
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
<<<<<<< HEAD
  const delivery_fee = 80;
=======
>>>>>>> client-release

  // 1. تحميل المنتجات
  useEffect(() => {
    const fetchAll = async () => {
      const data = await getAllProducts(1, 100);
<<<<<<< HEAD
      setProducts(
        data?.products && Array.isArray(data.products) ? data.products : []
=======
      // Server DTO -> client model: variant prices are already numbers at
      // runtime (serialized from Prisma.Decimal in the action).
      setProducts(
        data?.products && Array.isArray(data.products)
          ? (data.products as unknown as Product[])
          : []
>>>>>>> client-release
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
<<<<<<< HEAD
          await mergeCartAction(userId, localCart);
        }
        const result = await getUserCart(userId);
=======
          await mergeCartAction(localCart);
        }
        const result = await getUserCart();
>>>>>>> client-release
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

<<<<<<< HEAD
  const addToCart = async (itemId: string | number, size: string) => {
    let cartData = structuredClone(cartItems);
    const idStr = String(itemId);

    if (cartData[idStr]) {
      cartData[idStr][size] = (cartData[idStr][size] || 0) + 1;
=======
  // Available stock for a variant, or null if the product/variant isn't loaded
  // yet (in which case we don't block — the server still enforces stock).
  const getVariantStock = (
    productId: string | number,
    size: string
  ): number | null => {
    const product = products.find((p) => String(p.id) === String(productId));
    const variant = product?.variants.find((v) => v.volume === size);
    return variant ? variant.stock : null;
  };

  const addToCart = async (itemId: string | number, size: string) => {
    const idStr = String(itemId);
    const currentQty = cartItems[idStr]?.[size] || 0;

    // Don't let shoppers add more than what's physically in stock.
    const stock = getVariantStock(itemId, size);
    if (stock !== null && currentQty + 1 > stock) {
      return;
    }

    let cartData = structuredClone(cartItems);
    if (cartData[idStr]) {
      cartData[idStr][size] = currentQty + 1;
>>>>>>> client-release
    } else {
      cartData[idStr] = { [size]: 1 };
    }

    setCartItems(cartData);

    if (userId) {
<<<<<<< HEAD
      await updateCartInDB(userId, Number(itemId), size, cartData[idStr][size]);
=======
      await updateCartInDB(Number(itemId), size, cartData[idStr][size]);
>>>>>>> client-release
    }
  };

  const updateQuantity = async (
    itemId: string | number,
    size: string,
    quantity: number
  ) => {
    let cartData = structuredClone(cartItems);
    const idStr = String(itemId);
<<<<<<< HEAD
=======
    let finalQuantity = quantity;
>>>>>>> client-release

    if (quantity <= 0) {
      if (cartData[idStr]) delete cartData[idStr][size];
      if (cartData[idStr] && Object.keys(cartData[idStr]).length === 0)
        delete cartData[idStr];
    } else {
<<<<<<< HEAD
      if (!cartData[idStr]) cartData[idStr] = {};
      cartData[idStr][size] = quantity;
=======
      // Cap the requested quantity to the available stock.
      const stock = getVariantStock(itemId, size);
      finalQuantity = stock !== null ? Math.min(quantity, stock) : quantity;
      if (!cartData[idStr]) cartData[idStr] = {};
      cartData[idStr][size] = finalQuantity;
>>>>>>> client-release
    }

    setCartItems(cartData);

    if (userId) {
<<<<<<< HEAD
      await updateCartInDB(userId, Number(itemId), size, quantity);
=======
      await updateCartInDB(Number(itemId), size, finalQuantity);
>>>>>>> client-release
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

<<<<<<< HEAD
  const total = subtotal + delivery_fee;

  const fetchUserOrders = async () => {
    if (userId) {
      const result = await getUserOrders(userId);
=======
  const fetchUserOrders = async () => {
    if (userId) {
      const result = await getUserOrders();
>>>>>>> client-release
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

<<<<<<< HEAD
    const result = await createOrder(
      userId || null,
      orderPayload,
      formattedItems
    );
=======
    const result = await createOrder(orderPayload, formattedItems);
>>>>>>> client-release

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
<<<<<<< HEAD
    delivery_fee,
=======
>>>>>>> client-release
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
<<<<<<< HEAD
    total,
=======
>>>>>>> client-release
    subtotal,
    placeOrder,
    userOrders,
    setUserOrders,
    getPriceBySize,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
