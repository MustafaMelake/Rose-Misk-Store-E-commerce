import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "../../../../../lib/prisma"; // تأكد من مسار بريزما عندك

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // التعامل مع حدث نجاح الدفع
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      // ✅ تحديث حالة الطلب في قاعدة البيانات
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: { status: "AWAITING_PAYMENT" },
      });
      console.log(`✅ Order ${orderId} updated to PAID`);
    }
  }

  return NextResponse.json({ received: true });
}
