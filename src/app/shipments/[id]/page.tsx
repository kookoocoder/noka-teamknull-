import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getShipmentDetails } from "@/app/actions/shipments";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentTimeline } from "@/components/shipment-timeline";
import { ShipmentPDFExporter } from "@/components/shipment-pdf-exporter";
import { MapPin, Package, User, Thermometer, Droplets, AlertTriangle, ShieldCheck } from "lucide-react";
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
    shipment.order.listing.farmer.id === session.user.id;

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 pdf-content" data-pdf-content="true">
          <div>
            <h1 className="text-3xl font-bold">Shipment Tracking</h1>
            <p className="text-muted-foreground">{shipment.order.listing.cropType} - {shipment.order.quantity} kg</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>From (Farmer)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.listing.farmer.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {shipment.order.listing.farmer.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.listing.location}</span>
                </div>
                {shipment.order.listing.farmer.publicHashId && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Farmer Hash:</span>
                      <p className="text-xs text-gray-600 font-mono break-all mt-1">
                        {shipment.order.listing.farmer.publicHashId}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.order.listing.productHashId && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Product Hash:</span>
                      <p className="text-xs text-gray-600 font-mono break-all mt-1">
                        {shipment.order.listing.productHashId}
                      </p>
                    </div>
                  </div>
                )}
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
                <div className="text-sm text-muted-foreground">
                  {shipment.order.buyer.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.order.deliveryAddress}</span>
                </div>
                {shipment.order.buyer.publicHashId && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Buyer Hash:</span>
                      <p className="text-xs text-gray-600 font-mono break-all mt-1">
                        {shipment.order.buyer.publicHashId}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transporter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{shipment.transporter.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {shipment.transporter.email}
                </div>
                {shipment.transporter.publicHashId && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Transporter Hash:</span>
                      <p className="text-xs text-gray-600 font-mono break-all mt-1">
                        {shipment.transporter.publicHashId}
                      </p>
                    </div>
                  </div>
                )}
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

          {shipment.order.provenanceChain && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Shipment Provenance Chain
                  {shipment.order.provenanceChain.events && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({shipment.order.provenanceChain.events.length} events)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipment.order.provenanceChain.events?.map((event, index) => (
                    <ProvenanceEventCard key={event.id} event={event} index={index} />
                  ))}
                </div>

                {shipment.order.provenanceChain.lastHash && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Chain Hash:</span>
                      <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all mt-1">
                        {shipment.order.provenanceChain.lastHash}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                        className={`p-4 rounded-md border ${
                          hasWarning ? "bg-storage-warning/10 border-storage-warning" : "bg-card"
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
            <ShipmentPDFExporter shipmentId={shipment.id} />
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


function ProvenanceEventCard({ event, index }: { event: any; index: number }) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "ORDER_CREATED": return "🛒";
      case "PAYMENT_CONFIRMED": return "💳";
      case "ORDER_ACCEPTED": return "✅";
      case "SHIPMENT_CREATED": return "🚚";
      case "SHIPMENT_STATUS_UPDATED": return "📍";
      case "STORAGE_LOGGED": return "🌡️";
      case "DELIVERED": return "📦";
      default: return "📋";
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "ORDER_CREATED": return "Order Created";
      case "PAYMENT_CONFIRMED": return "Payment Confirmed";
      case "ORDER_ACCEPTED": return "Order Accepted by Farmer";
      case "SHIPMENT_CREATED": return "Transporter Assigned";
      case "SHIPMENT_STATUS_UPDATED": return "Shipment Status Updated";
      case "STORAGE_LOGGED": return "Storage Conditions Logged";
      case "DELIVERED": return "Delivered";
      default: return type;
    }
  };

  const formatPayloadValue = (key: string, value: any) => {
    if (key === "at" && typeof value === "string") {
      return new Date(value).toLocaleString();
    }
    if (key === "totalPrice" && typeof value === "number") {
      return `₹${value}`;
    }
    if (key === "quantity" && typeof value === "number") {
      return `${value} kg`;
    }
    if (key === "temperature" && value !== null) {
      return `${value}°C`;
    }
    if (key === "humidity" && value !== null) {
      return `${value}%`;
    }
    return String(value);
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getEventIcon(event.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{getEventLabel(event.type)}</h4>
            <span className="text-sm text-muted-foreground">
              Event #{index + 1}
            </span>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            {event.payload?.at && new Date(event.payload.at).toLocaleString()}
          </div>

          <div className="space-y-2">
            {event.payload && Object.entries(event.payload).map(([key, value]) => {
              if (key === "at") return null; // Already shown above
              if (value === null || value === undefined) return null;

              return (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-muted-foreground">{formatPayloadValue(key, value)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="text-xs space-y-1">
              <div>
                <span className="font-medium">Event Hash:</span>
                <p className="font-mono break-all text-gray-600 mt-1">{event.hash}</p>
              </div>
              {event.prevHash !== "GENESIS" && (
                <div>
                  <span className="font-medium">Previous Hash:</span>
                  <p className="font-mono break-all text-gray-600 mt-1">{event.prevHash}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

