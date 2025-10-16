"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProduceListingSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { generateUniqueHashId } from "@/lib/provenance";

export async function createProduce(data: {
  cropType: string;
  quantity: number;
  pricePerKg: number;
  harvestDate: Date;
  location: string;
  description?: string;
  images?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "FARMER") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = ProduceListingSchema.parse(data);

    // Generate unique product hash ID
    const productHashId = await generateUniqueHashId(
      "PRODUCT",
      `${validated.cropType}:${session.user.id}:${Date.now()}`
    );

    const listing = await prisma.produceListing.create({
      data: {
        farmerId: session.user.id,
        cropType: validated.cropType,
        quantity: validated.quantity,
        pricePerKg: validated.pricePerKg,
        harvestDate: validated.harvestDate,
        location: validated.location,
        description: validated.description,
        images: validated.images,
        productHashId,
      },
    });

    revalidatePath("/dashboard/farmer");
    revalidatePath("/marketplace");

    return { success: true, listing };
  } catch (error) {
    console.error("Error creating produce:", error);
    return { success: false, error: "Failed to create produce listing" };
  }
}

export async function updateProduce(
  id: string,
  data: {
    cropType?: string;
    quantity?: number;
    pricePerKg?: number;
    harvestDate?: Date;
    location?: string;
    description?: string;
    images?: string;
    status?: "AVAILABLE" | "RESERVED" | "SOLD" | "EXPIRED";
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check ownership
    const listing = await prisma.produceListing.findUnique({
      where: { id },
    });

    if (!listing || listing.farmerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.produceListing.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/farmer");
    revalidatePath("/marketplace");
    revalidatePath(`/produce/${id}`);

    return { success: true, listing: updated };
  } catch (error) {
    console.error("Error updating produce:", error);
    return { success: false, error: "Failed to update produce listing" };
  }
}

export async function getFarmerListings(farmerId: string) {
  try {
    const listings = await prisma.produceListing.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return { success: true as const, listings };
  } catch (error) {
    console.error("Error fetching farmer listings:", error);
    return { success: false as const, error: "Failed to fetch listings", listings: [] as any[] };
  }
}

export async function deleteProduce(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check ownership
    const listing = await prisma.produceListing.findUnique({
      where: { id },
    });

    if (!listing || listing.farmerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.produceListing.delete({
      where: { id },
    });

    revalidatePath("/dashboard/farmer");
    revalidatePath("/marketplace");

    return { success: true };
  } catch (error) {
    console.error("Error deleting produce:", error);
    return { success: false, error: "Failed to delete produce listing" };
  }
}


