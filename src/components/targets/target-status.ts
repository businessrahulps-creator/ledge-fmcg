import type { TargetStatus } from "@/lib/target-achievement";

export const STATUS_LABEL: Record<TargetStatus, string> = {
  exceeded: "Achieved", on_track: "On Track", behind: "Behind Target", needs_attention: "Needs Attention", no_target: "No Target Set",
};
export const STATUS_TEXT: Record<TargetStatus, string> = {
  exceeded: "text-success", on_track: "text-primary", behind: "text-warning", needs_attention: "text-destructive", no_target: "text-muted-foreground",
};
export const STATUS_BAR: Record<TargetStatus, string> = {
  exceeded: "[&>div]:bg-success", on_track: "[&>div]:bg-primary", behind: "[&>div]:bg-warning", needs_attention: "[&>div]:bg-destructive", no_target: "",
};
