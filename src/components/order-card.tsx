import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { Calendar, Package, MapPin } from "lucide-react";

interface OrderCardProps {
  order: {
    id: string;
    quantity: number;
    totalPrice: number;
    status: string;
    createdAt: Date;
    listing: {
      cropType: string;
      location: string;
    };
  };
  showDetails?: boolean;
  actions?: React.ReactNode;
}

export function OrderCard({ order, showDetails = true, actions }: OrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{order.listing.cropType}</CardTitle>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{order.quantity} kg</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{order.listing.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xl font-bold">₹{order.totalPrice.toLocaleString()}</div>
        </div>
      </CardContent>
      {actions && (
        <CardFooter className="flex gap-2">
          {actions}
        </CardFooter>
      )}
    </Card>
  );
}

