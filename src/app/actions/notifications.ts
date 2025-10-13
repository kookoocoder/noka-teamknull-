"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserNotifications, markAsRead, getUnreadCount } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function getNotifications(limit = 50) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const notifications = await getUserNotifications(session.user.id, limit);
    const unreadCount = await getUnreadCount(session.user.id);

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await markAsRead(notificationId);
    revalidatePath("/notifications");

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}


