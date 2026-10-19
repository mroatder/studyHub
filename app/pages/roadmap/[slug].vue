<script setup lang="ts">
// แผนที่การเรียน: กลุ่มหัวข้อแบบพับได้ หัวข้อที่มีบทเรียนแล้วกดเข้าไปเรียนได้
const NuxtLinkC = resolveComponent('NuxtLink')
const route = useRoute()
const slug = route.params.slug as string

const { data: all } = await useRoadmaps()
const data = computed(() => all.value?.find((r) => r.slug === slug) ?? null)
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบแผนที่การเรียนนี้', fatal: true })
useHead({ title: `${data.value.map.titleTh} · Stackup` })

const onlyReady = ref(false)
const open = ref<Set<string>>(new Set(data.value.groups.filter((g) => g.ready > 0).map((g) => g.id)))
function toggle(id: string) {
  const next = new Set(open.value)
  next.has(id) ? next.delete(id) : next.add(id)
  open.value = next
}
const allOpen = computed(() => open.value.size === data.value!.groups.length)
function toggleAll() {
  open.value = allOpen.value ? new Set() : new Set(data.value!.groups.map((g) => g.id))
}
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
</script>

<template>
  <main v-if="data" class="mx-auto max-w-5xl px-4 py-10">
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
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="toggleAll">
        {{ allOpen ? 'ย่อทุกกลุ่ม' : 'ขยายทุกกลุ่ม' }}
      </button>
      <label class="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-1.5 transition hover:border-ink">
        <input v-model="onlyReady" type="checkbox" class="accent-[var(--ink)]" />
        เฉพาะหัวข้อที่มีบทเรียน
      </label>
    </div>

    <ol class="mt-6 space-y-3">
      <li v-for="(g, gi) in data.groups" :key="g.id" class="rounded-xl border border-line">
        <button type="button" class="flex w-full items-start gap-3 p-4 text-left" :aria-expanded="open.has(g.id)" @click="toggle(g.id)">
          <span
            class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium"
            :class="g.ready ? 'border-ink bg-ink text-paper' : 'border-line text-mute'"
          >{{ gi + 1 }}</span>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold">{{ g.titleTh }}</span>
            <span class="block text-sm text-mute">{{ g.title }}</span>
            <span v-if="g.summary" class="mt-1 block text-sm leading-6 text-ink/70">{{ g.summary }}</span>
            <span class="mt-2 flex items-center gap-2 text-xs text-mute">
              <span class="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                <span class="block h-full rounded-full bg-ink" :style="{ width: `${pct(g.ready, g.topics.length)}%` }" />
              </span>
              {{ g.ready }} / {{ g.topics.length }} หัวข้อมีบทเรียน
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-1 shrink-0 text-mute transition-transform motion-reduce:transition-none" :class="open.has(g.id) ? 'rotate-90' : ''" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        <div v-show="open.has(g.id)" class="border-t border-line px-4 pb-4 pt-3">
          <NuxtLink v-if="g.course" :to="g.course" class="mb-3 inline-block rounded-md border border-ink px-3 py-1 text-sm transition hover:bg-ink hover:text-paper">เรียนคอร์สนี้ →</NuxtLink>
          <ul class="ml-3 space-y-3 border-l border-line pl-5">
            <template v-for="t in g.topics" :key="t.title">
              <li v-if="!onlyReady || t.ready" class="relative">
                <span class="absolute -left-[1.6rem] top-2 h-2.5 w-2.5 rounded-full border-2" :class="t.ready ? 'border-ink bg-ink' : 'border-mute bg-paper'" />
                <component :is="t.ready ? NuxtLinkC : 'div'" :to="t.ready ? t.lesson : undefined" class="block" :class="t.ready ? 'group' : ''">
                  <span class="block leading-6" :class="t.ready ? 'font-medium group-hover:underline group-hover:underline-offset-4' : 'text-ink/80'">{{ t.titleTh }}</span>
                  <span class="block text-xs text-mute">
                    {{ t.title }}<template v-if="t.ready"> · มีบทเรียนแล้ว ↗</template><template v-else> · เร็วๆ นี้</template>
                  </span>
                </component>
                <ul v-if="t.children?.length" class="mt-2 flex flex-wrap gap-1.5">
                  <li v-for="c in t.children" :key="c" class="rounded border border-line px-1.5 py-0.5 text-[11px] text-mute">{{ c }}</li>
                </ul>
              </li>
            </template>
          </ul>
        </div>
      </li>
    </ol>
  </main>
</template>
