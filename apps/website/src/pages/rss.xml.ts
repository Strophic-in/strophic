import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { site } from "../config/site";
import { getApiBlogPosts } from "../lib/content";

export async function GET(context: APIContext) {
  // Prefer CMS posts; fall back to the local MDX collection.
  const apiPosts = await getApiBlogPosts();
  const items = apiPosts
    ? apiPosts.map((p) => ({
        title: p.title,
        description: p.description,
        pubDate: p.publishedAt,
        link: `/blog/${p.slug}/`,
        categories: p.tags,
      }))
    : (await getCollection("blog"))
        .filter((p) => !p.data.draft)
        .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
        .map((post) => ({
          title: post.data.title,
          description: post.data.description,
          pubDate: post.data.publishedAt,
          link: `/blog/${post.id}/`,
          categories: post.data.tags,
        }));

  return rss({
    title: `${site.name} - Blog`,
    description: "Practical writing on AI, automation, and building products that ship.",
    site: context.site?.toString() ?? site.url,
    items,
  });
}
