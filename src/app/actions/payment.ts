"use server";

import { processPayment } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { appendEvent } from "./provenance";

export async function handlePayment(orderId: string, cardNumber: string, expiryDate: string, cvv: string) {
  const result = await processPayment(orderId, cardNumber, expiryDate, cvv);
  
  if (result.success) {
    // Get order with buyer info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, totalPrice: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });

    // Append PAYMENT_CONFIRMED event to provenance chain
    await appendEvent(orderId, "PAYMENT_CONFIRMED", order.buyerId, {
      orderId,
      status: "CONFIRMED",
      totalPrice: order.totalPrice,
      at: new Date().toISOString(),
    });
  }
  
  return result;
}

