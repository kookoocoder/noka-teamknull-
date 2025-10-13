"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateShipmentStatus } from "@/app/actions/shipments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StatusUpdateFormProps {
  shipmentId: string;
  currentStatus: string;
}

export default function StatusUpdateForm({ shipmentId, currentStatus }: StatusUpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [location, setLocation] = useState("");
  const router = useRouter();

  const statusProgression: Record<string, { next: string; label: string; requiresLocation: boolean }> = {
    PENDING: { next: "PICKED_UP", label: "Mark as Picked Up", requiresLocation: false },
    PICKED_UP: { next: "IN_TRANSIT", label: "Mark as In Transit", requiresLocation: true },
    IN_TRANSIT: { next: "DELIVERED", label: "Mark as Delivered", requiresLocation: false },
  };

  const nextStatus = statusProgression[currentStatus];

  if (!nextStatus) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateShipmentStatus(
        shipmentId,
        nextStatus.next as any,
        location || undefined
      );

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Status updated successfully!");
        router.refresh();
        if (nextStatus.next === "DELIVERED") {
          router.push("/dashboard/transporter");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {nextStatus.requiresLocation && (
        <div className="space-y-2">
          <Label htmlFor="location">Current Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Highway NH1, Near City XYZ"
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : null}
        {nextStatus.label}
      </Button>
    </form>
  );
}

