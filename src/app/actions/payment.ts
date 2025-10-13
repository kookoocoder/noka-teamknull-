"use server";

import { processPayment } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export async function handlePayment(orderId: string, cardNumber: string, expiryDate: string, cvv: string) {
  const result = await processPayment(orderId, cardNumber, expiryDate, cvv);
  
  if (result.success) {
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });
  }
  
  return result;
}

