import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { MapPin, Calendar, Package, User } from "lucide-react";
import OrderForm from "./order-form";

export default async function ProduceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  const { id } = await params;

  const listing = await prisma.produceListing.findUnique({
    where: { id },
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

  if (!listing) {
    notFound();
  }

  const harvestDate = new Date(listing.harvestDate);
  const daysSinceHarvest = Math.floor(
    (Date.now() - harvestDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const canOrder = session.user.role === "BUYER" && listing.status === "AVAILABLE";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border p-6 space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">{listing.cropType}</h1>
            <StatusBadge status={listing.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-5 w-5" />
                <span className="text-lg">{listing.quantity} kg available</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{listing.location}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>
                  Harvested {daysSinceHarvest === 0 ? "today" : `${daysSinceHarvest} days ago`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-5 w-5" />
                <span>
                  Farmer: {listing.farmer.name}
                  {listing.farmer.location && ` (${listing.farmer.location})`}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="text-3xl font-bold">
                  ₹{listing.pricePerKg}
                  <span className="text-base font-normal text-muted-foreground">/kg</span>
                </div>
                <div className="text-muted-foreground mt-1">
                  Total value: ₹{(listing.quantity * listing.pricePerKg).toLocaleString()}
                </div>
              </div>

              {listing.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
              )}
            </div>
          </div>

          {canOrder && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Place Order</h2>
              <OrderForm listingId={listing.id} maxQuantity={listing.quantity} pricePerKg={listing.pricePerKg} />
            </div>
          )}

          {!canOrder && session.user.role === "BUYER" && (
            <div className="border-t pt-6">
              <p className="text-muted-foreground">
                This produce is currently not available for ordering.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

