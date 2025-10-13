import { prisma } from "@/lib/prisma";

// Simple distance calculation between two locations (city names)
// For MVP, we use a simplified approach based on string matching
function calculateLocationScore(location1: string, location2: string): number {
  const loc1 = location1.toLowerCase().trim();
  const loc2 = location2.toLowerCase().trim();
  
  // Exact match
  if (loc1 === loc2) return 100;
  
  // Partial match
  if (loc1.includes(loc2) || loc2.includes(loc1)) return 50;
  
  // No match
  return 0;
}

interface MatchScore {
  transporterId: string;
  score: number;
  transporter: {
    id: string;
    name: string;
    location: string | null;
    transporterProfile: {
      vehicleType: string;
      maxCapacity: number;
      isAvailable: boolean;
    } | null;
  };
}

export async function autoMatchTransporter(orderId: string): Promise<string | null> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Get all available transporters
    const transporters = await prisma.user.findMany({
      where: {
        role: "TRANSPORTER",
        transporterProfile: {
          isAvailable: true,
        },
      },
      include: {
        transporterProfile: true,
      },
    });

    if (transporters.length === 0) {
      return null; // No available transporters
    }

    // Score each transporter
    const scores: MatchScore[] = transporters.map((transporter) => {
      let score = 0;

      // Location proximity score (0-100)
      const locationScore = calculateLocationScore(
        order.listing.location,
        transporter.location || ""
      );
      score += locationScore * 0.6; // 60% weight

      // Capacity score (0-100)
      const capacity = transporter.transporterProfile?.maxCapacity || 0;
      if (capacity >= order.quantity) {
        score += 100 * 0.4; // 40% weight
      } else {
        score += (capacity / order.quantity) * 100 * 0.4;
      }

      return {
        transporterId: transporter.id,
        score,
        transporter,
      };
    });

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    // Return the best match if score is above threshold (e.g., 30)
    if (scores[0] && scores[0].score >= 30) {
      return scores[0].transporterId;
    }

    return null;
  } catch (error) {
    console.error("Error in auto-matching:", error);
    return null;
  }
}


