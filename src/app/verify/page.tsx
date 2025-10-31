"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProvenanceTimeline } from "@/components/provenance-timeline";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, CheckCircle, XCircle, Package, User, Truck, MapPin, Calendar } from "lucide-react";

interface VerifiedData {
  type: "order_chain" | "chain_hash" | "product" | "user";
  data: any;
  verified?: boolean;
}

export default function VerifyPage() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyHash = async () => {
    if (!hash.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/provenance/${encodeURIComponent(hash.trim())}`);
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Hash not found");
      }
    } catch (err) {
      setError("Failed to verify hash");
    } finally {
      setLoading(false);
    }
  };

  const renderUserInfo = (user: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p className="text-sm text-muted-foreground">{user.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Badge variant="outline">{user.role}</Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          {user.location && (
            <div>
              <label className="text-sm font-medium">Location</label>
              <p className="text-sm text-muted-foreground">{user.location}</p>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Public Hash ID</label>
          <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
            {user.publicHashId}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderProductInfo = (product: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Crop Type</label>
            <p className="text-sm text-muted-foreground">{product.cropType}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <p className="text-sm text-muted-foreground">{product.quantity} kg</p>
          </div>
          <div>
            <label className="text-sm font-medium">Price per kg</label>
            <p className="text-sm text-muted-foreground">₹{product.pricePerKg}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <p className="text-sm text-muted-foreground">{product.location}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Harvest Date</label>
            <p className="text-sm text-muted-foreground">
              {new Date(product.harvestDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Badge variant={product.status === "AVAILABLE" ? "default" : "secondary"}>
              {product.status}
            </Badge>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Product Hash ID</label>
          <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
            {product.productHashId}
          </p>
        </div>
        {product.farmer && (
          <>
            <Separator />
            <div>
              <label className="text-sm font-medium">Farmer</label>
              <div className="mt-2 space-y-2">
                <p className="text-sm"><strong>Name:</strong> {product.farmer.name}</p>
                {product.farmer.publicHashId && (
                  <div>
                    <label className="text-sm font-medium">Farmer Hash ID</label>
                    <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
                      {product.farmer.publicHashId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderOrderChain = (data: any) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Information
            {data.verified !== undefined && (
              <div className="ml-auto flex items-center gap-2">
                {data.verified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {data.verified ? "Verified" : "Integrity Issue"}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Order ID</label>
              <p className="text-sm font-mono text-muted-foreground">{data.order.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Badge variant="outline">{data.order.status}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <p className="text-sm text-muted-foreground">{data.order.quantity} kg</p>
            </div>
            <div>
              <label className="text-sm font-medium">Total Price</label>
              <p className="text-sm text-muted-foreground">₹{data.order.totalPrice}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Buyer</label>
              <div className="space-y-1">
                <p className="text-sm">{data.buyer.name}</p>
                {data.buyer.publicHashId && (
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {data.buyer.publicHashId}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Farmer</label>
              <div className="space-y-1">
                <p className="text-sm">{data.farmer.name}</p>
                {data.farmer.publicHashId && (
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {data.farmer.publicHashId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {data.transporter && (
            <div>
              <label className="text-sm font-medium">Transporter</label>
              <div className="space-y-1">
                <p className="text-sm">{data.transporter.name}</p>
                {data.transporter.publicHashId && (
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {data.transporter.publicHashId}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Product</label>
            <div className="space-y-1">
              <p className="text-sm">{data.listing.cropType}</p>
              {data.listing.productHashId && (
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {data.listing.productHashId}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Chain Hash</label>
            <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
              {data.lastHash}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provenance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ProvenanceTimeline events={data.events} verified={data.verified || false} />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Verify Hash</h1>
          <p className="text-muted-foreground">
            Enter a hash to verify and view the complete provenance chain
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter hash (order ID, chain hash, product hash, or user hash)"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyHash()}
                />
              </div>
              <Button onClick={verifyHash} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-8 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            {result.type === "user" && renderUserInfo(result.data)}
            {result.type === "product" && renderProductInfo(result.data)}
            {(result.type === "order_chain" || result.type === "chain_hash") &&
              renderOrderChain(result.data)}
          </div>
        )}
      </div>
    </div>
  );
}