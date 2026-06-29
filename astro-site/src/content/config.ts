import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    pubDate: z.string().optional().default(''),
    author: z.string().optional().default('Markas Walet'),
    image: z.string().optional().default(''),
    video: z.string().optional(),
    canonical: z.string().optional(),
  }),
});

export const collections = { articles };
