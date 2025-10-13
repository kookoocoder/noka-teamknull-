"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RatingSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function submitRating(data: {
  toUserId: string;
  shipmentId: string;
  score: number;
  comment?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = RatingSchema.parse(data);

    // Verify shipment exists and user is part of it
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

    // Check if user is authorized to rate (farmer or buyer can rate transporter)
    const isAuthorized =
      (session.user.id === shipment.order.listing.farmerId ||
        session.user.id === shipment.order.buyerId) &&
      validated.toUserId === shipment.transporterId;

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if already rated
    const existing = await prisma.rating.findFirst({
      where: {
        fromUserId: session.user.id,
        shipmentId: validated.shipmentId,
      },
    });

    if (existing) {
      return { success: false, error: "You have already rated this shipment" };
    }

    const rating = await prisma.rating.create({
      data: {
        fromUserId: session.user.id,
        toUserId: validated.toUserId,
        shipmentId: validated.shipmentId,
        score: validated.score,
        comment: validated.comment,
      },
    });

    // Notify the rated user
    await createNotification(
      validated.toUserId,
      "New Rating Received",
      `You received a ${validated.score}-star rating`,
      `/ratings`
    );

    revalidatePath(`/shipments/${validated.shipmentId}`);

    return { success: true, rating };
  } catch (error) {
    console.error("Error submitting rating:", error);
    return { success: false, error: "Failed to submit rating" };
  }
}

export async function getUserRatings(userId: string) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        shipment: {
          include: {
            order: {
              include: {
                listing: {
                  select: {
                    cropType: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

    return { success: true, ratings, averageRating };
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return { success: false, error: "Failed to fetch ratings" };
  }
}


