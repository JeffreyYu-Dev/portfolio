import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Line } from "#/components/line";
import { Compose } from "#/components/mail/compose";
import { socials } from "#/data/socials";
import { newDraft, useMail, useMailReady } from "#/lib/mail-store";
import { useLeave, usePageEnter } from "#/lib/page-transition";

export const Route = createFileRoute("/contact")({ component: Contact });

// mail's compose form as a page, for phones where there's no desktop to open mail on
function Contact() {
  const onBack = useLeave("contact");
  usePageEnter();
  const mail = useMail();
  // the form needs the saved draft, which only exists once hydrated
  const ready = useMailReady();
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <>
      <header>
        <Line>
          <Link to="/" onClick={onBack}>
            <h1 className="text-gray-500 text-xs hover:underline">
              {"<-- home"}
            </h1>
          </Link>
        </Line>
      </header>
      <main className="mt-4 flex flex-col gap-4">
        <Line>
          <h1 className="text-lg">Say hi</h1>
        </Line>
        {sentTo ? (
          <p className="text-xs">Sent. I'll get back to you at {sentTo}.</p>
        ) : ready ? (
          // the page column is wider than a phone, so the card caps itself at the
          // screen width to keep send in reach
          <div className="h-[32rem] w-[min(100%,calc(100vw-2rem))]">
            <Compose
              initial={mail.draft ?? newDraft()}
              onSent={(_, replyTo) => setSentTo(replyTo)}
            />
          </div>
        ) : (
          // no js yet (or at all): the address still works
          <p className="text-xs">
            Email me at{" "}
            <a href={`mailto:${socials.email}`} className="underline">
              {socials.email}
            </a>
          </p>
        )}
      </main>
    </>
  );
}
