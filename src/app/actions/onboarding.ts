"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OnboardingSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(data: {
  phone: string;
  location: string;
  address: string;
  vehicleType?: string | null;
  maxCapacity?: number | null;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = OnboardingSchema.parse(data);

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: validated.phone,
        location: validated.location,
        address: validated.address,
      },
    });

    // Create transporter profile if user is a transporter
    if (
      session.user.role === "TRANSPORTER" && 
      validated.vehicleType && 
      validated.maxCapacity && 
      validated.vehicleType !== null && 
      validated.maxCapacity !== null
    ) {
      await prisma.transporterProfile.create({
        data: {
          userId: session.user.id,
          vehicleType: validated.vehicleType,
          maxCapacity: validated.maxCapacity,
          currentLocation: validated.location,
        },
      });
    }

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}

