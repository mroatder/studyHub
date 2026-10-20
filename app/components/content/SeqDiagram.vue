<script setup lang="ts">
// แผนภาพลำดับข้อความ (sequence diagram) แบบเคลื่อนไหว: ผู้เข้าร่วมเป็นคอลัมน์ ข้อความเป็นลูกศรที่ปรากฏทีละขั้น มีจุดวิ่งตามทิศทาง
interface Msg { from: number; to: number; label: string; note?: string; dashed?: boolean }
const props = defineProps<{
  actors: { label: string; icon?: string }[]
  messages: Msg[]
  caption?: string
}>()

const s = useStepper(computed(() => props.messages.length), 2400)
const n = computed(() => props.actors.length)
const pct = (i: number) => ((i + 0.5) / n.value) * 100
const cur = computed(() => props.messages[s.index.value]!)
const arrow = (m: Msg) => {
  const a = pct(m.from)
  const b = pct(m.to)
  return { left: Math.min(a, b), width: Math.abs(b - a), right: b > a, self: m.from === m.to, mid: (a + b) / 2 }
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="relative">
      <!-- ผู้เข้าร่วม -->
      <div class="grid gap-1" :style="{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }">
        <div v-for="(a, i) in actors" :key="i" class="flex flex-col items-center rounded-lg border border-line bg-paper px-1 py-2 text-center text-[11px] sm:text-sm">
          <span class="text-xl grayscale" aria-hidden="true">{{ a.icon || '🖥️' }}</span>
          <span class="font-medium leading-tight">{{ a.label }}</span>
        </div>
      </div>

      <!-- เส้นชีวิตและข้อความ -->
      <div class="relative mt-1">
        <div v-for="(a, i) in actors" :key="'l' + i" class="absolute bottom-0 top-0 w-px bg-line" :style="{ left: pct(i) + '%' }" />
        <ol class="relative">
          <li v-for="(m, i) in messages" :key="i" class="relative h-12 transition-opacity duration-300 motion-reduce:transition-none" :class="i <= s.index.value ? 'opacity-100' : 'opacity-0'" :aria-hidden="i > s.index.value">
            <template v-if="arrow(m).self">
              <span class="absolute top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] leading-tight sm:text-xs" :class="i === s.index.value ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'" :style="{ left: pct(m.from) + 1 + '%', maxWidth: '45%' }">{{ m.label }}</span>
            </template>
            <template v-else>
              <span class="absolute top-1/2 h-0.5" :class="[i === s.index.value ? 'bg-ink' : 'bg-mute/60', m.dashed ? 'opacity-60' : '']" :style="{ left: arrow(m).left + '%', width: arrow(m).width + '%', backgroundImage: m.dashed ? 'repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 10px)' : undefined }" />
              <span class="absolute top-1/2 -translate-y-1/2 text-xs leading-none" :class="i === s.index.value ? 'text-ink' : 'text-mute'" :style="{ left: arrow(m).right ? `calc(${arrow(m).left + arrow(m).width}% - 6px)` : `calc(${arrow(m).left}% - 2px)` }" aria-hidden="true">{{ arrow(m).right ? '▶' : '◀' }}</span>
              <span class="absolute -translate-x-1/2 rounded px-1 text-center text-[10px] leading-tight sm:text-xs" :class="i === s.index.value ? 'bg-paper font-semibold text-ink' : 'text-mute'" :style="{ left: arrow(m).mid + '%', top: '2px', maxWidth: Math.max(arrow(m).width, 24) + '%' }">{{ m.label }}</span>
              <span v-if="i === s.index.value" :key="'p' + s.index.value" class="dot absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" :style="{ '--from': pct(m.from) + '%', '--to': pct(m.to) + '%' }" />
            </template>
          </li>
        </ol>
      </div>
    </div>

    <p class="mt-3 min-h-16 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <strong>{{ s.index.value + 1 }}/{{ messages.length }} · {{ cur.label }}</strong>
      <template v-if="cur.note"> — {{ cur.note }}</template>
    </p>
    <div class="mt-3">
      <AnimControls :playing="s.playing.value" :is-first="s.isFirst.value" :is-last="s.isLast.value" @toggle="s.toggle" @prev="s.prev" @next="s.next" @reset="s.reset" />
    </div>
    <figcaption v-if="caption" class="mt-3 text-sm text-mute">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.dot {
  animation: travel 1.1s ease-in-out forwards;
}
@keyframes travel {
  from {
    left: var(--from);
  }
  to {
    left: var(--to);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    left: var(--to);
  }
}
</style>
