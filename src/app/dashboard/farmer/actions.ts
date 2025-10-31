"use server";

import { redirect } from "next/navigation";
import { acceptOrder, rejectOrder } from "@/app/actions/orders";

export async function handleAcceptOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const result = await acceptOrder(orderId);

  if (!result.success) {
    redirect(`/dashboard/farmer?error=${encodeURIComponent(result.error || "Failed to accept order")}`);
  }

  redirect(`/dashboard/farmer?success=${encodeURIComponent("Order accepted successfully")}`);
}

export async function handleRejectOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const result = await rejectOrder(orderId);

  if (!result.success) {
    redirect(`/dashboard/farmer?error=${encodeURIComponent(result.error || "Failed to reject order")}`);
  }

  redirect(`/dashboard/farmer?success=${encodeURIComponent("Order rejected successfully")}`);
}
