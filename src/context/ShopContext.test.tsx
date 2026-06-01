import React, { useContext } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ShopContextProvider, { ShopContext } from "./ShopContext";
import { useRouter } from "next/navigation";
import { getAllProducts } from "../../lib/actions/product.actions";
import {
  getUserCart,
  updateCartInDB,
  mergeCartAction,
} from "../../lib/actions/cart.actions";
import { getUserOrders, createOrder } from "../../lib/actions/order.actions";
import { authClient } from "../../lib/auth-client";

// 1. Mock Next.js Navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

// 2. Mock Server Actions
vi.mock("../../lib/actions/product.actions", () => ({
  getAllProducts: vi.fn(),
}));

vi.mock("../../lib/actions/cart.actions", () => ({
  getUserCart: vi.fn(),
  updateCartInDB: vi.fn(),
  mergeCartAction: vi.fn(),
}));

vi.mock("../../lib/actions/order.actions", () => ({
  getUserOrders: vi.fn(),
  createOrder: vi.fn(),
}));

// 3. Mock Auth Client
vi.mock("../../lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

// داتا وهمية مختصرة
const mockProducts = [
  {
    id: 1,
    name: "Misk Rose Perfume",
    slug: "misk-rose",
    description: "Premium fragrance",
    images: ["image1.jpg"],
    company: "Rose Misk",
    isFeatured: true,
    variants: [
      { id: 101, volume: "50ml", price: 100, stock: 10 },
      { id: 102, volume: "100ml", price: 180, stock: 5 },
    ],
  },
];

const TestComponent = () => {
  const context = useContext(ShopContext);
  if (!context) return <div>No Context</div>;

  return (
    <div>
      <div data-testid="cart-count">{context.getCartCount}</div>
      <div data-testid="subtotal">{context.subtotal}</div>
      <div data-testid="total">{context.total}</div>
      <button
        data-testid="add-btn"
        onClick={() => context.addToCart(1, "50ml")}
      >
        Add 50ml
      </button>
      <button
        data-testid="update-btn"
        onClick={() => context.updateQuantity(1, "50ml", 0)}
      >
        Remove Item
      </button>
      <button data-testid="checkout-btn" onClick={context.goToCheckout}>
        Go To Checkout
      </button>
    </div>
  );
};

describe("ShopContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // حل مشكلة الـ TypeScript Error 2322 باستخدام (as any)
    vi.mocked(getAllProducts).mockResolvedValue({
      products: mockProducts as any,
      totalPages: 1,
      totalCount: 1,
      currentPage: 1,
    } as any);

    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it("should load products on mount and calculate correct totals", async () => {
    render(
      <ShopContextProvider>
        <TestComponent />
      </ShopContextProvider>
    );

    await waitFor(() => {
      expect(getAllProducts).toHaveBeenCalledWith(1, 100);
    });

    expect(screen.getByTestId("subtotal").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("80");
  });

  it("should update local state and localStorage when adding items (Guest User)", async () => {
    render(
      <ShopContextProvider>
        <TestComponent />
      </ShopContextProvider>
    );

    // انتظار تحميل المنتجات أولاً عشان السعر يتحسب صح (يعالج خطأ الـ 0 بدل 100)
    await waitFor(() => {
      expect(getAllProducts).toHaveBeenCalled();
    });

    const addBtn = screen.getByTestId("add-btn");

    // استخدام act لمعالجة تحذير React State Update
    act(() => {
      fireEvent.click(addBtn);
    });

    expect(screen.getByTestId("cart-count").textContent).toBe("1");
    expect(screen.getByTestId("subtotal").textContent).toBe("100");
    expect(screen.getByTestId("total").textContent).toBe("180");

    const savedCart = JSON.parse(
      localStorage.getItem("rose_misk_cart") || "{}"
    );
    expect(savedCart["1"]["50ml"]).toBe(1);
    expect(updateCartInDB).not.toHaveBeenCalled();
  });

  it("should sync and update database cart when user is logged in", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user_vibe_123" } },
    } as any);
    vi.mocked(getUserCart).mockResolvedValue({ success: true, cartData: {} });
    vi.mocked(getUserOrders).mockResolvedValue({ success: true, orders: [] });

    render(
      <ShopContextProvider>
        <TestComponent />
      </ShopContextProvider>
    );

    await waitFor(() => {
      expect(getUserCart).toHaveBeenCalledWith("user_vibe_123");
    });

    const addBtn = screen.getByTestId("add-btn");

    act(() => {
      fireEvent.click(addBtn);
    });

    expect(updateCartInDB).toHaveBeenCalledWith("user_vibe_123", 1, "50ml", 1);
  });

  it("should merge local cart into DB cart upon login if local cart has items", async () => {
    localStorage.setItem(
      "rose_misk_cart",
      JSON.stringify({ "1": { "100ml": 2 } })
    );

    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "user_vibe_123" } },
    } as any);
    vi.mocked(getUserCart).mockResolvedValue({
      success: true,
      cartData: { "1": { "100ml": 2 } },
    });
    vi.mocked(getUserOrders).mockResolvedValue({ success: true, orders: [] });

    render(
      <ShopContextProvider>
        <TestComponent />
      </ShopContextProvider>
    );

    await waitFor(() => {
      expect(mergeCartAction).toHaveBeenCalledWith("user_vibe_123", {
        "1": { "100ml": 2 },
      });
      expect(localStorage.getItem("rose_misk_cart")).toBeNull();
    });
  });

  it("should navigate to checkout page when goToCheckout is triggered", async () => {
    render(
      <ShopContextProvider>
        <TestComponent />
      </ShopContextProvider>
    );

    // ننتظر تحميل المنتجات عشان تحذيرات React
    await waitFor(() => {
      expect(getAllProducts).toHaveBeenCalled();
    });

    const checkoutBtn = screen.getByTestId("checkout-btn");

    act(() => {
      fireEvent.click(checkoutBtn);
    });

    expect(mockPush).toHaveBeenCalledWith("/placeorder");
  });

  it("should clear cart items state and localStorage on successful placeOrder", async () => {
    vi.mocked(createOrder).mockResolvedValue({ success: true, orderId: 5005 });

    let contextRef: any;
    const AccessorComponent = () => {
      contextRef = useContext(ShopContext);
      return null;
    };

    render(
      <ShopContextProvider>
        <AccessorComponent />
      </ShopContextProvider>
    );

    act(() => {
      contextRef.setCartItems({ "1": { "50ml": 2 } });
    });

    const mockFormData = {
      firstName: "Ahmed",
      lastName: "Ali",
      email: "ahmed@example.com",
      street: "Mofia St",
      city: "Menofia",
      state: "المنوفية",
      zipcode: "12345",
      country: "Egypt",
      phone: "01000000000",
    };

    let result;
    await waitFor(async () => {
      result = await contextRef.placeOrder(
        { "1": { "50ml": 2 } },
        "COD",
        mockFormData,
        280
      );
    });

    expect(createOrder).toHaveBeenCalled();
    expect(result).toEqual({ success: true, orderId: 5005 });
    expect(contextRef.cartItems).toEqual({});
    expect(localStorage.getItem("rose_misk_cart")).toBeNull();
  });
});
