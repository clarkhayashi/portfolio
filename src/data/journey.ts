/**
 * The Journey page story. Edit chapters here; the globe reads coordinates
 * and the page renders everything else. Keep stories 2-4 sentences, in
 * Clark's voice, no em dashes.
 */

export interface JourneyStop {
  place: string;
  /** Japanese name shown alongside the English one (e.g. 東京 · Tokyo). */
  placeJa?: string;
  title: string;
  /** Japanese lead-in that crossfades into the English title on arrival. */
  titleJa?: string;
  years: string;
  lon: number;
  lat: number;
  glyph: "wave" | "needle" | "tower" | "hill";
  /** Real photo shown inside the globe's map chip on hover/tap. */
  chipPhoto?: string;
  story: string;
  /** `portrait: true` renders the card photo at 4/5 instead of cropping to 16/10. */
  photo?: { src: string; alt: string; portrait?: boolean };
  links?: { label: string; href: string; external?: boolean }[];
}

export const journey: JourneyStop[] = [
  {
    place: "Honolulu",
    title: "Where I'm from",
    /* Departure year only. Every other stop is dated by when something
       happened, not by a birth year, and "Where I'm from" already carries
       that this is the origin. The tilde does the same work "Until" did
       without the hard edge, and reads as approximate rather than clipped. */
    years: "~2022",
    lon: -157.86,
    lat: 21.31,
    glyph: "wave",
    chipPhoto: "/images/hawaii/hawaii-coast.jpg",
    story:
      "I grew up on O'ahu, where community isn't a value statement; it's how things get done. Punahou basketball and a varsity co-captain year, a 199-hour Eagle project rebuilding a library, and a first job ringing up military families at the Navy Exchange.",
    photo: { src: "/images/hawaii/hawaii-sunset.jpg", alt: "Sunset over the Hawai'i coastline", portrait: true },
    links: [{ label: "The Hawai'i years", href: "/about" }],
  },
  {
    place: "Seattle",
    title: "Where I learned to work",
    years: "2022",
    lon: -122.33,
    lat: 47.61,
    glyph: "needle",
    chipPhoto: "/images/seattle/seattle-kerry-park.jpg",
    story:
      "Seattle University: Business Analytics and Marketing by day, refereeing flag football by night. I started as an intramural official and left running the program; along the way I co-founded a student credit union initiative that won $22.5K across two business plan competitions.",
    photo: { src: "/images/seattle/seattle-space-needle.jpg", alt: "Seattle skyline with the Space Needle from Gas Works Park" },
    links: [
      { label: "SUCUI", href: "https://www.linkedin.com/company/seattle-university-credit-union-initiative/", external: true },
      { label: "The Seattle record", href: "/about" },
    ],
  },
  {
    place: "Tokyo",
    placeJa: "東京",
    title: "Study Abroad",
    titleJa: "留学",
    years: "2024",
    lon: 139.69,
    lat: 35.69,
    glyph: "tower",
    chipPhoto: "/images/japan/asakusa-sensoji.jpg",
    story:
      "A semester at 上智大学 (Sophia University): Japanese language, Anthropology of Japan, and a Philosophy of AI course a full year before AI became my job. Being the person who doesn't fully speak the language teaches you to listen harder than any classroom does.",
    photo: { src: "/images/japan/cherry-blossoms.jpg", alt: "Cherry blossoms against a blue sky in Japan", portrait: true },
    links: [{ label: "上智大学 · Sophia University", href: "/about" }],
  },
  {
    place: "Honolulu",
    title: "Home, with something to give back",
    years: "Summer 2025",
    lon: -157.86,
    lat: 21.31,
    glyph: "wave",
    story:
      "Back to the islands as one of Bank of Hawaii's first AI interns: 50+ use cases gathered across the organization, a scoring framework, a Power BI dashboard, and a readout to 60+ employees and senior leaders. The journey loops home before its last leg.",
    photo: { src: "/images/boh/boh-volunteer-group.jpg", alt: "Bank of Hawaii volunteer event group photo" },
    links: [
      { label: "Seattle U · Experience By Doing", href: "https://www.seattleu.edu/newsroom/2026/experience-by-doing.php", external: true },
      { label: "The LinkedIn post", href: "https://www.linkedin.com/feed/update/urn:li:activity:7371946885185642496/", external: true },
      { label: "BOH 2025 employee report", href: "https://www.boh.com/about-us/annual-report/our-employees", external: true },
    ],
  },
  {
    /* "Italy", not "Sansepolcro" or "Tuscany": the tour crossed two regions.
       Sansepolcro and Arezzo are Tuscany, Assisi and Perugia are Umbria, so
       Italy is the only label true for the whole itinerary. The specificity
       lives in the story below, where a reader is already reading. */
    place: "Italy",
    title: "Where business got global",
    /* Dated by when Clark was physically there, because /journey is a map of
       places. The course itself stays "Summer 2025" in experience.ts, which
       matches the resume: a term and a trip are different facts. Dating both
       this stop and the Bank of Hawaii stop "Summer 2025" read as two
       hemispheres at once. */
    years: "August 2025",
    lon: 12.14,
    lat: 43.57,
    glyph: "hill",
    chipPhoto: "/images/italy/wine-barrels.jpg",
    story:
      "Ten days across Italy with the Albers School, late August into early September, right after the Bank of Hawaii internship wrapped: the coursework had run online all summer alongside it. Family wineries, Nestlé's Perugina chocolate operation, a B Corp textile mill older than most countries. Small firms, long views, and marketing that has survived centuries of change.",
    photo: { src: "/images/italy/italy-study-tour-group.jpg", alt: "Italy study tour group at a Tuscan vineyard" },
    links: [
      { label: "Program recap", href: "https://www.linkedin.com/feed/update/urn:li:activity:7374272355684028416/", external: true },
    ],
  },
  {
    place: "Seattle",
    title: "Now",
    years: "2026",
    lon: -122.33,
    lat: 47.61,
    glyph: "needle",
    story:
      "Back in Seattle, building what's next: case studies, GA4 lead tracking for a family real estate business, and whatever messy problem lands on the desk after that.",
    links: [
      { label: "View work", href: "/work" },
      { label: "About me", href: "/about" },
    ],
  },
];
