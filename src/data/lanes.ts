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
      "I structure messy data into dashboards, reports, and recommendations a team can act on. Core tools: Excel, Power BI, Tableau; working knowledge of Python and SQL.",
  },
  {
    title: "Marketing + SEO",
    description:
      "Building working knowledge of GA4, Google Tag Manager, Search Console, UTM strategy, and local SEO by setting up lead tracking for a family real estate business.",
  },
  {
    title: "AI-Enabled Workflows",
    description:
      "I build AI into how work actually runs: custom Claude skills, scheduled automations, and handoffs between models, with a person approving anything that goes out. Certified in Anthropic's AI Fluency and Claude 101.",
  },
  {
    title: "Leadership + Operations",
    description:
      "Proven across organizations, from Scouts BSA to UREC to SUCUI: I've run programs, trained 40+ officials, and built the schedules, reporting, and playbooks that help people execute better.",
  },
  {
    title: "Visual Communication",
    description:
      "I turn complex work into clear artifacts: dashboards, decks, short-form video, and case studies people actually understand. Tools: Photoshop, Premiere Pro, CapCut. This site included.",
  },
];