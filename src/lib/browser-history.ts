// the furthest history entry this visit has reached, so the forward button knows
// whether there's anywhere to go. browsers don't expose that, so it's tracked from
// the router's history. a push drops everything after it, like a real browser
export function furthestEntry(
  furthest: number,
  index: number,
  action: "PUSH" | "REPLACE" | "FORWARD" | "BACK" | "GO",
) {
  if (action === "PUSH") return index;
  return Math.max(furthest, index);
}
