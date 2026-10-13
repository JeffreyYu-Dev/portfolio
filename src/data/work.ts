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
    role: "Undergraduate Researcher",
    years: "2026",
    dates: "May 2026 - Aug. 2026",
    logo: WesternLogo,
    body: "Built a two-tier LLM vehicle diagnostics pipeline from an IEEE paper, small enough to run over satellite links.",
  },
];

export function findWork(id: string) {
  return work.find((w) => w.id === id);
}
