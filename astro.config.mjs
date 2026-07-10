// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // TODO: replace with your real domain once purchased (e.g. https://clarkhayashi.com)
  // Also update the Sitemap line in public/robots.txt to match.
  site: "https://clarkhayashi.vercel.app",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
