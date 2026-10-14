import { YailMark } from "#/components/yail/mark";
import { searchQuery } from "#/lib/yail";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  // on a results page the field shows what was searched
  const current = useRouterState({
    select: (s) =>
      s.location.pathname.startsWith("/yail/search")
        ? searchQuery((s.location.search as { q?: unknown }).q)
        : "",
  });
  const [text, setText] = useState(current);
  useEffect(() => setText(current), [current]);

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/yail/search", search: { q: text.trim() } });
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-2 md:gap-4 md:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Main menu"
        className="grid size-12 place-items-center rounded-full text-[#444746] hover:bg-black/5"
      >
        <Menu className="size-5" />
      </button>
      <Link
        to="/yail/$box"
        params={{ box: "inbox" }}
        className="max-md:hidden md:w-40"
      >
        <YailMark />
      </Link>
      <form
        onSubmit={submit}
        className="flex h-12 max-w-180 flex-1 items-center gap-3 rounded-full bg-[#eaf1fb] px-4 focus-within:bg-white focus-within:shadow-md"
      >
        <Search className="size-5 shrink-0 text-[#444746]" />
        <input
          aria-label="Search mail"
          placeholder="Search mail"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#444746]"
        />
      </form>
      <span
        title="Guest"
        role="img"
        aria-label="Signed in as Guest"
        className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-[#0b57d0] text-sm font-medium text-white"
      >
        G
      </span>
    </header>
  );
}
