// mail's inbox. plain text: blank lines split paragraphs and links become clickable.
// newest first. ids must stay the same once published, they're how read state is kept
// gmail's inbox tabs, see yail
export type MailTab = "primary" | "promotions" | "social";

export type Email = {
  id: string;
  from: string;
  subject: string;
  // ISO date
  date: string;
  body: string;
  // which inbox tab it sits under
  tab: MailTab;
  // shown next to the sender's name when it's open
  fromAddress: string;
};

export const inbox: Email[] = [
  {
    id: "welcome",
    from: "Jeffrey Yu",
    fromAddress: "jeffrey@yail.com",
    tab: "primary",
    subject: "hey, thanks for stopping by",
    date: "2026-10-13T09:00:00",
    body: "you found my mail app, nice.\n\nthis is a real inbox, sort of. hit the compose button up top and whatever you write lands in my actual email. questions, opportunities, game invites, a show i should watch, all fair game.\n\ntalk soon",
  },
  {
    id: "working-on",
    from: "Jeffrey Yu",
    fromAddress: "jeffrey@yail.com",
    tab: "primary",
    subject: "what i'm working on",
    date: "2026-10-10T20:15:00",
    body: "turning this portfolio into a fake version of my mac. the notch, the dock on the right, this mail app.\n\ncode's on github: https://github.com/JeffreyYu-Dev",
  },
  {
    id: "play",
    from: "Jeffrey Yu",
    fromAddress: "jeffrey@yail.com",
    tab: "primary",
    subject: "come play something",
    date: "2026-10-02T22:40:00",
    body: "i've played games my whole life and i'm always down for more.\n\ndiscord: (handle coming soon)\n\nreply with what you play and your tag.",
  },
  {
    id: "wrapped",
    from: "Jeffrey's Spotify",
    fromAddress: "spotify@yail.com",
    tab: "promotions",
    subject: "Your Spotify Wrapped is here 🎧",
    date: "2026-10-12T10:00:00",
    body: "this year jeffrey listened to a lot of music while coding.\n\ntop genre: whatever keeps him in the zone. top artist: check the notch, it's probably playing right now.",
  },
  {
    id: "code-review",
    from: "Jeffrey Yu",
    fromAddress: "jeffrey@yail.com",
    tab: "promotions",
    subject: "Limited time: free code review",
    date: "2026-10-05T15:30:00",
    body: "got a side project you're stuck on? send it over and i'll take a look.\n\noffer valid while my free time lasts.",
  },
  {
    id: "discord",
    from: "Discord",
    fromAddress: "discord@yail.com",
    tab: "social",
    subject: "Jeffrey invited you to a Discord server",
    date: "2026-10-11T21:00:00",
    body: "jeffrey wants you to join his server for games and hanging out.\n\nhis discord: (handle coming soon)",
  },
  {
    id: "instagram",
    from: "Instagram",
    fromAddress: "instagram@yail.com",
    tab: "social",
    subject: "Jeffrey Yu started following you",
    date: "2026-10-08T18:20:00",
    body: "follow him back for snowboarding clips and travel photos.\n\nhis instagram: (handle coming soon)",
  },
];
