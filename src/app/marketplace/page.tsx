import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getMarketplace } from "@/app/actions/orders";
import { ProduceCard } from "@/components/produce-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./search-bar";
import { RealTimeJobs } from "@/components/real-time-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; cropType?: string; location?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  const params = await searchParams;
  const result = await getMarketplace({
    search: params.search,
    cropType: params.cropType,
    location: params.location,
  });

  const listings = result.success ? result.listings : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <RealTimeJobs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground">Browse fresh produce from local farmers</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live updates</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar />
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ProduceCard
                key={listing.id}
                listing={listing}
                showFarmer
                actionButton={
                  <Link href={`/produce/${listing.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-md border">
            <p className="text-muted-foreground">
              No produce available at the moment. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

