"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { appendEvent, ensureActorHash } from "./provenance";

export async function acceptJob(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Unauthorized" };
    }

    // Check if order exists and is available
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: {
          include: {
            farmer: true,
          },
        },
        buyer: true,
        shipment: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "ACCEPTED") {
      return { success: false, error: "Order is not available for transport" };
    }

    if (order.shipment) {
      return { success: false, error: "Job already taken by another transporter" };
    }

    // Create shipment with this transporter
    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        transporterId: session.user.id,
      },
    });

    // Update order status to confirmed
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });

    // Append SHIPMENT_CREATED event to provenance chain
    const transporterHashId = await ensureActorHash(session.user.id);
    await appendEvent(orderId, "SHIPMENT_CREATED", session.user.id, {
      orderId,
      shipmentId: shipment.id,
      transporterPublicHashId: transporterHashId,
      status: "PENDING",
      at: new Date().toISOString(),
    });

    // Notify farmer
    await createNotification(
      order.listing.farmerId,
      "Transporter Assigned",
      `${session.user.name} has accepted the delivery job for ${order.quantity}kg of ${order.listing.cropType}`,
      `/shipments/${shipment.id}`
    );

    // Notify buyer
    await createNotification(
      order.buyerId,
      "Transporter Assigned",
      `A transporter has been assigned to your order. Your shipment will be picked up soon.`,
      `/shipments/${shipment.id}`
    );

    revalidatePath("/dashboard/transporter");
    revalidatePath("/dashboard/farmer");
    revalidatePath("/dashboard/buyer");
    revalidatePath(`/jobs/${shipment.id}`);

    return { success: true, shipment };
  } catch (error) {
    console.error("Error accepting job:", error);
    return { success: false, error: "Failed to accept job" };
  }
}

export async function updateAvailability(isAvailable: boolean) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Unauthorized" };
    }

    const profile = await prisma.transporterProfile.update({
      where: { userId: session.user.id },
      data: { isAvailable },
    });

    revalidatePath("/dashboard/transporter");

    return { success: true, profile };
  } catch (error) {
    console.error("Error updating availability:", error);
    return { success: false, error: "Failed to update availability" };
  }
}

export async function updateTransporterProfile(data: {
  vehicleType?: string;
  maxCapacity?: number;
  currentLocation?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Unauthorized" };
    }

    const profile = await prisma.transporterProfile.update({
      where: { userId: session.user.id },
      data,
    });

    revalidatePath("/dashboard/transporter");

    return { success: true, profile };
  } catch (error) {
    console.error("Error updating transporter profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getAvailableJobs() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Unauthorized" };
    }

    // Get accepted orders that don't have shipments yet
    const jobs = await prisma.order.findMany({
      where: {
        status: "ACCEPTED",
        shipment: null, // No shipment assigned yet
      },
      include: {
        listing: {
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
        },
        buyer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, jobs };
  } catch (error) {
    console.error("Error fetching available jobs:", error);
    return { success: false, error: "Failed to fetch jobs" };
  }
}

export async function manualAssignTransporter(orderId: string, transporterId: string) {
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

    // Check if shipment already exists
    const existing = await prisma.shipment.findUnique({
      where: { orderId },
    });

    if (existing) {
      return { success: false, error: "Shipment already created" };
    }

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        transporterId,
      },
    });

    // Append SHIPMENT_CREATED event to provenance chain
    const transporterHashId = await ensureActorHash(transporterId);
    await appendEvent(orderId, "SHIPMENT_CREATED", transporterId, {
      orderId,
      shipmentId: shipment.id,
      transporterPublicHashId: transporterHashId,
      status: "PENDING",
      at: new Date().toISOString(),
    });

    // Notify transporter
    await createNotification(
      transporterId,
      "New Job Assigned",
      `You have been assigned a delivery job for ${order.quantity}kg`,
      `/jobs/${shipment.id}`
    );

    revalidatePath("/dashboard/farmer");

    return { success: true, shipment };
  } catch (error) {
    console.error("Error assigning transporter:", error);
    return { success: false, error: "Failed to assign transporter" };
  }
}

export async function getAllTransporters() {
  try {
    const transporters = await prisma.user.findMany({
      where: {
        role: "TRANSPORTER",
      },
      select: {
        id: true,
        name: true,
        location: true,
        transporterProfile: true,
        ratingsReceived: {
          select: {
            score: true,
          },
        },
      },
    });

    // Calculate average rating for each transporter
    const transportersWithRating = transporters.map((t) => ({
      ...t,
      averageRating:
        t.ratingsReceived.length > 0
          ? t.ratingsReceived.reduce((sum, r) => sum + r.score, 0) /
            t.ratingsReceived.length
          : 0,
    }));

    return { success: true, transporters: transportersWithRating };
  } catch (error) {
    console.error("Error fetching transporters:", error);
    return { success: false, error: "Failed to fetch transporters" };
  }
}


