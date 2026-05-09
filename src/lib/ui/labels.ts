import type { ConfidenceLevel } from "../../shared/types";

export function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function labelForConfidence(level: ConfidenceLevel): string {
  return level === "high"
    ? "High confidence"
    : level === "medium"
      ? "Medium confidence"
      : "Low confidence";
}
