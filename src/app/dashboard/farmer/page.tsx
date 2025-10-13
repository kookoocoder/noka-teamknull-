import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getFarmerListings } from "@/app/actions/produce";
import { getFarmerOrders } from "@/app/actions/orders";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProduceCard } from "@/components/produce-card";
import { OrderCard } from "@/components/order-card";
import { acceptOrder, rejectOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import { RealTimeJobs } from "@/components/real-time-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function handleAcceptOrder(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  await acceptOrder(orderId);
}

async function handleRejectOrder(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  await rejectOrder(orderId);
}

export default async function FarmerDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "FARMER") {
    redirect("/auth");
  }

  const [listingsResult, ordersResult] = await Promise.all([
    getFarmerListings(session.user.id),
    getFarmerOrders(session.user.id),
  ]);

  const listings = listingsResult.success ? listingsResult.listings : [];
  const orders = ordersResult.success ? ordersResult.orders : [];

  const pendingOrders = orders?.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED") || [];
  const activeOrders = orders?.filter((o) => ["ACCEPTED", "IN_TRANSIT"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <RealTimeJobs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
            <p className="text-muted-foreground">Manage your produce and orders</p>
          </div>
          <Link href="/produce/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              List New Produce
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Orders
              {pendingOrders.length > 0 && (
                <span className="ml-2 bg-pending text-pending-foreground rounded-full px-2 py-0.5 text-xs">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listings && listings.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ProduceCard
                    key={listing.id}
                    listing={listing}
                    actionButton={
                      <Link href={`/produce/${listing.id}/edit`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Edit
                        </Button>
                      </Link>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No produce listings yet.</p>
                <Link href="/produce/new">
                  <Button className="mt-4">Create Your First Listing</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actions={
                      <>
                        <form action={handleAcceptOrder} className="flex-1">
                          <input type="hidden" name="orderId" value={order.id} />
                          <Button type="submit" className="w-full">
                            Accept
                          </Button>
                        </form>
                        <form action={handleRejectOrder} className="flex-1">
                          <input type="hidden" name="orderId" value={order.id} />
                          <Button type="submit" variant="destructive" className="w-full">
                            Reject
                          </Button>
                        </form>
                      </>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No pending orders.</p>
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
                      order.shipment && (
                        <Link href={`/shipments/${order.shipment.id}`} className="w-full">
                          <Button variant="outline" className="w-full">
                            Track Shipment
                          </Button>
                        </Link>
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
        </Tabs>
      </div>
    </div>
  );
}

