// the address bar shows this in front of the path. placeholder until there's a real domain
export const DISPLAY_HOST = "jeffreyyu.dev";

export type Address =
  | { kind: "route"; path: string }
  | { kind: "external"; url: string };

// what the address bar shows for the current route
export function displayAddress(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/" ? DISPLAY_HOST : `${DISPLAY_HOST}${path}`;
}

// "", "about" and "/about/" become "/" and "/about", matching the router's pathnames
export function normalizePath(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function samePath(a: string, b: string) {
  return normalizePath(a) === normalizePath(b);
}

// turns what was typed into the address bar into somewhere to go. paths, bare
// words and this site's own host stay in the browser, anything else with a dot
// is another website. there's no search engine, so text with spaces goes nowhere
export function parseAddress(input: string): Address | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;

  const hasProtocol = /^https?:\/\//i.test(text);
  const bare = text.replace(/^https?:\/\//i, "");
  const host = bare.split(/[/?#]/)[0].toLowerCase();

  if (host === DISPLAY_HOST || host === `www.${DISPLAY_HOST}`)
    return { kind: "route", path: normalizePath(bare.slice(host.length)) };
  if (text.startsWith("/")) return { kind: "route", path: normalizePath(text) };
  if (host.includes("."))
    return { kind: "external", url: hasProtocol ? text : `https://${text}` };
  return { kind: "route", path: normalizePath(text) };
}
