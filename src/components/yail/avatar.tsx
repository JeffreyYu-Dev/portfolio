const COLORS = [
  "#1a73e8",
  "#e8710a",
  "#188038",
  "#a142f4",
  "#d93025",
  "#12863a",
];

// gmail's round letter avatars. the colour comes from the name, so a sender
// always gets the same one
export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const letter = name.trim()[0]?.toUpperCase() ?? "?";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: COLORS[Math.abs(hash) % COLORS.length] }}
      className={`grid shrink-0 place-items-center rounded-full font-medium text-white ${
        size === "sm" ? "size-6 text-xs" : "size-8 text-sm"
      }`}
    >
      {letter}
    </span>
  );
}
