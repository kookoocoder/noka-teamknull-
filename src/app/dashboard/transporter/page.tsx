import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getAvailableJobs } from "@/app/actions/transporters";
import { getTransporterShipments } from "@/app/actions/shipments";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Package, Navigation } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealTimeJobs } from "@/components/real-time-jobs";
import { VerifyPill } from "@/components/verify-pill";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TransporterDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "TRANSPORTER") {
    redirect("/auth");
  }

  const [jobsResult, shipmentsResult] = await Promise.all([
    getAvailableJobs(),
    getTransporterShipments(session.user.id),
  ]);

  const jobs = jobsResult.success ? jobsResult.jobs : [];
  const shipments = shipmentsResult.success ? shipmentsResult.shipments : [];

  const activeShipments = shipments?.filter((s) => ["PICKED_UP", "IN_TRANSIT"].includes(s.status)) || [];
  const completedShipments = shipments?.filter((s) => s.status === "DELIVERED") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <RealTimeJobs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Transporter Dashboard</h1>
              <p className="text-muted-foreground">Manage your delivery jobs</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live updates</span>
            </div>
            <VerifyPill />
          </div>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              Available Jobs
              {jobs && jobs.length > 0 && (
                <span className="ml-2 bg-pending text-pending-foreground rounded-full px-2 py-0.5 text-xs">
                  {jobs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {jobs && jobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {jobs.map((job) => (
                  <Card key={job.id} className="md:col-span-1">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {job.listing.cropType}
                        </CardTitle>
                        <StatusBadge status={job.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{job.quantity} kg</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">From: </span>
                            <span>{job.listing.farmer.name}</span>
                            {job.listing.location ? (
                              <span className="text-muted-foreground"> — {job.listing.location}</span>
                            ) : null}
                          </div>
                          <div>
                            <span className="font-medium">To: </span>
                            <span>{job.buyer.name}</span>
                            {" "}
                            <span className="text-muted-foreground">
                              — {job.buyer.address || job.deliveryAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Total Price:</span>
                        <span className="text-muted-foreground">₹{job.totalPrice.toFixed(2)}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/jobs/${job.id}`} className="w-full">
                        <Button className="w-full">
                          <Navigation className="h-4 w-4 mr-2" />
                          Accept Job
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-md border">
                <p className="text-muted-foreground">No available jobs at the moment.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeShipments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {activeShipments.map((shipment) => (
                  <Card key={shipment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {shipment.order.listing.cropType}
                        </CardTitle>
                        <StatusBadge status={shipment.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{shipment.order.quantity} kg</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">From: </span>
                            <span>{shipment.order.listing.farmer.name}</span>
                            {shipment.order.listing.location ? (
                              <span className="text-muted-foreground"> — {shipment.order.listing.location}</span>
                            ) : null}
                          </div>
                          <div>
                            <span className="font-medium">To: </span>
                            <span>{shipment.order.buyer.name}</span>
                            {" "}
                            <span className="text-muted-foreground">— {shipment.order.deliveryAddress}</span>
                          </div>
                        </div>
                      </div>

                      {shipment.currentLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>Current: {shipment.currentLocation}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Link href={`/jobs/${shipment.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          Update Status
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-md border">
                <p className="text-muted-foreground">No active shipments.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedShipments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedShipments.map((shipment) => (
                  <Card key={shipment.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {shipment.order.listing.cropType}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{shipment.order.quantity} kg</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">From: </span>
                            <span>{shipment.order.listing.farmer.name}</span>
                            {shipment.order.listing.location ? (
                              <span className="text-muted-foreground"> — {shipment.order.listing.location}</span>
                            ) : null}
                          </div>
                          <div>
                            <span className="font-medium">To: </span>
                            <span>{shipment.order.buyer.name}</span>
                            {" "}
                            <span className="text-muted-foreground">— {shipment.order.deliveryAddress}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/shipments/${shipment.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-md border">
                <p className="text-muted-foreground">No completed shipments yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

