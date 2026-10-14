import { GitHub, LinkedIn } from "#/components/brand-icons";
import { socials } from "#/data/socials";
import { useGo } from "#/lib/page-transition";
import { Link } from "@tanstack/react-router";
import { FileUser, Mail } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

// email opens yail, the rest open in a new tab.
// each icon shows its name above it on hover
export function Socials() {
  const go = useGo("yail");

  return (
    <ul className="flex items-center gap-3">
      <li>
        <Item label="Email" yail onClick={go("/yail/inbox")}>
          <Mail />
        </Item>
      </li>
      <li>
        <Item label="GitHub" href={socials.github}>
          <GitHub />
        </Item>
      </li>
      <li>
        <Item label="LinkedIn" href={socials.linkedin}>
          <LinkedIn />
        </Item>
      </li>
      <li>
        <Item label="Résumé" href={socials.resume}>
          <FileUser />
        </Item>
      </li>
    </ul>
  );
}

function Item({
  label,
  href,
  yail,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  yail?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  const className =
    "group relative grid size-5 place-items-center text-gray-400 transition-colors hover:text-gray-900 focus-visible:text-gray-900 [&>svg]:size-4";
  const tip = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 translate-y-0.5 rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );

  if (yail) {
    return (
      <Link
        to="/yail/$box"
        params={{ box: "inbox" }}
        onClick={onClick}
        aria-label={label}
        className={className}
      >
        {children}
        {tip}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={className}
    >
      {children}
      {tip}
    </a>
  );
}
