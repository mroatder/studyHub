<script setup lang="ts">
// แผนที่การเรียนแบบแผนภาพ (เหมือน roadmap.sh): กดหัวข้อเพื่อดูรายละเอียด หัวข้อที่มีบทเรียนแล้วกดเข้าไปเรียนได้
import type { MapTopic } from '~/components/RoadmapTopic.vue'

const NuxtLinkC = resolveComponent('NuxtLink')
const route = useRoute()
const slug = route.params.slug as string

const { data: all } = await useRoadmaps()
const data = computed(() => all.value?.find((r) => r.slug === slug) ?? null)
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบแผนที่การเรียนนี้', fatal: true })
useHead({ title: `${data.value.map.titleTh} · Stackup` })

const onlyReady = ref(false)
const levelNames: Record<number, string> = { 1: 'พื้นฐาน', 2: 'แกนหลัก', 3: 'เสริม/เฉพาะทาง' }
const level = ref(0) // 0 = ทุกระดับ
const picked = ref<MapTopic | null>(null)
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') picked.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <main v-if="data" class="mx-auto max-w-6xl px-4 py-10">
    <NuxtLink to="/roadmap" class="text-sm text-mute transition hover:text-ink">← แผนที่ทั้งหมด</NuxtLink>
    <p class="mt-4 text-xs font-medium uppercase tracking-wide text-mute">{{ data.map.role ?? 'Roadmap' }}</p>
    <h1 class="mt-1 text-3xl font-bold">{{ data.map.titleTh }}</h1>
    <p class="mt-3 leading-8 text-ink/80">{{ data.map.description }}</p>
    <a
      v-if="data.map.sourceUrl"
      :href="data.map.sourceUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-1 inline-block text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
    >
      อ้างอิงหัวข้อจาก {{ data.map.sourceName }} ↗
    </a>

    <div class="mt-6 rounded-xl border border-line bg-soft p-4">
      <div class="flex items-baseline justify-between gap-2 text-sm">
        <span class="font-medium">มีบทเรียนแล้ว {{ data.ready }} / {{ data.total }} หัวข้อ</span>
        <span class="text-mute">{{ pct(data.ready, data.total) }}%</span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <div class="h-full rounded-full bg-ink transition-[width] duration-700 motion-reduce:transition-none" :style="{ width: `${Math.max(pct(data.ready, data.total), 1)}%` }" />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <label class="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-1.5 transition hover:border-ink">
        <input v-model="onlyReady" type="checkbox" class="accent-[var(--ink)]" />
        เน้นหัวข้อที่มีบทเรียน
      </label>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="กรองตามระดับ">
        <button
          v-for="n in [0, 1, 2, 3]"
          :key="n"
          type="button"
          class="rounded-md border px-3 py-1.5 transition"
          :class="level === n ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'"
          :aria-pressed="level === n"
          @click="level = n"
        >{{ n ? levelNames[n] : 'ทุกระดับ' }}</button>
      </div>
    </div>

    <ul class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-mute" aria-label="คำอธิบายสัญลักษณ์">
      <li class="flex items-center gap-1.5"><span class="inline-block h-3 w-5 rounded-sm border-2 border-ink bg-ink" />มีบทเรียนแล้ว</li>
      <li class="flex items-center gap-1.5"><span class="inline-block h-3 w-5 rounded-sm border-2 border-ink bg-paper" />ยังไม่มีบทเรียน</li>
      <li class="flex items-center gap-1.5"><span class="inline-block w-5 border-t-2 border-dotted border-mute" />เส้นประ = หัวข้อย่อยในกลุ่ม</li>
      <li>กดที่หัวข้อเพื่อดูรายละเอียด</li>
    </ul>

    <div class="mt-8">
      <RoadmapMap :groups="data.groups" :selected="picked?.title" :level="level" :only-ready="onlyReady" @select="picked = $event" />
    </div>

    <!-- แผงรายละเอียด: ขอบล่างบนมือถือ, ขอบขวาบนจอใหญ่ -->
    <Transition name="panel">
      <aside
        v-if="picked"
        class="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto border-t-2 border-ink bg-paper p-5 shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-96 lg:border-l-2 lg:border-t-0"
        role="dialog"
        aria-label="รายละเอียดหัวข้อ"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold leading-7">{{ picked.titleTh }}</h2>
            <p class="text-sm text-mute">{{ picked.title }}</p>
          </div>
          <button type="button" class="shrink-0 rounded-md border border-line px-2.5 py-1 text-sm transition hover:border-ink" aria-label="ปิดแผงรายละเอียด" @click="picked = null">ปิด ✕</button>
        </div>
        <p v-if="picked.level" class="mt-3 inline-block rounded border border-line px-2 py-0.5 text-xs text-mute">ระดับ: {{ levelNames[picked.level] }}</p>
        <p v-if="picked.note" class="mt-3 leading-7 text-ink/80">{{ picked.note }}</p>
        <div v-if="picked.children?.length" class="mt-4">
          <p class="text-xs font-medium text-mute">หัวข้อย่อย</p>
          <ul class="mt-1.5 flex flex-wrap gap-1.5">
            <li v-for="c in picked.children" :key="c" class="rounded border border-line px-2 py-0.5 text-xs">{{ c }}</li>
          </ul>
        </div>
        <div class="mt-5">
          <component :is="NuxtLinkC" v-if="picked.ready && picked.lesson" :to="picked.lesson" class="inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-80">ไปเรียนบทนี้ →</component>
          <p v-else class="text-sm text-mute">ยังไม่มีบทเรียนของหัวข้อนี้ในเว็บ (เร็วๆ นี้)</p>
        </div>
      </aside>
    </Transition>
  </main>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  transform: translateY(1rem);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .panel-enter-active,
  .panel-leave-active {
    transition: none;
  }
}
</style>
