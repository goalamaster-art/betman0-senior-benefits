import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    keyTakeaways: z.array(z.string()),
    category: z.enum(['basic-pension', 'long-term-care', 'senior-jobs', 'national-pension', 'elder-life-support']),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    tags: z.array(z.string()),
    metaDescription: z.string(),
    sources: z.array(z.object({ name: z.string(), url: z.string() })),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = { articles };
