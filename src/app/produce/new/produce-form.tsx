"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createProduce } from "@/app/actions/produce";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProduceForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      cropType: formData.get("cropType") as string,
      quantity: Number(formData.get("quantity")),
      pricePerKg: Number(formData.get("pricePerKg")),
      harvestDate: new Date(formData.get("harvestDate") as string),
      location: formData.get("location") as string,
      description: formData.get("description") as string,
    };

    startTransition(async () => {
      const result = await createProduce(data);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Produce listed successfully!");
        router.push("/dashboard/farmer");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cropType">Crop Type</Label>
        <Input
          id="cropType"
          name="cropType"
          placeholder="e.g., Tomatoes, Wheat, Rice"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (kg)</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerKg">Price per kg (₹)</Label>
          <Input
            id="pricePerKg"
            name="pricePerKg"
            type="number"
            step="0.01"
            min="0"
            placeholder="30"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="harvestDate">Harvest Date</Label>
        <Input
          id="harvestDate"
          name="harvestDate"
          type="date"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Pickup Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g., Delhi, Mumbai"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Add any additional details about your produce..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : null}
        List Produce
      </Button>
    </form>
  );
}

