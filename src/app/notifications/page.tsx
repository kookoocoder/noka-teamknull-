import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getNotifications, markNotificationAsRead } from "@/app/actions/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function handleMarkAsRead(notificationId: string) {
  "use server";
  await markNotificationAsRead(notificationId);
}

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  const result = await getNotifications(50);
  const notifications = result.success ? result.notifications : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your orders and shipments</p>
        </div>

        {notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {notification.read ? (
                        <CheckCircle className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Bell className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button variant="link" size="sm" className="h-auto p-0">
                              View Details
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <form action={handleMarkAsRead.bind(null, notification.id)}>
                            <Button type="submit" variant="link" size="sm" className="h-auto p-0">
                              Mark as Read
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-md border">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

