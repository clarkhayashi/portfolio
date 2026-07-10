/**
 * Single source of truth for the work list (home + /work).
 * To add a project: add an entry here, then create a matching
 * markdown file in src/pages/work/ using an existing one as a template.
 * `lane` should match (or paraphrase) a lane title from lanes.ts.
 * `proof` renders as a scannable metrics line under the description.
 * `external: true` opens the href in a new tab (for off-site artifacts).
 */

export interface Project {
  title: string;
  description: string;
  tags: string[];
  /** Which professional lane this proves, shown as a small eyebrow label. */
  lane: string;
  /** Scannable proof metrics, e.g. "50+ use cases · 19+ interviews". */
  proof?: string;
  /** Omit href to render a non-clickable row (e.g. work in progress). */
  href?: string;
  external?: boolean;
  statusLabel: string;
  statusType: "progress" | "building" | "private";
}

export const projects: Project[] = [
  {
    title: "AI Use Case Prioritization",
    description:
      "One of Bank of Hawaii's first AI interns. Gathered AI use cases across the organization and built the repository, scoring model, and Power BI dashboard used to prioritize them. Summarized publicly at a high level.",
    tags: ["AI Strategy", "Power BI", "Stakeholder Research"],
    lane: "AI + Workflow Strategy",
    proof: "50+ use cases · 19+ stakeholder interviews · presented to 60+",
    href: "/work/ai-use-case-prioritization",
    statusLabel: "Completed · summarized",
    statusType: "private",
  },
  {
    title: "Intramural Sports Participation Analysis",
    description:
      "Seven years of participation data across a 469-participant, 64-team program, translated into dashboards UREC leadership used for scheduling, marketing, and retention planning.",
    tags: ["Excel", "Tableau", "Stakeholder Reporting"],
    lane: "Operations Analytics",
    proof: "7 years of data · 64+ teams · 469+ participants",
    href: "/work/intramural-participation",
    statusLabel: "Delivered · write-up in progress",
    statusType: "progress",
  },
  {
    title: "Seattle Building Permit Analysis",
    description:
      "Interactive Tableau dashboard on Seattle building permit data, built with an Applied Analytics SU team. Analyzed trends in construction activity and permitting, then presented findings to the club. Live on Tableau Public.",
    tags: ["Tableau", "Team Case Study", "Public Data"],
    lane: "Analytics + Data",
    proof: "Team of 9 analysts · live, interactive dashboard",
    href: "https://public.tableau.com/app/profile/daniel.rios5181/viz/SeattleBuildingPermitAnalysis/Dashboard2",
    external: true,
    statusLabel: "Completed · view live",
    statusType: "progress",
  },
  {
    title: "Real Estate Lead Analytics",
    description:
      "GA4, Google Tag Manager, Search Console, UTM strategy, and local SEO reporting for a family real estate business. Results publish after a full month of clean data.",
    tags: ["GA4", "GTM", "Search Console"],
    lane: "Marketing + SEO",
    proof: "Full measurement stack, built from zero",
    href: "/work/real-estate-lead-analytics",
    statusLabel: "Currently building",
    statusType: "building",
  },
  {
    title: "Tokyo Airbnb Pricing & Marketplace Analysis",
    description:
      "Pricing distribution, submarket trends, and host recommendations from 25,000+ Tokyo Airbnb listings, analyzed in Python and visualized in Tableau.",
    tags: ["Python", "Tableau", "Pricing Analytics"],
    lane: "Analytics + Data",
    proof: "25,000+ listings analyzed",
    href: "/work/tokyo-airbnb-pricing",
    statusLabel: "Case study · in progress",
    statusType: "progress",
  },
  {
    title: "Portfolio Website",
    description:
      "This site, designed and built with Astro, Tailwind, and AI-assisted workflows, from brand system to deployment. The proof for the visual communication lane is the thing you're reading.",
    tags: ["Astro", "Tailwind", "AI Workflow"],
    lane: "Visual Communication",
    statusLabel: "Live · this site",
    statusType: "progress",
  },
];
