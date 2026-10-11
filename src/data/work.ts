import lyftLogo from "#/assets/Lyft_Logo_Pink_RGB.png";
import WesternLogo from "#/assets/western.svg";

export type Work = {
  // used in the url (/work/<id>) and to pair elements across the page transition
  id: string;
  company: string;
  role: string;
  // shown on the home page row
  years: string;
  // shown under the title on the work page
  dates: string;
  // no logo shows a letter tile instead
  logo?: string;
  body: string;
};

export const work: Work[] = [
  {
    id: "Western",
    company: "Western University",
    role: "Researcher",
    years: "2026",
    dates: "May 2025 - Aug. 2025",
    logo: WesternLogo,
    body: "Built my own version of an LLM-based car diagnostics system from a Western research paper, running a small on-device model that talks to a larger server model to explain engine faults in plain language, tailored to each driver.",
  },
];

export function findWork(id: string) {
  return work.find((w) => w.id === id);
}
