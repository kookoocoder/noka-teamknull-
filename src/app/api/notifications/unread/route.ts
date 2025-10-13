import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUnreadCount } from "@/lib/notifications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await getUnreadCount(session.user.id);

    return NextResponse.json({ count }, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

