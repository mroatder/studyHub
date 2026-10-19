<script setup lang="ts">
// เมนูซ้ายของคอร์ส (แบบเดียวกับ roadmap.sh): Overview + Module แบบพับได้ + รายการบท เน้นบทปัจจุบัน
interface Lesson {
  path: string
  stem: string
  title: string
}
interface Mod {
  folder: string
  title: string
  titleTh: string
  planned: string[]
  lessons: Lesson[]
}
const props = defineProps<{ source: string; course: string; modules: Mod[]; currentPath?: string }>()
const overviewPath = computed(() => `/${props.source}/${props.course}`)

const currentModule = computed(() => props.modules.find((m) => m.lessons.some((l) => l.path === props.currentPath))?.folder)
const open = ref<Set<string>>(new Set(currentModule.value ? [currentModule.value] : []))
function toggle(folder: string) {
  const next = new Set(open.value)
  next.has(folder) ? next.delete(folder) : next.add(folder)
  open.value = next
}
</script>

<template>
  <nav aria-label="เมนูคอร์ส" class="text-sm">
    <NuxtLink
      :to="overviewPath"
      class="flex items-center gap-2 border-b border-line px-4 py-3 transition hover:bg-soft"
      :class="currentPath === undefined ? 'font-semibold' : 'text-mute'"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
      ภาพรวมคอร์ส
    </NuxtLink>

    <div v-for="(m, i) in modules" :key="m.folder" class="border-b border-line">
      <button
        type="button"
        class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-soft"
        :aria-expanded="open.has(m.folder)"
        @click="toggle(m.folder)"
      >
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium"
          :class="currentModule === m.folder ? 'border-ink bg-ink text-paper' : 'border-line text-mute'"
        >{{ i + 1 }}</span>
        <span class="flex-1 leading-5" :class="currentModule === m.folder ? 'font-semibold' : ''">
          {{ m.titleTh }}
          <span class="block text-xs font-normal text-mute">{{ m.title }}</span>
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="mt-1 shrink-0 text-mute transition-transform motion-reduce:transition-none" :class="open.has(m.folder) ? 'rotate-90' : ''" aria-hidden="true"
        ><path d="M9 6l6 6-6 6" /></svg>
      </button>

      <ol v-show="open.has(m.folder)" class="bg-soft pb-1">
        <li v-for="(l, li) in m.lessons" :key="l.stem">
          <NuxtLink
            :to="l.path"
            class="flex items-start gap-3 py-2 pl-5 pr-4 leading-5 transition hover:bg-line/60"
            :class="l.path === currentPath ? 'bg-line/70 font-semibold' : ''"
            :aria-current="l.path === currentPath ? 'page' : undefined"
          >
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]"
              :class="l.path === currentPath ? 'border-ink bg-ink text-paper' : 'border-mute text-mute'"
            >{{ li + 1 }}</span>
            <span>{{ l.title }}</span>
          </NuxtLink>
        </li>
        <li v-for="(t, pi) in m.planned" :key="t" class="flex items-start gap-3 py-2 pl-5 pr-4 leading-5 text-mute/70">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-[11px]">{{ m.lessons.length + pi + 1 }}</span>
          <span>{{ t }} <span class="text-xs">· เร็วๆ นี้</span></span>
        </li>
        <li v-if="!m.lessons.length && !m.planned.length" class="py-2 pl-12 pr-4 text-xs text-mute/70">ยังไม่มีบทเรียน</li>
      </ol>
    </div>
  </nav>
</template>
