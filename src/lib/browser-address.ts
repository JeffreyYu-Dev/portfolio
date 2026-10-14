// the address bar shows this in front of the path. placeholder until there's a real domain
export const DISPLAY_HOST = "jeffreyyu.dev";

// sites the browser shows itself instead of opening a real tab. they're routes on
// this site under prefix, dressed up with their own host in the address bar
export const HOSTED = [{ host: "yail.com", prefix: "/yail" }] as const;

function hostedFor(path: string) {
  return HOSTED.find(
    (site) => path === site.prefix || path.startsWith(`${site.prefix}/`),
  );
}

export type Address =
  | { kind: "route"; path: string }
  | { kind: "external"; url: string };

// what the address bar shows for the current route
export function displayAddress(pathname: string, search = "") {
  const path = normalizePath(pathname);
  const site = hostedFor(path);
  const shown = site
    ? `${site.host}${path.slice(site.prefix.length)}`
    : path === "/"
      ? DISPLAY_HOST
      : `${DISPLAY_HOST}${path}`;
  if (!search) return shown;
  return `${shown}${search.startsWith("?") ? "" : "?"}${search}`;
}

// "", "about" and "/about/" become "/" and "/about", matching the router's pathnames
export function normalizePath(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function samePath(a: string, b: string) {
  return normalizePath(a) === normalizePath(b);
}

// normalizes the path part and keeps any ?query or #hash as typed
function routeTo(path: string) {
  const at = path.search(/[?#]/);
  if (at === -1) return normalizePath(path);
  return normalizePath(path.slice(0, at)) + path.slice(at);
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

  const site = HOSTED.find((s) => s.host === host.replace(/^www\./, ""));
  if (site)
    return {
      kind: "route",
      path: routeTo(site.prefix + bare.slice(host.length)),
    };

  if (host === DISPLAY_HOST || host === `www.${DISPLAY_HOST}`)
    return { kind: "route", path: normalizePath(bare.slice(host.length)) };
  if (text.startsWith("/")) return { kind: "route", path: normalizePath(text) };
  if (host.includes("."))
    return { kind: "external", url: hasProtocol ? text : `https://${text}` };
  return { kind: "route", path: normalizePath(text) };
}
