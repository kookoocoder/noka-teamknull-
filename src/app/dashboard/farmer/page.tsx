import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getFarmerListings } from "@/app/actions/produce";
import { getFarmerOrders, acceptOrder, rejectOrder } from "@/app/actions/orders";
import { RealTimeJobs } from "@/components/real-time-jobs";
import { FarmerDashboardClient } from "./farmer-dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function handleAcceptOrder(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const result = await acceptOrder(orderId);

  if (!result.success) {
    redirect(`/dashboard/farmer?error=${encodeURIComponent(result.error || "Failed to accept order")}`);
  }

  redirect(`/dashboard/farmer?success=${encodeURIComponent("Order accepted successfully")}`);
}

async function handleRejectOrder(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const result = await rejectOrder(orderId);

  if (!result.success) {
    redirect(`/dashboard/farmer?error=${encodeURIComponent(result.error || "Failed to reject order")}`);
  }

  redirect(`/dashboard/farmer?success=${encodeURIComponent("Order rejected successfully")}`);
}

export default async function FarmerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "FARMER") {
    redirect("/auth");
  }

  const params = await searchParams;

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
      <FarmerDashboardClient
        listings={listings}
        pendingOrders={pendingOrders}
        activeOrders={activeOrders}
        success={params.success}
        error={params.error}
        handleAcceptOrder={handleAcceptOrder}
        handleRejectOrder={handleRejectOrder}
      />
    </div>
  );
}

