export type Project = {
  // used in the url (/projects/<id>) and to pair elements across the page transition
  id: string;
  name: string;
  year: string;
  // shown under the title on the project page
  summary: string;
  body: string;
};

// years are placeholders, fill these in
export const projects: Project[] = [
  {
    id: "renao",
    name: "Renao",
    year: "2026",
    summary: "Cross-platform file sync client",
    body: "A Dropbox-style sync engine in Go that only uploads the chunks that changed.",
  },
  {
    id: "scribble",
    name: "Scribble",
    year: "2026",
    summary: "Real-time multiplayer drawing game",
    body: "A Go game server running each room as its own goroutine, with a React client over WebSockets.",
  },
  {
    id: "calendar",
    name: "Collaborative Calendar",
    year: "2025",
    summary: "Shared calendar with a Qt desktop client",
    body: "A full-stack calendar with a Qt/QML client, a Hono API, and Postgres and Redis behind it.",
  },
  {
    id: "virtual-pet",
    name: "Virtual Pet Simulator",
    year: "2024",
    summary: "JavaFX game, built with a team of 5",
    body: "A virtual pet game in JavaFX, where I led a team of five and built the save system.",
  },
];

export function findProject(id: string) {
  return projects.find((p) => p.id === id);
}
