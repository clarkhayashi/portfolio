/**
 * "What I Bring" lanes, shown on the homepage and About page.
 * Edit, rename, reorder, or add lanes here; nothing else needs to change.
 */

export interface Lane {
  title: string;
  description: string;
}

export const lanes: Lane[] = [
  {
    title: "Analytics + Data",
    description:
      "I structure messy data into dashboards, reports, and recommendations a team can act on. Core tools: Excel, Tableau, Python; currently deepening SQL.",
  },
  {
    title: "Marketing + SEO",
    description:
      "Hands-on measurement work: GA4, Google Tag Manager, Search Console, UTM strategy, local SEO, and content performance. Currently applied to real estate lead tracking.",
  },
  {
    title: "AI-Enabled Workflows",
    description:
      "I use AI to accelerate research, analysis, prototyping, and documentation while keeping the business question, source quality, and final judgment human-led.",
  },
  {
    title: "Leadership + Operations",
    description:
      "Proven across organizations, from Scouts BSA to UREC to SUCUI: I've run programs, trained 40+ officials, and built the schedules, reporting, and playbooks that help people execute better.",
  },
  {
    title: "Visual Communication",
    description:
      "I turn complex work into clear artifacts: dashboards, decks, short-form video, and case studies people actually understand. Tools: Photoshop, Premiere Pro, Final Cut Pro. This site included.",
  },
];