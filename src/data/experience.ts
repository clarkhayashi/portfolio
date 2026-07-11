/**
 * Experience snapshot, shown on the About page.
 * Brief, scannable entries. Edit or reorder here.
 * `link` renders as a small external link.
 * `image` renders one right-side visual (fit "contain" for logos).
 * `images` (exactly two) renders a slow crossfade between them.
 */

export interface ExpImage {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
}

export interface ExperienceItem {
  org: string;
  role: string;
  dates: string;
  detail: string;
  link?: { href: string; label: string };
  link2?: { href: string; label: string };
  image?: ExpImage;
  /** Two images that crossfade. Takes precedence over `image`. */
  images?: ExpImage[];
  /** Renders in the collapsed "Background" group on the About page. */
  background?: boolean;
}

export const experience: ExperienceItem[] = [
  {
    org: "Bank of Hawaii",
    role: "AI Intern",
    dates: "Summer 2025",
    detail:
      "Gathered 50+ AI use cases through conversations with 19+ employees and AI Ambassadors; built the Excel repository, scoring framework, and Power BI dashboard used to prioritize them. Presented to 60+ employees and senior leaders.",
    link: {
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7371946885185642496/",
      label: "Read the LinkedIn post →",
    },
    images: [
      {
        src: "/images/logos/bank-of-hawaii.png",
        alt: "Bank of Hawaii logo",
        fit: "contain",
      },
      {
        src: "/images/boh/boh-volunteer-group.jpg",
        alt: "Bank of Hawaii volunteer event group photo",
      },
    ],
  },
  {
    org: "Seattle University Credit Union Initiative",
    role: "Co-founder & COO",
    dates: "2024 to present",
    detail:
      "Student-led credit union initiative: operations, reporting, and coordination across teams; financial literacy programming; grew membership from 23 to 54 students. Won the $20K Harriet Stephenson Business Plan Competition and the eBay Best Marketplace Idea Prize at UW's 2025 Dempsey Startup Competition (competing as Seattle Financial Initiative), a 174-team regional field. Now advising the team post-graduation.",
    link: {
      href: "https://www.linkedin.com/company/seattle-university-credit-union-initiative/",
      label: "SUCUI on LinkedIn →",
    },
    link2: {
      href: "https://medium.com/foster-school-of-business/2025-dempsey-startup-competition-awards-bbd5b05b75af",
      label: "Dempsey recap →",
    },
    images: [
      {
        src: "/images/logos/sucui.png",
        alt: "Seattle University Credit Union Initiative logo",
        fit: "contain",
      },
      {
        src: "/images/sucui/sucui-team.jpg",
        alt: "The SUCUI team at an event booth",
      },
    ],
  },
  {
    org: "Seattle University Recreation",
    role: "Intramural Sports Official → Manager",
    dates: "2022 to 2026",
    detail:
      "Four years in the program: started as a student official in fall 2022, promoted to Intramural Sports Manager senior year. Trained and mentored 40+ officials supporting 64+ teams and 469+ participants, ran operations, scheduling, and conflict resolution, and produced digital media with 3× the engagement of standard department posts.",
    image: {
      src: "/images/logos/su-rec.png",
      alt: "Seattle University Recreation logo",
      fit: "contain",
    },
  },
  {
    org: "Seattle University Athletics",
    background: true,
    role: "NCAA D1 Women's Basketball Practice Player",
    dates: "2023 to 2025",
    detail:
      "Scout-team role for the varsity program: learned opposing teams' schemes each week, then scrimmaged against the squad in practice so they could prepare for specific matchups.",
    image: {
      src: "/images/logos/su-athletics.png",
      alt: "Seattle University athletics mark",
      fit: "contain",
    },
  },
  {
    org: "Applied Analytics SU · Seattle University",
    role: "Analyst",
    dates: "2023 to 2026",
    detail:
      "Student analytics club: analyzing real-world datasets in Tableau with statistical and predictive modeling, plus workshops, case competitions, and industry speakers. Fall 2023 case study: co-built an interactive Tableau dashboard on Seattle building permit data with a team of analysts, then presented trends in construction activity and permitting.",
    link: {
      href: "https://public.tableau.com/app/profile/daniel.rios5181/viz/SeattleBuildingPermitAnalysis/Dashboard2",
      label: "View the Tableau dashboard →",
    },
    link2: {
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7152459299229782017/",
      label: "Club announcement →",
    },
    image: {
      src: "/images/logos/applied-analytics.png",
      alt: "Applied Analytics Seattle University club logo",
      fit: "contain",
    },
  },
  {
    org: "Seattle University",
    role: "BBA, Business Analytics & Marketing",
    dates: "2022 to 2026",
    detail:
      "Minor in Japanese. Magna Cum Laude, GPA 3.71. Achievement Scholarship and Senator Daniel K. Akaka Scholarship recipient; Dean's List and President's List.",
    image: {
      src: "/images/logos/su-seal.png",
      alt: "Seattle University seal",
      fit: "contain",
    },
  },
  {
    org: "Hui o Nani Hawai‘i · Seattle University",
    background: true,
    role: "Member",
    dates: "2022 to 2026",
    detail:
      "One of SU's largest cultural clubs. Helped organize the annual Lū‘au, celebrating Hawaiian culture in front of an audience of 300+.",
    image: {
      src: "/images/logos/hui-o-nani.png",
      alt: "Hui o Nani Hawai‘i club logo",
      fit: "contain",
    },
  },
  {
    org: "Sophia University, Tokyo",
    background: true,
    role: "Study Abroad",
    dates: "Spring & Summer 2024",
    detail:
      "Coursework spanning Japanese language, Anthropology of Japan, management, and the Philosophy of AI. Outside class: the APES basketball circle, the Japanese Language Club, and Peer Cafe. The foundation of an ongoing Japan connection.",
    images: [
      {
        src: "/images/logos/sophia.png",
        alt: "Sophia University seal",
        fit: "contain",
      },
      {
        src: "/images/japan/sophia-basketball-group.jpg",
        alt: "APES basketball circle group photo at Sophia University",
      },
    ],
  },
  {
    org: "Albers School of Business",
    background: true,
    role: "Italy Study Tour",
    dates: "2025",
    detail:
      "An Albers course spanning spring quarter and summer, capped by a 10-day immersion in Sansepolcro and Tuscany studying leadership, marketing, and global business: family wineries, Nestlé's Perugina chocolate operation, the B Corp-certified textile firm Busatti, and leadership lessons from St. Francis of Assisi to the Florentine republic in Arezzo.",
    link: {
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7374272355684028416/",
      label: "See the program recap →",
    },
    images: [
      {
        src: "/images/italy/italy-study-tour-group.jpg",
        alt: "Italy study tour group at a Tuscan vineyard",
      },
      {
        src: "/images/italy/assisi-basilica.jpg",
        alt: "Basilica of St. Francis in Assisi",
      },
      {
        src: "/images/italy/rome-skyline.jpg",
        alt: "Rome skyline with the Colosseum in the distance",
      },
      {
        src: "/images/italy/colosseum.jpg",
        alt: "The Colosseum in Rome",
      },
    ],
  },
  {
    org: "Navy Exchange · Honolulu",
    background: true,
    role: "Sales Associate",
    dates: "2020 to 2021",
    detail:
      "First job, back home during the pandemic: sales, customer service, and cash handling in service of military members and their families.",
    image: {
      src: "/images/logos/nex.png",
      alt: "Navy Exchange logo",
      fit: "contain",
    },
  },
  {
    org: "Punahou School · Honolulu",
    background: true,
    role: "High School · Class of 2022",
    dates: "2018 to 2022",
    detail:
      "Varsity basketball co-captain, voted the team's Most Inspirational Player; also varsity golf and cross country. JROTC cadet, earning the Mayor's Award of Recognition. Worked the annual Carnival every February for a class that raised $337K for financial aid.",
    image: {
      src: "/images/logos/punahou.png",
      alt: "Punahou School seal",
      fit: "contain",
    },
  },
  {
    org: "Boy Scouts of America · Troop 9, Moanalua",
    background: true,
    role: "Eagle Scout",
    dates: "2020 to 2022",
    detail:
      "Senior Patrol Leader for 40+ scouts ages 10 to 17; mentored 10 youth leaders; led a 199-hour library transformation as my Eagle project. After earning Eagle, served as Junior Assistant Scoutmaster until aging out.",
    image: {
      src: "/images/logos/eagle-scout.png",
      alt: "Eagle Scout badge",
      fit: "contain",
    },
  },
];
