"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StorageLogSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function createStorageLog(data: {
  shipmentId: string;
  temperature?: number;
  humidity?: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = StorageLogSchema.parse(data);

    // Verify shipment exists and user has access
    const shipment = await prisma.shipment.findUnique({
      where: { id: validated.shipmentId },
      include: {
        order: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    // Check if user is transporter, farmer, or buyer of this shipment
    const isAuthorized =
      shipment.transporterId === session.user.id ||
      shipment.order.listing.farmerId === session.user.id ||
      shipment.order.buyerId === session.user.id;

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    const log = await prisma.storageLog.create({
      data: {
        shipmentId: validated.shipmentId,
        temperature: validated.temperature,
        humidity: validated.humidity,
        notes: validated.notes,
      },
    });

    // Check for unsafe conditions and send alerts
    if (validated.temperature && validated.temperature > 10) {
      // Alert for high temperature (>10°C for perishables)
      await createNotification(
        shipment.order.listing.farmerId,
        "Storage Alert",
        `High temperature detected (${validated.temperature}°C) for shipment`,
        `/shipments/${validated.shipmentId}`
      );

      await createNotification(
        shipment.order.buyerId,
        "Storage Alert",
        `High temperature detected (${validated.temperature}°C) for your order`,
        `/shipments/${validated.shipmentId}`
      );
    }

    revalidatePath(`/shipments/${validated.shipmentId}`);

    return { success: true, log };
  } catch (error) {
    console.error("Error creating storage log:", error);
    return { success: false, error: "Failed to create storage log" };
  }
}

export async function getShipmentLogs(shipmentId: string) {
  try {
    const logs = await prisma.storageLog.findMany({
      where: { shipmentId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, logs };
  } catch (error) {
    console.error("Error fetching storage logs:", error);
    return { success: false, error: "Failed to fetch storage logs" };
  }
}


