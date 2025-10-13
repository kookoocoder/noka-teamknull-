import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getShipmentDetails } from "@/app/actions/shipments";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { MapPin, Package, User, Phone } from "lucide-react";
import { ShipmentTimeline } from "@/components/shipment-timeline";
import StatusUpdateForm from "./status-update-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "TRANSPORTER") {
    redirect("/auth");
  }

  const { id } = await params;
  const result = await getShipmentDetails(id);

  if (!result.success || !result.shipment) {
    notFound();
  }

  const shipment = result.shipment;

  if (shipment.transporterId !== session.user.id) {
    redirect("/dashboard/transporter");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{shipment.order.listing.cropType} Delivery</h1>
            <p className="text-muted-foreground">Job #{shipment.id.slice(0, 8)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.listing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.listing.farmer.name}</span>
                </div>
                {shipment.order.listing.farmer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{shipment.order.listing.farmer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.quantity} kg</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.buyer.name}</span>
                </div>
                {shipment.order.buyer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{shipment.order.buyer.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shipment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentTimeline
                status={shipment.status}
                pickupTime={shipment.pickupTime}
                deliveryTime={shipment.deliveryTime}
                currentLocation={shipment.currentLocation}
              />
            </CardContent>
          </Card>

          {shipment.status !== "DELIVERED" && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusUpdateForm shipmentId={shipment.id} currentStatus={shipment.status} />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Link href={`/shipments/${shipment.id}/log-storage`} className="flex-1">
              <Button variant="outline" className="w-full">
                Log Storage Conditions
              </Button>
            </Link>
            <Link href="/dashboard/transporter" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

