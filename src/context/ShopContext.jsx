import { createContext, useMemo, useState } from "react";
import { products } from "../assets/assets";
import { useNavigate } from "react-router-dom";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [userOrders, setUserOrders] = useState([]);
  const closeSearch = () => setSearchOpen(false);
  const navigate = useNavigate();

  const goToCheckout = () => {
    navigate("/placeorder");
  };

  const addToCart = (itemId, size) => {
    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    } else {
      cartData[itemId] = { [size]: 1 };
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

  const currency = "L.E";
  const delivery_fee = 10;

  // دالة لحساب السعر حسب الحجم
  const getPriceBySize = (productId, size) => {
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return 0;

    let price = product.price;
    if (size === "50ML") price *= 1.67;
    else if (size === "100ML") price *= 3.33;

    return price;
  };

  // حساب subtotal حسب السعر المعدل لكل حجم
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

  const placeOrder = (cartData, selectedPaymentMethod) => {
    const formattedItems = Object.entries(cartData)
      .flatMap(([productId, sizes]) =>
        Object.entries(sizes).map(([size, quantity]) => {
          const product = products.find(
            (p) => Number(p.id) === Number(productId)
          );

          if (!product) {
            console.warn("Product not found for ID:", productId);
            return null;
          }

          return {
            id: product.id,
            name: product.name,
            image: Array.isArray(product.image)
              ? product.image[0]
              : product.image,
            size,
            quantity: Number(quantity) || 0,
            price: getPriceBySize(productId, size),
          };
        })
      )
      .filter((item) => item !== null);

    // تأكيد أنه Array دايماً
    const safeItems = Array.isArray(formattedItems) ? formattedItems : [];

    setUserOrders((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        items: safeItems,
        payment: selectedPaymentMethod,
        total: subtotal + delivery_fee,
        status: "Pending",
      },
    ]);

    setCartItems({});
    navigate("/orders");
  };

  const value = {
    products,
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

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
