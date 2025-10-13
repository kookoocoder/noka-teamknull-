"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { handlePayment } from "@/app/actions/payment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaymentFormProps {
  orderId: string;
}

export default function PaymentForm({ orderId }: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const cardNumber = formData.get("cardNumber") as string;
    const expiryDate = formData.get("expiryDate") as string;
    const cvv = formData.get("cvv") as string;

    startTransition(async () => {
      const result = await handlePayment(orderId, cardNumber, expiryDate, cvv);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Payment successful!");
        router.push(`/dashboard/buyer`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          name="cardNumber"
          placeholder="1234 5678 9012 3456"
          maxLength={16}
          pattern="[0-9]{16}"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            placeholder="MM/YY"
            pattern="[0-9]{2}/[0-9]{2}"
            maxLength={5}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            name="cvv"
            placeholder="123"
            maxLength={3}
            pattern="[0-9]{3}"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : null}
        Pay Now
      </Button>
    </form>
  );
}

