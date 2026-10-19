<script setup lang="ts">
const { data: roadmaps } = await useRoadmaps()
useHead({ title: 'แผนที่การเรียน · Stackup' })
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-10">
    <h1 class="text-3xl font-bold">แผนที่การเรียน</h1>
    <p class="mt-2 text-mute">เลือกตำแหน่งที่อยากไป เพื่อดูว่าต้องเรียนอะไรบ้าง และเรียนไปถึงไหนแล้ว</p>

    <div v-if="roadmaps?.length" class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="r in roadmaps"
        :key="r.slug"
        :to="`/roadmap/${r.slug}`"
        class="group rounded-xl border border-line p-5 transition hover:border-ink"
      >
        <p v-if="r.map.role" class="text-xs font-medium uppercase tracking-wide text-mute">{{ r.map.role }}</p>
        <h2 class="mt-1 text-xl font-semibold">{{ r.map.titleTh }}</h2>
        <p class="text-sm text-mute">{{ r.map.title }}</p>
        <p class="mt-3 leading-7 text-ink/80">{{ r.map.summary ?? r.map.description }}</p>
        <div class="mt-4 flex items-center gap-2 text-xs text-mute">
          <span class="h-1.5 w-28 overflow-hidden rounded-full bg-line">
            <span class="block h-full rounded-full bg-ink" :style="{ width: `${pct(r.ready, r.total)}%` }" />
          </span>
          มีบทเรียนแล้ว {{ r.ready }} / {{ r.total }} หัวข้อ
        </div>
      </NuxtLink>
    </div>
    <p v-else class="mt-8 text-mute">ยังไม่มี roadmap</p>
  </main>
</template>
