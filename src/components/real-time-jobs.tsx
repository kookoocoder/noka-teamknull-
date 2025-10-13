"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RealTimeJobs() {
  const router = useRouter();

  useEffect(() => {
    // Poll every 5 seconds for new jobs
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return null; // This is a hook-only component
}

