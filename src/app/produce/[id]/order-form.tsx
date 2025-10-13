"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { placeOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrderFormProps {
  listingId: string;
  maxQuantity: number;
  pricePerKg: number;
}

export default function OrderForm({ listingId, maxQuantity, pricePerKg }: OrderFormProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState<number>(0);
  const router = useRouter();

  const totalPrice = quantity * pricePerKg;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      listingId,
      quantity: Number(formData.get("quantity")),
      deliveryAddress: formData.get("deliveryAddress") as string,
      notes: formData.get("notes") as string || undefined,
    };

    startTransition(async () => {
      const result = await placeOrder(data);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success && result.order) {
        toast.success("Order placed successfully!");
        router.push(`/orders/${result.order.id}/payment`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity (kg)</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          step="0.01"
          min="0.01"
          max={maxQuantity}
          placeholder={`Max: ${maxQuantity} kg`}
          value={quantity || ""}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
        {quantity > 0 && (
          <p className="text-sm text-muted-foreground">
            Total: ₹{totalPrice.toLocaleString()}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryAddress">Delivery Address</Label>
        <Input
          id="deliveryAddress"
          name="deliveryAddress"
          placeholder="Enter your delivery address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any special requirements or notes..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending || quantity <= 0}>
        {isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : null}
        Place Order
      </Button>
    </form>
  );
}

