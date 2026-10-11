type Location = { pathname: string };

// pages that open from a home page row
const detailPages = ["/work/", "/projects/"];
const isDetail = (path: string) => detailPages.some((p) => path.startsWith(p));

// style for an element that morphs between a home page row and its page:
// the name pairs it with its twin, the class picks the animation in styles.css
export function vt(
  section: "work" | "project",
  id: string,
  part?: "icon" | "title",
) {
  // view-transition-name must be a valid css identifier, so anything odd in the id becomes "-"
  const name = `${section}-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return {
    viewTransitionName: part ? `${name}-${part}` : name,
    viewTransitionClass: `item-${part ?? "box"}`,
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
  if (from === "/" && isDetail(to)) return ["forward"];
  if (isDetail(from) && to === "/") return ["back"];
  return ["fade"];
}
