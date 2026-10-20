<script setup lang="ts">
// แผนที่การเรียนแบบแผนภาพเหมือน roadmap.sh: แกนกลางเรียงกลุ่มหลักด้วยเส้นทึบ
// กลุ่มต่อกับหัวข้อด้วยเส้นประ หัวข้อที่มีหัวข้อย่อยต่อเส้นประไปหาชิปด้านข้าง และกลุ่มฝึกฝนแยกเป็นกิ่งด้านข้าง
import type { MapTopic } from './RoadmapTopic.vue'

interface MapGroup {
  id: string
  title: string
  titleTh: string
  summary?: string
  course?: string
  ready: number
  topics: MapTopic[]
}
const props = defineProps<{
  groups: MapGroup[]
  selected?: string
  level: number
  onlyReady: boolean
  sideIds?: string[]
}>()
defineEmits<{ select: [topic: MapTopic] }>()
const NuxtLinkC = resolveComponent('NuxtLink')

const side = computed(() => props.groups.filter((g) => (props.sideIds ?? ['practice']).includes(g.id)))
const spine = computed(() => props.groups.filter((g) => !(props.sideIds ?? ['practice']).includes(g.id)))
const dim = (t: MapTopic) => (props.onlyReady && !t.ready) || (!!props.level && t.level !== props.level)
// กลุ่มที่มีหัวข้อมาก กางเป็นหลายคอลัมน์ ไม่ให้แกนยาวเกินไป
const wide = (g: MapGroup) => g.topics.length > 10
const groupIndex = (g: MapGroup) => props.groups.findIndex((x) => x.id === g.id) + 1
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
    <!-- กิ่งด้านข้าง: ฝึกฝนและใบรับรอง -->
    <aside class="order-last lg:order-first" aria-label="กิ่งด้านข้าง">
      <section v-for="g in side" :key="g.id" class="lg:sticky lg:top-6">
        <div class="rounded-md border-2 border-ink px-4 py-3 text-center">
          <h2 class="font-semibold">{{ g.titleTh }}</h2>
          <p class="text-xs text-mute">{{ g.title }}</p>
        </div>
        <div class="mx-auto h-6 w-0 border-l-2 border-dotted border-mute" aria-hidden="true" />
        <ul class="space-y-3">
          <li v-for="t in g.topics" :key="t.title">
            <RoadmapTopic :topic="t" :dim="dim(t)" :selected="selected === t.title" @select="$emit('select', $event)" />
          </li>
        </ul>
      </section>
    </aside>

    <!-- แกนกลาง -->
    <div>
      <section v-for="(g, i) in spine" :key="g.id" :aria-labelledby="`g-${g.id}`">
        <div v-if="i > 0" class="mx-auto h-10 w-0 border-l-2 border-ink" aria-hidden="true" />
        <component
          :is="g.course ? NuxtLinkC : 'div'"
          :to="g.course || undefined"
          class="mx-auto block max-w-md rounded-md bg-ink px-5 py-3 text-center text-paper"
          :class="g.course ? 'transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink' : ''"
        >
          <span class="text-xs opacity-70">ขั้นที่ {{ groupIndex(g) }}</span>
          <h2 :id="`g-${g.id}`" class="font-semibold">{{ g.titleTh }}</h2>
          <p class="text-xs opacity-70">{{ g.title }}</p>
          <p v-if="g.course" class="mt-1 text-xs underline underline-offset-4">กดเพื่อเข้าเรียนคอร์สนี้ →</p>
        </component>
        <p v-if="g.summary" class="mx-auto mt-2 max-w-md text-center text-sm text-mute">{{ g.summary }}</p>
        <div class="mt-2 text-center">
          <span class="text-xs text-mute">{{ g.ready }} / {{ g.topics.length }} หัวข้อมีบทเรียน</span>
        </div>
        <div class="mx-auto h-6 w-0 border-l-2 border-dotted border-mute" aria-hidden="true" />

        <ul v-if="wide(g)" class="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          <li v-for="t in g.topics" :key="t.title">
            <RoadmapTopic :topic="t" :dim="dim(t)" :selected="selected === t.title" @select="$emit('select', $event)" />
          </li>
        </ul>
        <ul v-else class="mx-auto max-w-3xl space-y-3 md:flex md:flex-col md:items-start md:space-y-3 md:pl-[max(0px,calc(50%-9rem))]">
          <li v-for="t in g.topics" :key="t.title" class="w-full md:w-auto">
            <RoadmapTopic inline :topic="t" :dim="dim(t)" :selected="selected === t.title" @select="$emit('select', $event)" />
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
