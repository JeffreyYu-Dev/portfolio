// the live status lines under your name on the home page
export const status = {
  location: "London, ON",
  // IANA zone for the clock
  timeZone: "America/Toronto",
  // placeholders below, fill these in
  availability: "Open to Summer 2027 internships",
  // the card that shows when you hover the green dot
  lookingFor: [
    { label: "Role", value: "Software engineering intern" },
    { label: "When", value: "May – Aug 2027" },
    { label: "Where", value: "Toronto, or remote" },
  ],
};

// what you're probably up to, by your local time. first match wins, no match shows nothing.
// hours are 0–24 in your time zone, weekdays limits it to mon–fri
export const routine: { from: number; to: number; weekdays?: boolean; text: string }[] = [
  { from: 0, to: 7, text: "probably asleep 😴" },
  { from: 7, to: 9, text: "probably making coffee ☕" },
  { from: 9, to: 17, weekdays: true, text: "probably in class 📚" },
  { from: 17, to: 24, text: "probably coding 💻" },
];
