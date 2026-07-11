/**
 * The Journey page story. Edit chapters here; the globe reads coordinates
 * and the page renders everything else. Keep stories 2-4 sentences, in
 * Clark's voice, no em dashes.
 */

export interface JourneyStop {
  place: string;
  title: string;
  years: string;
  lon: number;
  lat: number;
  story: string;
  photo?: { src: string; alt: string };
  links?: { label: string; href: string; external?: boolean }[];
}

export const journey: JourneyStop[] = [
  {
    place: "Honolulu",
    title: "Where I'm from",
    years: "2004 to 2022",
    lon: -157.86,
    lat: 21.31,
    story:
      "I grew up on O'ahu, where community isn't a value statement; it's how things get done. Punahou basketball and a varsity co-captain year, a 199-hour Eagle project rebuilding a library, and a first job ringing up military families at the Navy Exchange.",
    photo: { src: "/images/hawaii/hawaii-sunset.jpg", alt: "Sunset over the Hawai'i coastline" },
    links: [{ label: "The Hawai'i years", href: "/about" }],
  },
  {
    place: "Seattle",
    title: "Where I learned to work",
    years: "2022",
    lon: -122.33,
    lat: 47.61,
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
    title: "Where I learned to pay attention",
    years: "2024",
    lon: 139.69,
    lat: 35.69,
    story:
      "A semester at Sophia University: Japanese language, Anthropology of Japan, and a Philosophy of AI course a full year before AI became my job. Being the person who doesn't fully speak the language teaches you to listen harder than any classroom does.",
    photo: { src: "/images/japan/cherry-blossoms.jpg", alt: "Cherry blossoms against a blue sky in Japan" },
    links: [{ label: "Sophia University", href: "/about" }],
  },
  {
    place: "Honolulu",
    title: "Home, with something to give back",
    years: "Summer 2025",
    lon: -157.86,
    lat: 21.31,
    story:
      "Back to the islands as one of Bank of Hawaii's first AI interns: 50+ use cases gathered across the organization, a scoring framework, a Power BI dashboard, and a readout to 60+ employees and senior leaders. The journey loops home before its last leg.",
    photo: { src: "/images/boh/boh-volunteer-group.jpg", alt: "Bank of Hawaii volunteer event group photo" },
    links: [
      { label: "The LinkedIn post", href: "https://www.linkedin.com/feed/update/urn:li:activity:7371946885185642496/", external: true },
    ],
  },
  {
    place: "Sansepolcro",
    title: "Where business got global",
    years: "September 2025",
    lon: 12.14,
    lat: 43.57,
    story:
      "Ten days across Tuscany with the Albers School: family wineries, Nestle's Perugina chocolate operation, a B Corp textile mill older than most countries. Small firms, long views, and marketing that has survived centuries of change.",
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
    story:
      "Back in Seattle, building what's next: case studies, GA4 lead tracking for a family real estate business, and whatever messy problem lands on the desk after that.",
    links: [
      { label: "View work", href: "/work" },
      { label: "About me", href: "/about" },
    ],
  },
];
