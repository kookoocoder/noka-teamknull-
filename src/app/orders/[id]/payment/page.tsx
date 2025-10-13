import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PaymentForm from "./payment-form";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "BUYER") {
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
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.buyerId !== session.user.id) {
    notFound();
  }

  if (order.status !== "PENDING") {
    redirect(`/orders/${id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Complete Payment</h1>
          <p className="text-muted-foreground">Secure mock payment for your order</p>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crop:</span>
              <span className="font-medium">{order.listing.cropType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{order.quantity} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Farmer:</span>
              <span className="font-medium">{order.listing.farmer.name}</span>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">₹{order.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Payment Details</h2>
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Test Mode:</strong> This is a mock payment. Use any 16-digit card number.
              Card ending in 0000 will fail.
            </p>
          </div>
          <PaymentForm orderId={order.id} />
        </div>
      </div>
    </div>
  );
}

