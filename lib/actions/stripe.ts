"use server";

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  orderId: string,
  amount: number,
  items: any[],
  delivery_fee: number
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    // 1. تحضير المنتجات الأساسية
    const line_items = items.map((item) => ({
      price_data: {
        currency: "egp",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // السعر الأصلي للمنتج بالقرش
      },
      quantity: item.quantity,
    }));

    // 2. إضافة مصاريف الشحن كبند منفصل (لو أكبر من صفر)
    if (delivery_fee > 0) {
      line_items.push({
        price_data: {
          currency: "egp",
          product_data: {
            name: "10",
          },
          unit_amount: Math.round(delivery_fee * 100), // سعر الشحن بالقرش
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items, // نمرر القائمة الكاملة هنا
      mode: "payment",
      success_url: `${cleanBaseUrl}/orders`,
      cancel_url: `${cleanBaseUrl}/cart`,
      metadata: {
        orderId: orderId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error("STRIPE_ERROR_DETAILS:", error.raw?.message || error.message);
    throw new Error("حدث خطأ أثناء الاتصال بـ Stripe");
  }
}
