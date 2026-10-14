# Yail

Date: 2026-10-13
Status: Draft for review
Replaces: the Mail window in `2026-10-13-mail-app-design.md`. That spec's
sending pipeline (schema, server function, spam checks, Resend), date labels,
body links and visitor store still apply. Its window, layout and `/contact`
sections are superseded by this one.

## Intent

Drop the Apple Mail window and recreate Gmail instead, called **Yail**, as a
website open inside the Zen browser. Visitors read emails Jeffrey has left
them and write him a real message that lands in his inbox.

What he said:
- Ditch the Mail app and recreate Gmail, named Yail, inside the Zen browser.
- It lives at its own fake domain, `yail.com`.
- Include stars, search and the inbox tabs (Primary, Promotions, Social).
  Labels are out.
- Every view has its own address, so back/forward and tabs work as they do in Gmail.

Assumptions (correct these):
- The visitor is a guest ("G" avatar) reading an inbox of emails Jeffrey sent
  them. Sent and Drafts are the guest's own, stored in their browser.
- The Yail mark is an original coloured-envelope "Y" in SVG, not Google's logo.
- Forward is left out. Reply is the only action on an email.
- Motion stays minimal: no animation on compose, the toast or the list.

Success criteria:
- From the ✉️ Essentials tile or the home page email icon, a visitor lands in
  Yail and recognises Gmail immediately.
- The address bar, tab titles and back/forward behave as if `yail.com` were a
  real site.
- Sending still reaches Jeffrey's inbox with Reply going to the visitor, and a
  failed send never loses what they wrote.
- It works on phones, as a route, with no desktop chrome.

Out of scope: labels, Forward, multi-select and bulk actions, archive and
delete, snooze, real accounts, attachments, rich text.

## `yail.com` in the browser

`src/lib/browser-address.ts` gains a table of hosted sites:

```ts
// sites the browser shows itself instead of opening a real tab
export const HOSTED = [{ host: "yail.com", prefix: "/yail" }];
```

- `displayAddress(path, search?)`: a path under `/yail` shows as `yail.com`
  plus the rest (`/yail/inbox/welcome` → `yail.com/inbox/welcome`, `/yail` →
  `yail.com`). The search string is appended when present
  (`yail.com/search?q=games`). Other paths are unchanged
  (`jeffreyyu.dev/about`).
- `parseAddress`: `yail.com`, `www.yail.com`, `https://yail.com/starred` and
  `yail.com/search?q=x` become routes under `/yail`, keeping any query.
  Anything else behaves as today.
- The browser sidebar passes the current search string to `displayAddress`.

`src/lib/browser-tabs.ts` `titleFor` gives Gmail-style titles:
- `Inbox – Yail`, `Starred – Yail`, `Sent – Yail`, `Drafts – Yail`
- `<subject> – Yail` for an open email
- `Search results – Yail`
- `Yail` for anything else under `/yail`

## Routes

| Shown | Route file | Shows |
|---|---|---|
| `yail.com` | `src/routes/yail/index.tsx` | redirects to `/yail/inbox` |
| `yail.com/inbox?tab=social` | `src/routes/yail/$box/index.tsx` | message list. `box` is `inbox`, `starred`, `sent` or `drafts`. `tab` is `primary` (default), `promotions` or `social`, and only applies to `inbox` |
| `yail.com/inbox/welcome` | `src/routes/yail/$box/$id.tsx` | one email, in place of the list |
| `yail.com/search?q=game` | `src/routes/yail/search.tsx` | results across all mailboxes |

- `src/routes/yail/route.tsx` is the layout. It draws the shell (top bar,
  left rail, compose window, toast) around an `<Outlet />`.
- An unknown `box` or `id` renders a "This message doesn't exist" view inside
  the shell, with a link back to the inbox.
- Search params are validated in each route: `tab` falls back to `primary`,
  `q` to `""`, and `compose` (any route) is `"1"` or absent.
- Opening a draft (`yail.com/drafts/draft`) opens compose with the draft
  filled in and leaves the list showing, as Gmail does.

## Look

Gmail's current web look, built with Tailwind. No Google assets.

- **Top bar**:
  - a hamburger icon (decorative on desktop; opens the rail drawer on phones)
    and the Yail mark plus the "Yail" wordmark;
  - a grey rounded search field (`Search mail`), which submits to
    `/yail/search?q=…`. On a search page it shows the current query;
  - a round "G" guest avatar on the right.
- **Left rail**:
  - a large pastel **Compose** button with a pencil icon;
  - Inbox (bold, with an unread count), Starred, Sent and Drafts (with a count
    when a draft exists). The active one is a filled rounded pill.
- **Inbox tabs**: Primary, Promotions and Social across the top of the inbox
  list, each with its icon and a coloured underline when active (blue, green,
  blue-violet). Promotions and Social show an unread count when they have
  unread mail.
- **List rows** (one line each):
  - a star toggle, the sender, then **subject** – grey snippet, with the date
    label on the right;
  - unread rows are bold on white, read rows are on a light grey background;
  - hovering a row raises it slightly with a shadow, as in Gmail;
  - an empty mailbox or empty search shows Gmail's "No conversations" style text.
- **Email view**:
  - a back arrow to the list it came from, and the subject large;
  - a sender line with avatar, name, address (`jeffrey@yail.com` for seeded
    emails) and full date;
  - a star toggle, then the body (paragraphs and links via `mail-body.ts`);
  - a **Reply** pill on seeded emails, which opens compose with `Re: <subject>`;
  - opening a seeded email marks it read.
