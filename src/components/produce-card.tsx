import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Calendar, Package } from "lucide-react";

interface ProduceCardProps {
  listing: {
    id: string;
    cropType: string;
    quantity: number;
    pricePerKg: number;
    harvestDate: Date;
    location: string;
    status: string;
    description?: string | null;
    productHashId?: string | null;
    farmer?: {
      name: string;
      location: string | null;
      publicHashId?: string | null;
    };
  };
  showFarmer?: boolean;
  actionButton?: React.ReactNode;
}

export function ProduceCard({ listing, showFarmer = false, actionButton }: ProduceCardProps) {
  const harvestDate = new Date(listing.harvestDate);
  const daysSinceHarvest = Math.floor(
    (Date.now() - harvestDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{listing.cropType}</CardTitle>
          <StatusBadge status={listing.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{listing.quantity} kg available</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{listing.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Harvested {daysSinceHarvest === 0 ? "today" : `${daysSinceHarvest} days ago`}
          </span>
        </div>

        {showFarmer && listing.farmer && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Farmer:</span> {listing.farmer.name}
            {listing.farmer.publicHashId && (
              <div className="mt-1">
                <span className="font-medium">Hash:</span>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {listing.farmer.publicHashId}
                </p>
              </div>
            )}
          </div>
        )}

        {listing.productHashId && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Product Hash:</span>
            <p className="text-xs text-gray-600 font-mono break-all">
              {listing.productHashId}
            </p>
          </div>
        )}

        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
        )}

        <div className="pt-2 border-t">
          <div className="text-2xl font-bold">₹{listing.pricePerKg}<span className="text-sm font-normal text-muted-foreground">/kg</span></div>
          <div className="text-sm text-muted-foreground">Total: ₹{(listing.quantity * listing.pricePerKg).toLocaleString()}</div>
        </div>
      </CardContent>
      {actionButton && (
        <CardFooter>
          {actionButton}
        </CardFooter>
      )}
    </Card>
  );
}

