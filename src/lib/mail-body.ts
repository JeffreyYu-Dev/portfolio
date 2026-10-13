export type Piece = { text: string } | { href: string };

const LINK = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]']/g;

// emails are plain text so they're easy to write. blank lines split paragraphs
// and bare links become clickable
export function paragraphs(body: string): Piece[][] {
  return body
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(linkify);
}

function linkify(text: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) pieces.push({ text: text.slice(last, match.index) });
    pieces.push({ href: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}
