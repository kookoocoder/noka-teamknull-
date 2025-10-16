import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function VerifyPill() {
  return (
    <Link
      href="/verify"
      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>Verify Hash</span>
    </Link>
  );
}


