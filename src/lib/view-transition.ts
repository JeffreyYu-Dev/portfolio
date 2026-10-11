type Location = { pathname: string };

// style for an element that morphs between the home row and its work page:
// the name pairs it with its twin, the class picks the animation in styles.css
export function vt(id: string, part?: "icon" | "title") {
  // view-transition-name must be a valid css identifier, so anything odd in the id becomes "-"
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "-");
  return {
    viewTransitionName: part ? `work-${safe}-${part}` : `work-${safe}`,
    viewTransitionClass: `work-${part ?? "box"}`,
  };
}

// labels each navigation so styles.css can pick the matching animation
export function transitionTypes({
  fromLocation,
  toLocation,
}: {
  fromLocation?: Location;
  toLocation: Location;
}): string[] | false {
  // first load, nothing to animate from
  if (!fromLocation) return false;

  const from = fromLocation.pathname;
  const to = toLocation.pathname;
  if (from === to) return false;
  if (from === "/" && to.startsWith("/work/")) return ["forward"];
  if (from.startsWith("/work/") && to === "/") return ["back"];
  return ["fade"];
}