- **Compose**:
  - Gmail's floating "New Message" window, bottom-right, about 500×560;
  - a dark header with minimise, expand-to-centre and close;
  - **To** is "Jeffrey Yu", read-only. **From** is two inputs, name and email;
  - then Subject and the body, with a blue **Send** pill and a bin icon at the
    bottom;
  - minimise collapses it to the header bar, and expand centres it larger with
    a dimmed backdrop;
  - the bin asks "Discard draft?" first if anything is written, then clears
    the draft and closes.
- **"Message sent" toast**: a dark rounded box bottom-left with **View
  message** (to `/yail/sent/<id>`) and ✕. It hides after 6 seconds. No animation.
- **Phones (below `md`)**:
  - the left rail becomes a drawer opened by the hamburger, closed by tapping
    outside or choosing a mailbox;
  - compose fills the screen;
  - list rows use two lines (sender + date, then subject – snippet).

## Data

### Seeded mail: `src/data/mail.ts`

`Email` gains `tab: "primary" | "promotions" | "social"`, a `fromAddress`
(e.g. `jeffrey@yail.com`) and keeps `id`, `from`, `subject`, `date` and `body`.
The three existing emails are `primary`. New placeholders in his voice:
- **promotions**:
  - "Your Spotify Wrapped is here 🎧" from "Jeffrey's Spotify"
  - "Limited time: free code review" from "Jeffrey Yu"
- **social**:
  - "Jeffrey invited you to a Discord server" from "Discord"
  - "Jeffrey Yu started following you" from "Instagram"

Discord and Instagram handles are placeholders until he supplies them.

### Visitor state: `src/lib/mail-store.ts`

- `MailState` gains `starred: string[]` (ids of seeded or sent emails).
- New pure `withStar(state, id)` toggles a star, and a store `toggleStar(id)`.
- `parseStored` keeps only string ids in `starred` and defaults it to `[]`, so
  saved state from before this change still loads.
- Unchanged: read state, Sent (newest 20), the debounced draft with
  `startedAt`, and `recordSent`, which cancels a pending draft save.

### Mailbox logic: `src/lib/yail.ts` (pure, tested)

```ts
type Box = "inbox" | "starred" | "sent" | "drafts";
type Tab = "primary" | "promotions" | "social";
type Item = {           // one row, whichever mailbox it came from
  id: string; box: "inbox" | "sent"; from: string; fromAddress: string;
  subject: string; date: string; body: string; tab?: Tab;
  unread: boolean; starred: boolean;
};

listFor(box, tab, state): Item[]   // inbox filtered to tab; starred = starred
                                   // inbox + sent; sent; drafts (the draft as one item)
findItem(box, id, state): Item | null
search(query, state): Item[]       // case-insensitive over from, subject and body,
                                   // inbox + sent, newest first; blank query → []
unreadByTab(state): Record<Tab, number>
isBox(s): s is Box
isTab(s): s is Tab
```

Items are newest first. `starred` includes both seeded and sent emails.

### Compose state: `src/lib/yail-compose.ts`

A small store in the `notch-store` style:
`{ mode: "closed" | "open" | "minimised" | "expanded"; initial: Draft | null }`,
with `openCompose(draft)`, `minimise()`, `expand()`, `restore()` and
`closeCompose()`. It's module state, so compose survives navigation between
Yail routes. The Yail layout closes it when it unmounts (when the visitor
leaves Yail). The draft itself stays in `mail-store`.

### Toast: `src/lib/yail-toast.ts`

`{ sentId: string | null }` with `showSent(id)` (auto-clears after 6s) and
`dismiss()`.

## Sending

Unchanged from the Mail app spec: `Compose` validates with `checkMail`, calls
`sendMail` with `filledMs` and the honeypot, records the sent email, and clears
the draft. On success, Yail closes compose and calls `showSent(id)`. On failure,
a red bar inside compose shows `SEND_FAILED` with the address linked, and every
field stays filled in.

## Removed

- `src/components/mail/mail-app.tsx`, `src/components/app-window.tsx`,
  `src/lib/window-store.ts` and its test.
- `src/routes/contact.tsx`, replaced by a redirect route that sends `/contact`
  to `/yail/inbox?compose=1`.
- The `MailApp` mount in `__root.tsx`.
- The home page email icon (`socials.tsx`) and the ✉️ Essentials tile
  (`browser.tsx`) become links to `/yail/inbox`. The home page icon no longer
  opens a window.

## Testing

Vitest, test-first, in `src/lib`:
- `browser-address.test.ts`:
  - `displayAddress` for Yail paths with and without search, and for non-Yail paths;
  - `parseAddress` for `yail.com`, `www.yail.com`, `https://yail.com/x`,
    `yail.com/search?q=a`, and other hosts staying external.
- `browser-tabs.test.ts`: Yail titles for each view, an open email's subject,
  and an unknown id.
- `yail.test.ts`:
  - `listFor` per box and tab, `starred` across inbox and sent, drafts;
  - `findItem` hits and misses;
  - `search` (case, each field, both mailboxes, blank query, newest first);
  - `unreadByTab`, `isBox`, `isTab`.
- `mail-store.test.ts`: `withStar` toggling, persistence, older saved data
  without `starred`, non-string ids dropped.
- `yail-compose.test.ts` and `yail-toast.test.ts`: mode changes, and the toast
  clearing after 6s with fake timers.

Manual check in headless Chrome:
- Essentials tile and home icon open Yail.
- Tabs, stars, search, and opening and replying to an email.
- Compose stays open across Yail pages; minimise and expand; discard confirm;
  the toast.
- Back/forward, the address bar and tab titles.
- `/contact` redirect, and the phone drawer and full-screen compose.
- One real send to confirm delivery.
