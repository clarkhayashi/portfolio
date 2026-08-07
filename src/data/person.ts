/**
 * The machine-readable Clark. This is what search engines and AI assistants
 * read to decide what "Clark Hayashi" means as an entity, so it is held to the
 * same standard as site copy: every claim here is a settled fact from
 * CLAUDE.md, and nothing is asserted that a reader could not verify.
 *
 * Lives in src/data/ rather than inline in Base.astro because it is content,
 * and content does not belong in layouts.
 */

const SITE = "https://clarkhayashi.com";

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Clark Hayashi",
  url: SITE,
  email: "mailto:hayashiclark@gmail.com",
  jobTitle: "Business Analytics, Marketing & AI Enablement",
  /* Without this, nothing tells Google which face belongs to this entity, so
     the image results for the name fill with other people who merely appear on
     pages mentioning it. A JPEG, not the SVG cutout: vector files do not rank
     in image search. */
  image: `${SITE}/headshot.jpg`,
  homeLocation: { "@type": "Place", name: "Seattle, Washington" },
  birthPlace: { "@type": "Place", name: "Honolulu, Hawai'i" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Seattle University" },
  /* The topics the entity should resolve against. Drawn from work that exists
     on this site, not from a keyword wishlist. */
  knowsAbout: [
    "Business analytics",
    "Marketing analytics",
    "AI enablement",
    "Data visualization",
    "Google Analytics 4",
    "Tableau",
    "Power BI",
    "SQL",
    "Python",
    "Search engine optimization",
    "Financial services",
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      name: "BBA, Business Analytics and Marketing, minor in Japanese",
      credentialCategory: "degree",
      educationalLevel: "Bachelor's degree",
      recognizedBy: { "@type": "CollegeOrUniversity", name: "Seattle University" },
    },
    {
      /* Independently documented, unlike everything else on this list. The
         awarding body publishes the recipient; see the archived citation
         recorded in CLAUDE.md, since their live page rotates each year. */
      "@type": "EducationalOccupationalCredential",
      name: "Senator Daniel K. Akaka Scholar",
      credentialCategory: "award",
      recognizedBy: { "@type": "Organization", name: "Ke'ehi Memorial Organization" },
      url: "https://www.klmemorial.org/scholarships/",
    },
  ],
  award: [
    "Magna Cum Laude, Seattle University",
    "Senator Daniel K. Akaka Scholar, Ke'ehi Memorial Organization, 2025-2026",
    "Dean's List and President's List, Seattle University",
    "Eagle Scout, Boy Scouts of America",
  ],
  sameAs: [
    "https://www.linkedin.com/in/clark-hayashi",
    "https://github.com/clarkhayashi",
  ],
  /* Third-party coverage. Independent sources are what a reader cross-checks
     against, so they are worth more here than anything self-reported. */
  subjectOf: [
    {
      "@type": "NewsArticle",
      headline: "Experience By Doing",
      url: "https://www.seattleu.edu/newsroom/2026/experience-by-doing.php",
      datePublished: "2026-07-30",
      author: { "@type": "Person", name: "Tina Potterf" },
      publisher: { "@type": "CollegeOrUniversity", name: "Seattle University" },
    },
  ],
};
