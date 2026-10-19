// โหลด roadmap ทั้งหมด (ทุกตำแหน่ง) พร้อมนับว่าแต่ละหัวข้อมีบทเรียนในเว็บแล้วหรือยัง
export async function useRoadmaps() {
  return await useAsyncData('roadmaps:all', async () => {
    const [maps, lessons] = await Promise.all([
      queryCollection('roadmaps').all(),
      queryCollection('lessons').select('path').all(),
    ])
    const have = new Set(lessons.map((l) => l.path))

    return maps
      .map((map) => {
        const slug = map.stem.split('/').pop()!
        const groups = map.groups.map((g) => {
          const topics = g.topics.map((t) => ({ ...t, ready: !!t.lesson && have.has(t.lesson) }))
          return { ...g, topics, ready: topics.filter((t) => t.ready).length }
        })
        const total = groups.reduce((n, g) => n + g.topics.length, 0)
        const ready = groups.reduce((n, g) => n + g.ready, 0)
        return { slug, map, groups, total, ready }
      })
      .sort((a, b) => (a.map.order ?? 99) - (b.map.order ?? 99) || a.slug.localeCompare(b.slug))
  })
}
