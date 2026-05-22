"use server";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type OrderStatusType =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "AWAITING_PAYMENT";

export async function createOrder(
  userId: string | null,
  orderData: any,
  items: { id: number; size: string; quantity: number }[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let serverTotal = 0;
      const orderItemsToCreate = [];

      for (const item of items) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: item.id, volume: item.size },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(
            `المنتج ذو الحجم ${item.size} غير متوفر بالكمية المطلوبة.`
          );
        }

        serverTotal += variant.price * item.quantity;

        orderItemsToCreate.push({
          productId: item.id,
          quantity: item.quantity,
          price: variant.price,
          size: item.size,
        });

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const deliveryFee = 80;
      const finalTotal = serverTotal + deliveryFee;

      const initialStatus = (
        orderData.paymentMethod === "CARD" ? "AWAITING_PAYMENT" : "PENDING"
      ) as OrderStatusType;

      const orderCreationData: any = {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        address: orderData.address,
        totalAmount: finalTotal,
        paymentMethod: orderData.paymentMethod || "COD",
        status: initialStatus,
        items: { create: orderItemsToCreate },
      };

      if (userId) {
        orderCreationData.userId = userId;
      }

      const newOrder = await tx.order.create({
        data: orderCreationData,
      });

      if (userId) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return newOrder;
    });

    // if (result && result.customerEmail) {
    //   resend.emails.send({
    //     from: "Rose Misk <onboarding@resend.dev>", // استبدله بدومينك المدفوع لاحقاً عند الربط
    //     to: [result.customerEmail],
    //     subject: `تأكيد طلبك من متجر روز مسك لعطور #${result.id}`,
    //     html: `
    //       <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    //         <div style="background-color: #111827; padding: 30px; text-align: center; border-bottom: 3px solid #d4af37;">
    //           <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">رُوز مِسك</h1>
    //           <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 14px;">عطور فاخرة تليق بحضورك</p>
    //         </div>

    //         <div style="padding: 30px; background-color: #ffffff; color: #1f2937;">
    //           <h2 style="color: #111827; margin-top: 0;">شكراً لثقتك بنا، يا ${result.customerName} ✨</h2>
    //           <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
    //             يسعدنا إبلاغك بأننا قمنا باستلام طلبك بنجاح، وجاري الآن تجهيزه لكي يصلك في أسرع وقت.
    //           </p>

    //           <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px; margin: 25px 0;">
    //             <h3 style="margin-top: 0; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;"> تفاصيل الطلب:</h3>
    //             <p style="margin: 8px 0;"><strong>رقم الطلب:</strong> <span style="color: #d4af37; font-weight: bold;">#${result.id}</span></p>
    //             <p style="margin: 8px 0;"><strong>طريقة الدفع:</strong> ${result.paymentMethod === "CARD" ? "بطاقة ائتمانية" : "الدفع عند الاستلام"}</p>
    //             <p style="margin: 8px 0;"><strong>إجمالي المبلغ:</strong> ${result.totalAmount} جنيه مصري (شامل الشحن)</p>
    //             <p style="margin: 8px 0;"><strong>العنوان المشحون إليه:</strong> ${result.address}</p>
    //           </div>

    //           <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 30px;">
    //             إذا كان لديك أي استفسار، يمكنك الرد على هذا الإيميل مباشرة أو التواصل مع خدمة العملاء.
    //           </p>
    //         </div>

    //         <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
    //           <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2026 Rose Misk Store. جميع الحقوق محفوظة.</p>
    //         </div>
    //       </div>
    //     `,
    //   }).catch((emailError) => {
    //     // لو حصل مشكلة في السيرفر بتاع الإيميل نطبعها في الكونسول بس مباكش الأوردر نفسه
    //     console.error("Failed to send order email:", emailError.message);
    //   });
    // }

    revalidatePath("/orders");

    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("Order Action Error:", error.message);
    return { success: false, message: error.message };
  }
}

export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: order.status, // PENDING, DELIVERED, etc.
      payment: order.paymentMethod,
      total: order.totalAmount,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        image: item.product.images[0] || "",
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return { success: true, orders: formattedOrders };
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return { success: false, message: error.message };
  }
}

export async function getAllOrders() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized Access: Admins only." };
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return { success: false, message: "Failed to fetch orders" };
  }
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatusType
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return { success: false, message: "Order not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      // 3. لو الآدمن عمل للطلب CANCELLED (وهو مكنش ملغي قبل كده)
      // لازم نرجع الكميات (Stock) للمخزن
      if (newStatus === "CANCELLED" && existingOrder.status !== "CANCELLED") {
        for (const item of existingOrder.items) {
          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, volume: item.size },
          });

          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }
    });

    // نعمل ريفريش للصفحات عشان الداتا تتحدث
    revalidatePath("/admin/orders");
    revalidatePath("/admin"); // ضيف مسار الداشبورد بتاعك هنا

    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, message: "Update failed" };
  }
}
