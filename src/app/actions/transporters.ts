"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function acceptJob(shipmentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Unauthorized" };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            listing: {
              include: {
                farmer: true,
              },
            },
            buyer: true,
          },
        },
      },
    });

    if (!shipment || shipment.transporterId !== session.user.id) {
      return { success: false, error: "Unauthorized or job already assigned" };
    }

    // Job is already assigned to this transporter, just confirm acceptance
    // Notify farmer and buyer
    await createNotification(
      shipment.order.listing.farmerId,
      "Transporter Confirmed",
      `Transporter has confirmed the job for ${shipment.order.quantity}kg of ${shipment.order.listing.cropType}`,
      `/shipments/${shipmentId}`
    );

    await createNotification(
      shipment.order.buyerId,
      "Transporter Confirmed",
      "Your shipment is ready to be picked up",
      `/shipments/${shipmentId}`
    );

    revalidatePath("/dashboard/transporter");
    revalidatePath(`/jobs/${shipmentId}`);

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

    // Get shipments assigned to this transporter that are still pending
    const jobs = await prisma.shipment.findMany({
      where: {
        transporterId: session.user.id,
        status: "PENDING",
      },
      include: {
        order: {
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


