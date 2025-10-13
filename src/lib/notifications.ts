import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function markAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

export async function getUserNotifications(userId: string, limit = 50) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}


