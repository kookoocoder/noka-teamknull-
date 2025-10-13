import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import ProduceForm from "./produce-form";

export default async function NewProducePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "FARMER") {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">List New Produce</h1>
          <p className="text-muted-foreground">Add your harvest to the marketplace</p>
        </div>
        <ProduceForm />
      </div>
    </div>
  );
}

