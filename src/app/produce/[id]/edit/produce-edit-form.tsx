"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateProduce, deleteProduce } from "@/app/actions/produce";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditProduceFormProps {
  listing: {
    id: string;
    cropType: string;
    quantity: number;
    pricePerKg: number;
    harvestDate: Date;
    location: string;
    description?: string | null;
    status: "AVAILABLE" | "RESERVED" | "SOLD" | "EXPIRED";
  };
}

export default function EditProduceForm({ listing }: EditProduceFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [form, setForm] = useState({
    cropType: listing.cropType,
    quantity: listing.quantity,
    pricePerKg: listing.pricePerKg,
    harvestDate: new Date(listing.harvestDate).toISOString().slice(0, 10),
    location: listing.location,
    description: listing.description || "",
    status: listing.status,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "pricePerKg" ? Number(value) : value,
    }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProduce(listing.id, {
        cropType: form.cropType,
        quantity: form.quantity,
        pricePerKg: form.pricePerKg,
        harvestDate: new Date(form.harvestDate),
        location: form.location,
        description: form.description || undefined,
        status: form.status,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Listing updated");
        router.push("/dashboard/farmer");
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteProduce(listing.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Listing deleted");
        router.push("/dashboard/farmer");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cropType">Crop Type</Label>
          <Input id="cropType" name="cropType" value={form.cropType} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="harvestDate">Harvest Date</Label>
          <Input id="harvestDate" name="harvestDate" type="date" value={form.harvestDate} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (kg)</Label>
          <Input id="quantity" name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerKg">Price per kg (₹)</Label>
          <Input id="pricePerKg" name="pricePerKg" type="number" step="0.01" value={form.pricePerKg} onChange={handleChange} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Pickup Location</Label>
        <Input id="location" name="location" value={form.location} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Save Changes
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
          Delete Listing
        </Button>
      </div>
    </form>
  );
}


