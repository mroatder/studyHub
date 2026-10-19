import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    lessons: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        titleEn: z.string().optional(),
        module: z.number().optional(),
        lesson: z.number().optional(),
        sourceUrl: z.string().optional(),
        summary: z.string().optional(),
        tags: z.array(z.string()).optional(),
        createdAt: z.string().optional(),
      }),
    }),
  },
})
