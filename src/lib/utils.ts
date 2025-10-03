import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a Caddy duration string to milliseconds
 * Supports: ms, s, m, h, d
 * Examples: "2000ms" -> 2000, "5s" -> 5000, "2m" -> 120000, "1h" -> 3600000
 * 
 * @param duration - Caddy duration string (e.g., "2000ms", "5s", "2m", "1h")
 * @returns Duration in milliseconds
 */
export function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/);
  if (!match) {
    console.warn(`Unable to parse duration: ${duration}, falling back to parseInt`);
    return parseInt(duration) || 0;
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1000;
    case 'm': return value * 60000;
    case 'h': return value * 3600000;
    case 'd': return value * 86400000;
    default: return value;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 * Examples: 1000 -> "1s", 150000 -> "2.5m", 3600000 -> "1h"
 * 
 * @param ms - Duration in milliseconds
 * @returns Human-readable duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
