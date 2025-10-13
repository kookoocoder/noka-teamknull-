import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getShipmentDetails } from "@/app/actions/shipments";
import { notFound } from "next/navigation";
import StorageLogForm from "./storage-log-form";

export default async function LogStoragePage({
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Log Storage Conditions</h1>
          <p className="text-muted-foreground">
            Record temperature and humidity for {shipment.order.listing.cropType}
          </p>
        </div>

        <div className="bg-card rounded-md border p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Temperatures above 10°C will trigger alerts to all parties. Ensure accurate readings to maintain produce quality.
          </p>
        </div>

        <StorageLogForm shipmentId={shipment.id} />
      </div>
    </div>
  );
}

