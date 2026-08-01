/**
 * Single source of truth for the work list (home + /work).
 * To add a project: add an entry here, then create a matching
 * markdown file in src/pages/work/ using an existing one as a template.
 * `lane` should match (or paraphrase) a lane title from lanes.ts.
 * `proof` renders as a scannable metrics line under the description.
 * `external: true` opens the href in a new tab (for off-site artifacts).
 *
 * `thumb` is OPTIONAL and must point at a real artifact from the project
 * itself: a chart you made, a dashboard you built, a screen you shipped.
 * Masters live in src/assets/work/ at 1440x900 (16:10) so astro:assets can
 * emit AVIF/WebP and a srcset. A row with no genuine artifact renders with
 * no thumbnail. Never fill the gap with a stand-in visual.
 */

import type { ImageMetadata } from "astro";

import intramuralActivation from "../assets/work/intramural-activation.png";
import zippysKoreanFriedChicken from "../assets/work/zippys-korean-fried-chicken.jpg";
import hawaiiValueStaysDashboard from "../assets/work/hawaii-value-stays-dashboard.png";
import readingNotesShelf from "../assets/work/reading-notes-shelf.png";
import seattleBuildingPermits from "../assets/work/seattle-building-permits-dashboard.png";

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
  /** A real artifact from the work. Omit when none exists. See note above. */
  thumb?: { src: ImageMetadata; alt: string };
}

export const projects: Project[] = [
  {
    title: "Intramural Sports Participation Analysis",
    description:
      "Eight seasons of participation data, turned into dashboards and a set of recommendations for scheduling, marketing, and retention.",
    tags: ["Excel", "Tableau", "Stakeholder Reporting"],
    lane: "Operations Analytics",
    proof: "8 seasons · 4,169 player-years · 648 played in 2025",
    href: "/work/intramural-participation",
    statusLabel: "Analysis complete · recommendations proposed",
    statusType: "progress",
    thumb: {
      src: intramuralActivation,
      alt: "Bar chart from the analysis: students who played more games in their first year returned at higher rates the following year, rising from 23 percent to 84 percent.",
    },
  },
  {
    title: "Growing Without Losing Home",
    description:
      "A solo, independent mainland growth strategy for Zippy's: Seattle-first market entry, stage-gated expansion, and a speculative campaign built around the orders people remember.",
    tags: ["Marketing Strategy", "Consumer Insight", "Campaign Design"],
    lane: "Marketing Strategy",
    proof: "Solo project · 2024 thesis rebuilt in 2026",
    href: "/work/zippys-growth-strategy",
    statusLabel: "Completed · independent case study",
    statusType: "progress",
    thumb: {
      src: zippysKoreanFriedChicken,
      alt: "A Zippy's Korean Fried Chicken plate lunch with rice and macaroni salad, the order the speculative campaign was built around.",
    },
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
    thumb: {
      src: seattleBuildingPermits,
      alt: "The team's Tableau dashboard, titled Seattle Building Permits Dashboard, showing projects completed per year from 2005 to 2022 with a peak in 2017.",
    },
  },
  {
    title: "Finding the Best Value Stays in Hawai'i",
    description:
      "Airbnb vs. hotel value across the Hawaiian islands: ~36,000 Inside Airbnb listings, island and neighborhood pricing, ratings, and zoning context, built into an interactive Tableau dashboard.",
    tags: ["Tableau", "Data Visualization"],
    lane: "Analytics + Data",
    proof: "~36,000 listings · interactive dashboard",
    href: "/work/hawaii-value-stays",
    statusLabel: "Completed · artifacts publishing",
    statusType: "progress",
    thumb: {
      src: hawaiiValueStaysDashboard,
      alt: "Tableau dashboard comparing Airbnb and hotel pricing across the Hawaiian islands, with island density maps and average price by island and neighborhood.",
    },
  },
  /* Real Estate Lead Analytics is pulled from Selected Work until the first
     month of clean data exists. Restore this entry to bring the row back; the
     case study itself is untouched at src/pages/work/real-estate-lead-analytics.md.
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
  */
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
    title: "Clark's Reading Notes",
    description:
      "A lightweight, searchable reading shelf for honest notes on books I finished, paused, or plan to revisit. Built as a portable static site with local assets and no third-party JavaScript.",
    tags: ["Vanilla JavaScript", "Information Design", "Static Web"],
    lane: "Visual Communication",
    proof: "11 books · search and status filters · 0 dependencies",
    href: "https://clarkhayashi.github.io/my-websites/clark-reading-notes/",
    external: true,
    statusLabel: "Live · personal project",
    statusType: "progress",
    thumb: {
      src: readingNotesShelf,
      alt: "The Clark Reads site: a serif headline reading 'Books I read. What I actually got from them.' beside three book covers, above the start of the reading list.",
    },
  },
];
