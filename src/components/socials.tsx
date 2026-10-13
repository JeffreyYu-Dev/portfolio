import { socials } from "#/data/socials";
import { FileUser, Mail } from "lucide-react";
import { type ReactNode, useState } from "react";

// email copies to the clipboard, the rest open in a new tab.
// each icon shows its name above it on hover
export function Socials() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(socials.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ul className="flex items-center gap-3">
      <li>
        <Item label={copied ? "Copied!" : "Copy email"} onClick={copy}>
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
  onClick,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
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

  if (href) {
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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={className}
    >
      {children}
      {tip}
    </button>
  );
}

// lucide dropped brand logos, so these two are drawn by hand
function GitHub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function LinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
