<script setup lang="ts">
const { data: courses } = await useAsyncData('home-courses', async () => {
  const list = await queryCollection('courses').order('stem', 'ASC').all()
  const lessons = await queryCollection('lessons').select('stem').all()
  return list.map((c) => {
    const base = c.stem.replace(/\/_course$/, '')
    return { ...c, path: `/${base}`, lessonCount: lessons.filter((l) => l.stem.startsWith(`${base}/`)).length }
  })
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-10">
    <h1 class="text-3xl font-bold">คอร์สของฉัน</h1>
    <p class="mt-2 text-mute">เรียนรู้ IT และ Cyber Security ด้วยภาษาไทยที่เข้าใจง่าย</p>

    <div v-if="courses?.length" class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="c in courses"
        :key="c.stem"
        :to="c.path"
        class="group rounded-xl border border-line p-5 transition hover:border-ink"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-mute">{{ c.sourceName }}</p>
        <h2 class="mt-1 text-xl font-semibold group-hover:text-ink">{{ c.titleTh }}</h2>
        <p class="text-sm text-mute">{{ c.title }}</p>
        <p class="mt-3 leading-7 text-ink/80">{{ c.description }}</p>
        <p class="mt-4 text-sm text-mute">เขียนแล้ว {{ c.lessonCount }}{{ c.lessonTotal ? ` / ${c.lessonTotal}` : '' }} บทเรียน</p>
      </NuxtLink>
    </div>
    <p v-else class="mt-8 text-mute">ยังไม่มีคอร์ส</p>
  </main>
</template>
