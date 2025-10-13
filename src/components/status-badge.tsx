import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    // Order statuses
    PENDING: { label: "Pending", className: "bg-pending text-pending-foreground" },
    CONFIRMED: { label: "Confirmed", className: "bg-confirmed text-confirmed-foreground" },
    ACCEPTED: { label: "Accepted", className: "bg-accepted text-accepted-foreground" },
    REJECTED: { label: "Rejected", className: "bg-rejected text-rejected-foreground" },
    CANCELLED: { label: "Cancelled", className: "bg-cancelled text-cancelled-foreground" },
    
    // Shipment statuses
    PICKED_UP: { label: "Picked Up", className: "bg-in-transit text-in-transit-foreground" },
    IN_TRANSIT: { label: "In Transit", className: "bg-in-transit text-in-transit-foreground" },
    DELIVERED: { label: "Delivered", className: "bg-delivered text-delivered-foreground" },
    
    // Produce statuses
    AVAILABLE: { label: "Available", className: "bg-available text-available-foreground" },
    RESERVED: { label: "Reserved", className: "bg-reserved text-reserved-foreground" },
    SOLD: { label: "Sold", className: "bg-sold text-sold-foreground" },
    EXPIRED: { label: "Expired", className: "bg-expired text-expired-foreground" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

