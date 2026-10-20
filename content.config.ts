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
    courses: defineCollection({
      type: 'data',
      source: { include: '**/_course.yml', prefix: '' },
      schema: z.object({
        title: z.string(),
        titleTh: z.string(),
        description: z.string(),
        sourceName: z.string(),
        sourceUrl: z.string().optional(),
        lessonTotal: z.number().optional(),
        modules: z.array(z.string()),
      }),
    }),
    modules: defineCollection({
      type: 'data',
      source: { include: '**/_module.yml', prefix: '' },
      schema: z.object({
        title: z.string(),
        titleTh: z.string(),
        description: z.string().optional(),
        planned: z.array(z.string()).optional(),
      }),
    }),
    roadmaps: defineCollection({
      type: 'data',
      source: { include: 'roadmap/*.yml', prefix: '' },
      schema: z.object({
        title: z.string(),
        titleTh: z.string(),
        description: z.string(),
        summary: z.string().optional(),
        role: z.string().optional(),
        order: z.number().optional(),
        sourceName: z.string(),
        sourceUrl: z.string().optional(),
        groups: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            titleTh: z.string(),
            summary: z.string().optional(),
            course: z.string().optional(),
            topics: z.array(
              z.object({
                title: z.string(),
                titleTh: z.string(),
                lesson: z.string().optional(),
                note: z.string().optional(),
                level: z.number().min(1).max(3).optional(),
                children: z.array(z.string()).optional(),
              }),
            ),
          }),
        ),
      }),
    }),
  },
})
