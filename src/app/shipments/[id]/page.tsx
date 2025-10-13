import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getShipmentDetails } from "@/app/actions/shipments";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentTimeline } from "@/components/shipment-timeline";
import { MapPin, Package, User, Thermometer, Droplets, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ShipmentDetailPage({
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
  const result = await getShipmentDetails(id);

  if (!result.success || !result.shipment) {
    notFound();
  }

  const shipment = result.shipment;

  // Check access rights
  const hasAccess =
    shipment.transporterId === session.user.id ||
    shipment.order.buyerId === session.user.id ||
    shipment.order.listing.farmerId === session.user.id;

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Shipment Tracking</h1>
            <p className="text-muted-foreground">{shipment.order.listing.cropType} - {shipment.order.quantity} kg</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>From (Farmer)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.listing.farmer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.listing.location}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>To (Buyer)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.buyer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.deliveryAddress}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Progress</CardTitle>
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

          {shipment.storageLogs && shipment.storageLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Storage Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipment.storageLogs.map((log) => {
                    const hasWarning = log.temperature && log.temperature > 10;
                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          hasWarning ? "bg-storage-warning/10 border-storage-warning" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          {hasWarning && (
                            <div className="flex items-center gap-1 text-storage-warning-foreground">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">High Temperature</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {log.temperature !== null && (
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-muted-foreground" />
                              <span>{log.temperature}°C</span>
                            </div>
                          )}
                          {log.humidity !== null && (
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-muted-foreground" />
                              <span>{log.humidity}%</span>
                            </div>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            {session.user.role === "TRANSPORTER" && shipment.transporterId === session.user.id && (
              <Link href={`/shipments/${shipment.id}/log-storage`} className="flex-1">
                <Button className="w-full">Log Storage Conditions</Button>
              </Link>
            )}
            <Link href="/dashboard" className="flex-1">
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

