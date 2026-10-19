<script setup lang="ts">
// โครงหน้าคอร์ส: แถบบน + เมนูซ้าย + เนื้อหา (มือถือเปิดเมนูด้วยปุ่ม)
interface Mod {
  folder: string
  title: string
  titleTh: string
  planned: string[]
  lessons: { path: string; stem: string; title: string }[]
}
const props = defineProps<{
  source: string
  course: string
  courseTitle: string
  lessonTotal?: number
  modules: Mod[]
  currentPath?: string
}>()
const menuOpen = ref(false)
const written = computed(() => props.modules.reduce((n, m) => n + m.lessons.length, 0))
const route = useRoute()
watch(() => route.path, () => (menuOpen.value = false))
</script>

<template>
  <div>
    <div class="border-b border-line">
      <div class="mx-auto flex max-w-[100rem] items-center gap-3 px-4 py-2.5 text-sm">
        <NuxtLink to="/" class="flex items-center gap-1 text-mute transition hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          คอร์สทั้งหมด
        </NuxtLink>
        <span class="h-4 w-px bg-line" />
        <span class="font-semibold">{{ courseTitle }}</span>
        <span class="hidden text-mute sm:inline">{{ modules.length }} โมดูล · {{ lessonTotal ?? written }} บทเรียน (เขียนแล้ว {{ written }})</span>
        <button
          type="button"
          class="ml-auto rounded-md border border-line px-2.5 py-1 text-xs transition hover:border-ink lg:hidden"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          {{ menuOpen ? 'ปิดเมนู' : 'เมนูคอร์ส' }}
        </button>
      </div>
    </div>

    <div class="mx-auto grid max-w-[100rem] lg:grid-cols-[18.5rem_minmax(0,1fr)]">
      <aside
        class="border-line lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-r"
        :class="menuOpen ? 'block border-b' : 'hidden'"
      >
        <CourseSidebar :source="source" :course="course" :modules="modules" :current-path="currentPath" />
      </aside>
      <div class="min-w-0">
        <slot />
      </div>
    </div>
  </div>
</template>
