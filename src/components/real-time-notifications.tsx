"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: Date;
}

export function RealTimeNotifications({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Fetch immediately
    fetchUnreadCount();

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Refresh the page data to show new notifications
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, router]);

  async function fetchUnreadCount() {
    try {
      const response = await fetch("/api/notifications/unread", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }

  return (
    <Link href="/notifications" className="relative">
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}

