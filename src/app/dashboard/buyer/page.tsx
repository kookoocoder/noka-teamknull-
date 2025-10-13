import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getBuyerOrders } from "@/app/actions/orders";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/order-card";

export default async function BuyerDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "BUYER") {
    redirect("/auth");
  }

  const ordersResult = await getBuyerOrders(session.user.id);
  const orders = ordersResult.success ? ordersResult.orders : [];

  const pendingOrders = orders?.filter((o) => o.status === "PENDING") || [];
  const activeOrders = orders?.filter((o) => ["CONFIRMED", "ACCEPTED", "IN_TRANSIT"].includes(o.status)) || [];
  const completedOrders = orders?.filter((o) => o.status === "DELIVERED") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
            <p className="text-muted-foreground">Manage your orders and deliveries</p>
          </div>
          <Link href="/marketplace">
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Payment
              {pendingOrders.length > 0 && (
                <span className="ml-2 bg-pending text-pending-foreground rounded-full px-2 py-0.5 text-xs">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actions={
                      <Link href={`/orders/${order.id}/payment`} className="w-full">
                        <Button className="w-full">Complete Payment</Button>
                      </Link>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No pending payments.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actions={
                      order.shipment ? (
                        <Link href={`/shipments/${order.shipment.id}`} className="w-full">
                          <Button variant="outline" className="w-full">
                            Track Shipment
                          </Button>
                        </Link>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Awaiting transporter assignment
                        </div>
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No active orders.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actions={
                      order.shipment && (
                        <Link href={`/shipments/${order.shipment.id}`} className="w-full">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No completed orders yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

