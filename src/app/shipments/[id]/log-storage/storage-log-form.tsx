"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createStorageLog } from "@/app/actions/storage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StorageLogFormProps {
  shipmentId: string;
}

export default function StorageLogForm({ shipmentId }: StorageLogFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      shipmentId,
      temperature: formData.get("temperature") ? Number(formData.get("temperature")) : undefined,
      humidity: formData.get("humidity") ? Number(formData.get("humidity")) : undefined,
      notes: formData.get("notes") as string || undefined,
    };

    startTransition(async () => {
      const result = await createStorageLog(data);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Storage conditions logged successfully!");
        router.push(`/shipments/${shipmentId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature (°C)</Label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            placeholder="e.g., 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="humidity">Humidity (%)</Label>
          <Input
            id="humidity"
            name="humidity"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g., 75"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any additional observations..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : null}
        Log Conditions
      </Button>
    </form>
  );
}

