export type Project = {
  // used in the url (/projects/<id>) and to pair elements across the page transition
  id: string;
  name: string;
  year: string;
  // shown under the title on the project page
  summary: string;
  body: string;
};

export const projects: Project[] = [
  {
    id: "renao",
    name: "Renao",
    // placeholders below, fill these in
    year: "2026",
    summary: "A Dropbox clone",
    body: "lorem ipsum dolor sit amet consectetur adipiscing elit duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa",
  },
];

export function findProject(id: string) {
  return projects.find((p) => p.id === id);
}
