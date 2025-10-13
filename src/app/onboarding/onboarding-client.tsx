"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OnboardingClientProps {
  role: string | null | undefined;
}

export default function OnboardingClient({ role }: OnboardingClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isTransporter = role === "TRANSPORTER";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const vehicleTypeValue = formData.get("vehicleType");
    const maxCapacityValue = formData.get("maxCapacity");

    const data = {
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
      address: formData.get("address") as string,
      vehicleType: vehicleTypeValue ? (vehicleTypeValue as string) : null,
      maxCapacity: maxCapacityValue ? Number(maxCapacityValue) : null,
    };

    startTransition(async () => {
      const result = await completeOnboarding(data);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Profile completed!");
        router.push("/dashboard");
      }
    });
  };

  const roleLabels = {
    FARMER: "Farmer",
    BUYER: "Buyer/Distributor",
    TRANSPORTER: "Transporter",
  };

  const roleLabel = role ? roleLabels[role as keyof typeof roleLabels] : "User";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {role && (
        <div className="bg-muted/50 rounded-lg p-3 mb-2">
          <p className="text-sm text-muted-foreground">
            Setting up profile as: <span className="font-semibold text-foreground">{roleLabel}</span>
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+91 1234567890"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (City/Region)</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g., Delhi, Mumbai, Bangalore"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Full Address</Label>
        <Input
          id="address"
          name="address"
          placeholder="Enter your full address"
          required
        />
      </div>

      {isTransporter && (
        <>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Transporter Details</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Input
              id="vehicleType"
              name="vehicleType"
              placeholder="e.g., Truck, Van, Tempo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Max Capacity (kg)</Label>
            <Input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              placeholder="e.g., 500"
              required
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : null}
        Complete Setup
      </Button>
    </form>
  );
}

