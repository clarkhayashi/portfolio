// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://clarkhayashi.com",
  integrations: [
    sitemap({
      /* Pages pulled from Selected Work but kept on disk. Unlinked is not the
         same as unindexed: without this they stay in the sitemap and get
         crawled, so a page saying results are not ready yet keeps showing up
         in search. Remove an entry here when its row goes back. */
      filter: (page) => !page.includes("/work/real-estate-lead-analytics"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
