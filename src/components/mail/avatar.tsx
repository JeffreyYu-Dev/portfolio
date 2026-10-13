import { initials } from "#/lib/compose-fields";

// a round initials avatar. for me, public/avatar.jpg covers the initials once it
// exists, the same way the wallpaper covers its gradient
export function Avatar({ name, me = false }: { name: string; me?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full text-[10px] font-semibold text-white ${
        me
          ? "bg-gradient-to-br from-violet-400 to-sky-500"
          : "bg-gradient-to-br from-amber-300 to-rose-400"
      }`}
    >
      {initials(name)}
      {me && (
        <span className="absolute inset-0 bg-[url(/avatar.jpg)] bg-cover bg-center" />
      )}
    </span>
  );
}
