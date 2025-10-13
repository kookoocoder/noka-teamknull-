import { CheckCircle2, Circle, Package, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShipmentTimelineProps {
  status: string;
  pickupTime?: Date | null;
  deliveryTime?: Date | null;
  currentLocation?: string | null;
}

export function ShipmentTimeline({ status, pickupTime, deliveryTime, currentLocation }: ShipmentTimelineProps) {
  const steps = [
    {
      label: "Pending",
      status: "PENDING",
      icon: Package,
      completed: ["PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(status),
      active: status === "PENDING",
      time: null,
    },
    {
      label: "Picked Up",
      status: "PICKED_UP",
      icon: Truck,
      completed: ["IN_TRANSIT", "DELIVERED"].includes(status),
      active: status === "PICKED_UP",
      time: pickupTime,
    },
    {
      label: "In Transit",
      status: "IN_TRANSIT",
      icon: MapPin,
      completed: status === "DELIVERED",
      active: status === "IN_TRANSIT",
      time: null,
      location: currentLocation,
    },
    {
      label: "Delivered",
      status: "DELIVERED",
      icon: CheckCircle2,
      completed: status === "DELIVERED",
      active: false,
      time: deliveryTime,
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "rounded-full p-2 border-2",
                  step.completed
                    ? "bg-delivered border-delivered text-delivered-foreground"
                    : step.active
                    ? "bg-in-transit border-in-transit text-in-transit-foreground"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 h-12 my-1",
                    step.completed ? "bg-delivered" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className="font-semibold">{step.label}</div>
              {step.time && (
                <div className="text-sm text-muted-foreground">
                  {new Date(step.time).toLocaleString()}
                </div>
              )}
              {step.location && step.active && (
                <div className="text-sm text-muted-foreground mt-1">
                  Location: {step.location}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

