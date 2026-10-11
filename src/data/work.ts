import lyftLogo from "#/assets/Lyft_Logo_Pink_RGB.png";

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
    id: "Lyft",
    company: "Lyft",
    role: "Software Engineer Intern",
    years: "2026-2027",
    dates: "Sept. 2025 - Dec. 2025",
    logo: lyftLogo,
    body: "lorem ipsum dolor sit amet consectetur adipiscing elit ex nobis illum proident occaecat dolor deserunt id eos id in id est nam et sunt mollit facere culpa proident qui id nam voluptatum quo do est consequat imperdiet duis id cumque nam eiusmod anim adipiscing culpa laborum illum amet tempor provident",
  },
  // test entry
  {
    id: "Amazon",
    company: "Amazon",
    role: "Software Engineer",
    years: "2027-2028",
    dates: "May 2027 - Aug. 2027",
    body: "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
  },
];

export function findWork(id: string) {
  return work.find((w) => w.id === id);
}
