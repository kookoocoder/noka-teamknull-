"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptJob } from "@/app/actions/transporters";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

interface JobAcceptanceFormProps {
  orderId: string;
}

export default function JobAcceptanceForm({ orderId }: JobAcceptanceFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptJob(orderId);

      if (result.success) {
        toast.success("Job accepted successfully!");
        router.push(`/jobs/${result.shipment.id}`);
      } else {
        toast.error(result.error || "Failed to accept job");
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        By accepting this job, you agree to pick up and deliver the produce according to the details provided above.
      </p>
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Accepting Job...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Accept This Job
          </>
        )}
      </Button>
    </div>
  );
}

