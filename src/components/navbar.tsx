import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Package, ShoppingCart, Truck, Home } from "lucide-react";
import { RealTimeNotifications } from "@/components/real-time-notifications";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const roleConfig = {
    FARMER: {
      color: "text-farmer",
      icon: Package,
      label: "Farmer",
    },
    BUYER: {
      color: "text-buyer",
      icon: ShoppingCart,
      label: "Buyer",
    },
    TRANSPORTER: {
      color: "text-transporter",
      icon: Truck,
      label: "Transporter",
    },
  };

  const config = session.user.role ? roleConfig[session.user.role as keyof typeof roleConfig] : null;
  const Icon = config?.icon || Home;

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              <span className="text-xl font-bold">Noka</span>
            </Link>
            
            {config && (
              <div className={`flex items-center gap-2 text-sm ${config.color}`}>
                <Icon className="h-4 w-4" />
                <span className="font-medium">{config.label}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session.user.role === "BUYER" && (
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">
                  Marketplace
                </Button>
              </Link>
            )}
            
            <RealTimeNotifications userId={session.user.id} />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await auth.api.signOut({
                    headers: await headers(),
                  });
                  redirect("/auth");
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

