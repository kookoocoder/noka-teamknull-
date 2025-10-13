"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { autoMatchTransporter } from "@/lib/matching";

export async function placeOrder(data: {
  listingId: string;
  quantity: number;
  deliveryAddress: string;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "BUYER") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = OrderSchema.parse(data);

    // Check listing availability
    const listing = await prisma.produceListing.findUnique({
      where: { id: validated.listingId },
    });

    if (!listing || listing.status !== "AVAILABLE") {
      return { success: false, error: "Listing not available" };
    }

    if (listing.quantity < validated.quantity) {
      return { success: false, error: "Insufficient quantity available" };
    }

    const totalPrice = validated.quantity * listing.pricePerKg;

    const order = await prisma.order.create({
      data: {
        listingId: validated.listingId,
        buyerId: session.user.id,
        quantity: validated.quantity,
        totalPrice,
        deliveryAddress: validated.deliveryAddress,
        notes: validated.notes,
      },
    });

    // Notify farmer
    await createNotification(
      listing.farmerId,
      "New Order Received",
      `You have a new order for ${validated.quantity}kg of ${listing.cropType}`,
      `/orders/${order.id}`
    );

    revalidatePath("/marketplace");
    revalidatePath("/orders");

    return { success: true, order };
  } catch (error) {
    console.error("Error placing order:", error);
    return { success: false, error: "Failed to place order" };
  }
}

export async function acceptOrder(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "FARMER") {
      return { success: false, error: "Unauthorized" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { listing: true, buyer: true },
    });

    if (!order || order.listing.farmerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "ACCEPTED" },
    });

    // Try to auto-match transporter
    const transporterId = await autoMatchTransporter(orderId);

    if (transporterId) {
      // Create shipment
      const shipment = await prisma.shipment.create({
        data: {
          orderId,
          transporterId,
        },
      });

      // Notify transporter
      await createNotification(
        transporterId,
        "New Job Available",
        `You have been matched with a delivery job for ${order.quantity}kg of ${order.listing.cropType}`,
        `/jobs/${shipment.id}`
      );

      // Notify buyer
      await createNotification(
        order.buyerId,
        "Order Accepted",
        `Your order has been accepted and a transporter has been assigned`,
        `/shipments/${shipment.id}`
      );
    } else {
      // Notify buyer (no transporter yet)
      await createNotification(
        order.buyerId,
        "Order Accepted",
        `Your order has been accepted. Awaiting transporter assignment.`,
        `/orders/${orderId}`
      );
    }

    revalidatePath("/dashboard/farmer");
    revalidatePath("/orders");

    return { success: true, order: updatedOrder, transporterId };
  } catch (error) {
    console.error("Error accepting order:", error);
    return { success: false, error: "Failed to accept order" };
  }
}

export async function rejectOrder(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "FARMER") {
      return { success: false, error: "Unauthorized" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { listing: true },
    });

    if (!order || order.listing.farmerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "REJECTED" },
    });

    // Notify buyer
    await createNotification(
      order.buyerId,
      "Order Rejected",
      `Your order for ${order.quantity}kg has been rejected`,
      `/orders/${orderId}`
    );

    revalidatePath("/dashboard/farmer");
    revalidatePath("/orders");

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error rejecting order:", error);
    return { success: false, error: "Failed to reject order" };
  }
}

export async function getBuyerOrders(buyerId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
        shipment: {
          include: {
            transporter: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function getFarmerOrders(farmerId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        listing: {
          farmerId,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        shipment: {
          include: {
            transporter: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching farmer orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function getMarketplace(filters?: {
  cropType?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  try {
    const where: any = {
      status: "AVAILABLE",
    };

    if (filters?.cropType) {
      where.cropType = { contains: filters.cropType, mode: "insensitive" };
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.pricePerKg = {};
      if (filters.minPrice !== undefined) {
        where.pricePerKg.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.pricePerKg.lte = filters.maxPrice;
      }
    }

    if (filters?.search) {
      where.OR = [
        { cropType: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const listings = await prisma.produceListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            phone: true,
          },
        },
      },
    });

    return { success: true, listings };
  } catch (error) {
    console.error("Error fetching marketplace:", error);
    return { success: false, error: "Failed to fetch marketplace" };
  }
}


