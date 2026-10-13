// mail's inbox. plain text: blank lines split paragraphs and links become clickable.
// newest first. ids must stay the same once published, they're how read state is kept
export type Email = {
  id: string;
  from: string;
  subject: string;
  // ISO date
  date: string;
  body: string;
};

export const inbox: Email[] = [
  {
    id: "welcome",
    from: "Jeffrey Yu",
    subject: "hey, thanks for stopping by",
    date: "2026-10-13T09:00:00",
    body: "you found my mail app, nice.\n\nthis is a real inbox, sort of. hit the compose button up top and whatever you write lands in my actual email. questions, opportunities, game invites, a show i should watch, all fair game.\n\ntalk soon",
  },
  {
    id: "working-on",
    from: "Jeffrey Yu",
    subject: "what i'm working on",
    date: "2026-10-10T20:15:00",
    body: "turning this portfolio into a fake version of my mac. the notch, the dock on the right, this mail app.\n\ncode's on github: https://github.com/JeffreyYu-Dev",
  },
  {
    id: "play",
    from: "Jeffrey Yu",
    subject: "come play something",
    date: "2026-10-02T22:40:00",
    body: "i've played games my whole life and i'm always down for more.\n\ndiscord: (handle coming soon)\n\nreply with what you play and your tag.",
  },
];
