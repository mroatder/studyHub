<script setup lang="ts">
// ข้อมูลวิ่งระหว่างกล่อง เช่น packet จากเครื่อง A ไป B
const props = defineProps<{
  nodes: { label: string; icon?: string }[]
  captions?: string[]
  packet?: string
}>()
const s = useStepper(computed(() => props.nodes.length), 1500)
// ตำแหน่งแพ็กเก็ต (เปอร์เซ็นต์ของความกว้าง) = จุดกึ่งกลางของกล่องที่กำลังอยู่
const left = computed(() => ((s.index.value + 0.5) / props.nodes.length) * 100)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }">
      <div
        v-for="(n, i) in nodes"
        :key="i"
        class="flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 text-center text-xs transition-colors sm:text-sm"
        :class=" i === s.index.value
            ? 'border-ink bg-paper'
            : 'border-line'"
      >
        <span class="text-2xl grayscale" aria-hidden="true">{{ n.icon || '🖥️' }}</span>
        <span class="font-medium">{{ n.label }}</span>
      </div>
    </div>
    <div class="pointer-events-none relative mt-3 h-8">
      <div class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
      <div
        class="packet absolute top-1/2 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink px-2 text-xs font-bold text-paper grayscale"
        :style="{ left: `${left}%` }"
      >
        {{ packet || '✉' }}
      </div>
    </div>
    <p class="mt-3 min-h-14 leading-8 text-ink/80" aria-live="polite">
      {{ captions?.[s.index.value] ?? `กำลังอยู่ที่: ${nodes[s.index.value]?.label}` }}
    </p>
    <AnimControls
      :playing="s.playing.value"
      :is-first="s.isFirst.value"
      :is-last="s.isLast.value"
      @toggle="s.toggle"
      @prev="s.prev"
      @next="s.next"
      @reset="s.reset"
    />
  </figure>
</template>

<style scoped>
.packet {
  transition: left 0.9s ease-in-out;
}
@media (prefers-reduced-motion: reduce) {
  .packet {
    transition: none;
  }
}
</style>
