import type { Work } from "#/data/work";

const sizes = {
  sm: "size-4 rounded-sm text-[10px]",
  lg: "size-10 rounded-lg text-2xl",
};

// company logo, or a letter tile when there isn't one yet
export function WorkLogo({
  entry,
  size,
}: {
  entry: Work;
  size: keyof typeof sizes;
}) {
  if (entry.logo) {
    return (
      <img
        src={entry.logo}
        alt={`${entry.company} logo`}
        className={`object-contain ${sizes[size]}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center bg-gray-900 font-medium text-white ${sizes[size]}`}
    >
      {entry.company[0].toLowerCase()}
    </span>
  );
}
