import { Badge } from "@/components/ui/badge";
import type { LeadPriority, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  CONTACTED: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  QUALIFIED: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  WON: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  LOST: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500",
};

const PRIORITY_STYLES: Record<LeadPriority, string> = {
  LOW: "text-zinc-500",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", STATUS_STYLES[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span className={cn("text-xs font-semibold uppercase tracking-wide", PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  );
}
