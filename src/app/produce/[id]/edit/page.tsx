import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import EditProduceForm from "./produce-edit-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditProducePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "FARMER") {
    redirect("/auth");
  }

  const { id } = await params;

  const listing = await prisma.produceListing.findUnique({
    where: { id },
  });

  if (!listing) notFound();
  if (listing.farmerId !== session.user.id) redirect("/dashboard/farmer");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Produce</h1>
          <p className="text-muted-foreground">Update your listing details</p>
        </div>
        <EditProduceForm listing={listing} />
      </div>
    </div>
  );
}


