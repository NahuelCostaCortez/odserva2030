import { defineCollection, z } from 'astro:content';

const workPackages = defineCollection({
  type: 'data',
  schema: z.object({
    code: z.string(),
    slug: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    updatedAt: z.string(),
    sourcePath: z.string(),
    counts: z.object({
      sections: z.number(),
      tables: z.number(),
      figures: z.number()
    }),
    sectionsIndex: z.array(
      z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        level: z.number(),
        order: z.number()
      })
    ),
    dataPath: z.string()
  })
});

export const collections = {
  'work-packages': workPackages
};
