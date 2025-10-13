import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    redirect("/auth");
  }

  // Redirect to onboarding if profile is incomplete
  if (!session.user.phone || !session.user.location) {
    redirect("/onboarding");
  }

  // Redirect based on role
  switch (session.user.role) {
    case "FARMER":
      redirect("/dashboard/farmer");
    case "BUYER":
      redirect("/dashboard/buyer");
    case "TRANSPORTER":
      redirect("/dashboard/transporter");
    default:
      redirect("/onboarding");
  }
}
