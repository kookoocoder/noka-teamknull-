"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { appendEvent, ensureActorHash } from "./provenance";

export async function updateShipmentStatus(
  shipmentId: string,
  status: "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED",
  currentLocation?: string
) {
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
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = { status };

    if (status === "PICKED_UP" && !shipment.pickupTime) {
      updateData.pickupTime = new Date();
    }

    if (status === "DELIVERED" && !shipment.deliveryTime) {
      updateData.deliveryTime = new Date();
    }

    if (currentLocation) {
      updateData.currentLocation = currentLocation;
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    // Append shipment status update to provenance chain
    const eventType = status === "DELIVERED" ? "DELIVERED" : "SHIPMENT_STATUS_UPDATED";
    const transporterHashId = await ensureActorHash(session.user.id);

    await appendEvent(shipment.orderId, eventType, session.user.id, {
      orderId: shipment.orderId,
      shipmentId,
      transporterPublicHashId: transporterHashId,
      status,
      notes: currentLocation ? `Location: ${currentLocation}` : undefined,
      at: new Date().toISOString(),
    });

    // Update order status
    if (status === "DELIVERED") {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: "DELIVERED" },
      });

      // Update listing quantity
      await prisma.produceListing.update({
        where: { id: shipment.order.listingId },
        data: {
          quantity: {
            decrement: shipment.order.quantity,
          },
        },
      });
    }

    // Notify farmer and buyer
    const statusMessage = {
      PICKED_UP: "Your order has been picked up",
      IN_TRANSIT: "Your order is in transit",
      DELIVERED: "Your order has been delivered",
      PENDING: "Shipment status updated",
    }[status];

    await createNotification(
      shipment.order.buyerId,
      "Shipment Update",
      statusMessage,
      `/shipments/${shipmentId}`
    );

    await createNotification(
      shipment.order.listing.farmer.id,
      "Shipment Update",
      statusMessage,
      `/shipments/${shipmentId}`
    );

    revalidatePath("/dashboard/transporter");
    revalidatePath(`/shipments/${shipmentId}`);

    return { success: true, shipment: updated };
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return { success: false, error: "Failed to update shipment status" };
  }
}

export async function updateLocation(shipmentId: string, location: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Unauthorized" };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment || shipment.transporterId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: { currentLocation: location },
    });

    revalidatePath(`/shipments/${shipmentId}`);

    return { success: true, shipment: updated };
  } catch (error) {
    console.error("Error updating location:", error);
    return { success: false, error: "Failed to update location" };
  }
}

export async function getShipmentDetails(shipmentId: string) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            listing: {
              select: {
                cropType: true,
                location: true,
                productHashId: true,
                farmer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    location: true,
                    publicHashId: true,
                  },
                },
              },
            },
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                publicHashId: true,
              },
            },
            provenanceChain: {
              include: {
                events: {
                  orderBy: { index: "asc" },
                },
              },
            },
          },
        },
        transporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            publicHashId: true,
            transporterProfile: true,
          },
        },
        storageLogs: {
          orderBy: { createdAt: "desc" },
        },
        ratings: true,
      },
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    return { success: true, shipment };
  } catch (error) {
    console.error("Error fetching shipment details:", error);
    return { success: false, error: "Failed to fetch shipment details" };
  }
}

export async function getTransporterShipments(transporterId: string) {
  try {
    const shipments = await prisma.shipment.findMany({
      where: { transporterId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            listing: {
              select: {
                cropType: true,
                location: true,
                productHashId: true,
              },
              include: {
                farmer: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                    publicHashId: true,
                  },
                },
              },
            },
            buyer: {
              select: {
                id: true,
                name: true,
                address: true,
                publicHashId: true,
              },
            },
          },
        },
        transporter: {
          select: {
            id: true,
            name: true,
            publicHashId: true,
          },
        },
      },
    });

    return { success: true as const, shipments };
  } catch (error) {
    console.error("Error fetching transporter shipments:", error);
    return { success: false as const, error: "Failed to fetch shipments", shipments: [] as any[] };
  }
}


