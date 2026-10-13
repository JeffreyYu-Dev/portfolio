# Mail App

Date: 2026-10-13
Status: Draft for review
Builds on: `2026-10-13-macos-desktop-design.md` (adds an app the vision didn't list)

## Intent

A real way to contact Jeffrey, presented as an Apple Mail window on the desktop.
A visitor opens Mail from the dock, reads a few emails he's left there, and
writes him a message that actually lands in his inbox.

What he said:
- It's a real contact channel. Send it with Resend from a TanStack Start server
  function.
- It's a Mail **window**, not a page in the browser.
- Use the full three-column Mail layout (mailboxes, message list, reading pane).
- The Inbox holds seeded emails, "a bunch of random stuff" he'll write over time.
- Spam protection should be light and invisible to visitors (no captcha).
- Validate with Zod.

Assumptions (correct these):
- Mail opens from the dock's existing Mail icon, which replaces today's
  copy-email-to-clipboard behaviour.
- Sent and Drafts are kept in the visitor's own `localStorage`. Nothing is
  stored server-side.
- Messages arrive in his Gmail with `reply_to` set to the visitor, so he can
  reply directly.
- Phones (where the dock and desktop are hidden) get a `/contact` page with the
  same compose form.
- Motion stays minimal: the window opens and closes instantly.

Success criteria:
- A visitor can send a message in under a minute and it reaches his inbox, with
  Reply going to the visitor.
- Bots that fill every field or submit instantly send nothing.
- A failed send never loses what the visitor wrote.
- The window code is the start of the Phase 3 window manager, not something
  Phase 3 has to throw away.

Out of scope: rate limiting, Turnstile/captcha, dragging/minimizing/zoom
(Phase 3), attachments, rich text, any server-side storage.

## Architecture

```
dock Mail icon ──openWindow("mail")──▶ window-store ──▶ <AppWindow id="mail">
                                                          └─ <MailApp>
                                                               ├─ Sidebar (Inbox / Sent / Drafts)
                                                               ├─ MessageList
                                                               ├─ ReadingPane
                                                               └─ ComposeSheet ──sendMail()──▶ server fn ──▶ Resend
                                                                       │
                                                                  mail-store (localStorage: read, sent, draft)
```

### Files

| File | Purpose |
|------|---------|
| `src/lib/window-store.ts` | Which app windows are open and their stacking order |
| `src/components/app-window.tsx` | Window frame: title bar, traffic lights, toolbar slot |
| `src/components/mail/mail-app.tsx` | Three-column layout and selection state |
| `src/components/mail/compose.tsx` | Compose form, used by the sheet and by `/contact` |
| `src/data/mail.ts` | Seeded inbox emails |
| `src/lib/mail-store.ts` | Visitor's read state, sent messages and draft (`localStorage`) |
| `src/lib/mail-schema.ts` | Zod schema shared by client and server |
| `src/lib/mail-date.ts` | Mail-style date labels |
| `src/server/send-mail.ts` | Server function: spam checks, Resend call |
| `src/routes/contact.tsx` | Phone fallback page with the compose form |

New dependencies: `resend`, `zod` (v4).

## Window store and frame

`src/lib/window-store.ts` follows `notch-store.ts`: a module-level state,
listeners, and `useSyncExternalStore` with a server snapshot where everything
is closed.

```ts
type AppId = "mail";
type Win = { id: AppId; open: boolean; z: number };

openWindow(id)   // open it and bring it to the front
closeWindow(id)
focusWindow(id)  // bring to the front
useWindow(id)    // { open, z }
```

It uses the vision spec's function names and a subset of its `Win` type, so
Phase 3 adds `x/y/w/h/minimized` and dragging to this store rather than
replacing it. The browser is not registered yet, so an open Mail window always
sits above it.

`AppWindow`:
- Fixed, centred over the desktop area at about 900×560, clamped to the
  viewport. Hidden below `md`, like the rest of the desktop chrome.
- Title bar with traffic lights. Red closes. Yellow and green render but do
  nothing until Phase 3.
- `role="dialog"`, `aria-label` set to the app name. It's non-modal: no focus
  trap and no backdrop, so the browser behind stays usable. Esc closes it when
  focus is inside the window. Pressing inside it calls `focusWindow`.
- No open/close animation.

Dock changes (`dock.tsx`):
- The Mail item calls `openWindow("mail")` instead of copying the email.
- The running dot shows while Mail is open.
- The badge shows the unread count from `mail-store` (hidden at 0), replacing
  the hard-coded `1`.

## Mail layout

Apple Mail's three columns inside `AppWindow`:

- **Sidebar** (translucent, about 170px): Inbox with an unread count, Sent,
  and Drafts (shows 1 when a draft exists).
- **Message list** (about 260px): for each email, the sender, date label,
  subject and a one-line preview. Unread emails get a blue dot. Empty
  mailboxes show "No Messages", as Mail does.
- **Reading pane**: the selected email's header (from, to, date, subject) and
  body. Seeded emails have a **Reply** button that opens compose with
  `Re: <subject>` filled in. With nothing selected, it shows "No Message
  Selected".
- **Toolbar** (in the `AppWindow` slot): the mailbox name with its message
  count, and a compose button (lucide `SquarePen`).

Selecting an Inbox email marks it read. On open, Inbox is selected and nothing
is selected in the list.

### Compose

Compose is a sheet covering the reading pane and list (not a second window),
with its own toolbar: Cancel on the left and Send (lucide `Send`) on the right.

Fields:
- **To:** "Jeffrey Yu", read-only.
- **From:** two inputs, name and email.
- **Subject**
- **Message:** a textarea.
- A honeypot input named `website`, positioned off-screen with `aria-hidden`,
  `tabIndex={-1}` and `autoComplete="off"`.

Compose sends `filledMs`, the time since the draft was started, measured on
the visitor's own clock (so a clock that's set wrong can't skew it against the
server's). Clicking a draft in Drafts reopens compose with the draft filled in.

`compose.tsx` takes `onSent` and `onCancel` props so `/contact` can render the
same form without the Mail chrome.

## Data

### Seeded inbox: `src/data/mail.ts`

```ts
export type Email = {
  id: string;      // stable, used for read state
  from: string;    // "Jeffrey Yu"
  subject: string;
  date: string;    // ISO date
  body: string;    // plain text. blank lines split paragraphs, URLs become links
};

export const inbox: Email[] = [];
```

It ships with three placeholder emails in his voice (a welcome note, what he's
working on, a "come play something" invite with his Discord placeholder) for
him to rewrite. Newest first.

### Visitor state: `src/lib/mail-store.ts`

```ts
type SentEmail = { id: string; subject: string; body: string; date: string };
type Draft = { name: string; email: string; subject: string; body: string };

type MailState = {
  read: string[];          // ids of seeded emails opened
  sent: SentEmail[];       // newest first, capped at 20
  draft: Draft | null;
};
```

- Persisted to `localStorage["mail:v1"]`.
- The server render and first client render use the empty state. The saved
  state loads after hydration (same reasoning as `notch-store`'s server
  snapshot).
- Corrupt or unreadable storage falls back to the empty state.
- Compose saves the draft 500ms after the last keystroke. A draft with every
  field empty is stored as `null`.
- `unreadCount` is derived as the number of inbox ids not in `read`.

## Sending

### Schema: `src/lib/mail-schema.ts`

```ts
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export const mailSchema = z.object({
  name: z.string().transform(oneLine).pipe(
    z.string().min(1, "Add your name").max(100, "That name's a bit long"),
  ),
  email: z.email("Add your email so I can reply").max(254),
  subject: z.string().transform(oneLine).pipe(z.string().max(200))
    .transform((s) => s || "(no subject)"),
  body: z.string().trim().min(1, "Write me something").max(5000, "Keep it under 5000 characters"),
});

export const sendSchema = mailSchema.extend({
  website: z.string().optional(),  // honeypot
  filledMs: z.number(),
});
```

The client runs `mailSchema.safeParse` on Send and shows the first issue under
each field (`z.flattenError`). The server function uses `sendSchema` as its
input validator, which TanStack Start accepts directly as a Standard Schema.
The exact validator method name (`inputValidator` vs `validator`) gets checked
against the installed `@tanstack/react-start`.

### Server function: `src/server/send-mail.ts`

```ts
type SendResult = { ok: true } | { ok: false; message: string };
```

1. **Spam checks.** If `website` is non-empty, or `filledMs` is
   under 3000ms, return `{ ok: true }` without sending. Bots get no signal that
   they were caught.
2. **Config.** Read `RESEND_API_KEY`, `MAIL_TO` (default
   `jeffrey.yu.w@gmail.com`) and `MAIL_FROM` (default
   `Portfolio <onboarding@resend.dev>`) from `process.env` at call time. A
   missing key logs a clear error and returns the generic failure.
3. **Send.** `resend.emails.send` with:
   - `to`: `MAIL_TO`
   - `from`: `MAIL_FROM`
   - `replyTo`: the visitor's email
   - `subject`: `[portfolio] <subject>`
   - `text`: the body, a blank line, then `— <name> <email>`
4. **Result.** If Resend returns an error or throws, log it and return
   `{ ok: false, message: "Couldn't send. Try again, or email me directly at jeffrey.yu.w@gmail.com" }`.

The spam check and send logic live in a plain `handleSend(input, deps)`
function where `deps` provides `send` and `now`. The server function wraps it
with the real Resend client, so tests never touch the network.

Resend's shared `onboarding@resend.dev` sender only delivers to the account
owner's address. Every message goes to him, so this works without verifying a
domain. `MAIL_FROM` can change once he has one.

### Client flow

- Send: validate. If it fails, show the field errors and stop.
- Otherwise disable the form, show "Sending…" on the button, and call
  `sendMail`.
- **ok:** add to `sent`, clear the draft, close the sheet, select Sent and open
  the new message.
- **Not ok, or the request throws:** keep every field and the draft, show the
  message above the form with the address as a `mailto:` link, and re-enable
  Send.
- If the window is closed mid-send, the result is still applied to
  `mail-store`.

## Phone fallback: `/contact`

A normal route rendered in the browser card. It has a short heading and the
`compose.tsx` form, without the sidebar or list. On success it shows "Sent —
I'll get back to you at <email>." It shares the same draft in `mail-store`.

The home page's email icon (`socials.tsx`, which copies the address today)
becomes a `<Link to="/contact">`. At `md` and above its click handler prevents
navigation and calls `openWindow("mail")` instead, so desktop visitors get the
window and phones (or no JS) get the page.

## Testing

Vitest, next to the code like the existing `src/lib/*.test.ts`:

- `mail-schema.test.ts`: each field's bounds, email format, CR/LF in name and
  subject collapses to one line, empty subject becomes `(no subject)`, and
  body trimming.
- `send-mail.test.ts` (on `handleSend`):
  - Honeypot filled → ok, `send` not called.
  - Under 3s → ok, `send` not called.
  - Valid input → `send` called with the right to/from/replyTo/subject/text.
  - `send` rejects → generic failure.
  - Missing key → generic failure.
- `mail-store.test.ts`: marking read, unread count, Sent capped at 20 newest
  first, saving and clearing the draft, all-empty draft becomes `null`, corrupt
  storage → empty state.
- `window-store.test.ts`: open/close, opening or focusing raises `z` above the
  others.
- `mail-date.test.ts`: same day → time, yesterday → "Yesterday", within a week
  → weekday, otherwise → "Oct 9".

Manual: with `RESEND_API_KEY` in `.env`, run `npm run dev`, send from the Mail
window and from `/contact` at a phone width, confirm both arrive, and check that
Reply goes to the visitor's address.

## Open questions

- **Seeded email copy**: he writes the real emails. Placeholders ship first.
- **Discord handle** for the invite email: placeholder until he supplies it.
