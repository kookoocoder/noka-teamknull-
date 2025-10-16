import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { MapPin, Package, User, Calendar, IndianRupee, QrCode } from "lucide-react";
import { QR } from "@/components/ui/qr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrderDetailPage({
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

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      listing: {
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
      },
      buyer: {
        select: {
          id: true,
          name: true,
          location: true,
          phone: true,
          address: true,
        },
      },
      shipment: {
        include: {
          transporter: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Check access rights
  const hasAccess =
    order.buyerId === session.user.id ||
    order.listing.farmerId === session.user.id ||
    (order.shipment && order.shipment.transporterId === session.user.id);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.listing.cropType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span>₹{order.listing.pricePerKg}/kg × {order.quantity}kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Pickup: {order.listing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Delivery: {order.deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Farmer: {order.listing.farmer.name}</div>
                    {order.listing.farmer.phone && (
                      <div className="text-sm text-muted-foreground">{order.listing.farmer.phone}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Buyer: {order.buyer.name}</div>
                    {order.buyer.phone && (
                      <div className="text-sm text-muted-foreground">{order.buyer.phone}</div>
                    )}
                  </div>
                </div>
                {order.shipment && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Transporter: {order.shipment.transporter.name}</div>
                      {order.shipment.transporter.phone && (
                        <div className="text-sm text-muted-foreground">{order.shipment.transporter.phone}</div>
                      )}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold">₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Provenance Chain */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Product Provenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Scan the complete product journey with full transparency from farm to delivery.
              </p>
              <div className="flex items-center gap-6 mb-4">
                <div className="rounded border p-2 bg-white">
                  <QR value={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/scan/${order.id}`} />
                </div>
                <div className="text-sm text-muted-foreground break-all">
                  <div className="font-medium text-foreground mb-1">Scan Link</div>
                  <div className="font-mono text-xs">
                    {(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + `/scan/${order.id}`}
                  </div>
                </div>
              </div>
              <Link href={`/scan/${order.id}`}>
                <Button className="w-full" variant="outline">
                  <QrCode className="h-4 w-4 mr-2" />
                  View Provenance Chain
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            {order.status === "PENDING" && session.user.id === order.buyerId && (
              <Link href={`/orders/${order.id}/payment`} className="flex-1">
                <Button className="w-full">Complete Payment</Button>
              </Link>
            )}
            {order.shipment && (
              <Link href={`/shipments/${order.shipment.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Track Shipment
                </Button>
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

