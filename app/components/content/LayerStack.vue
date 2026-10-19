<script setup lang="ts">
// ชั้นซ้อน เช่น hardware / OS / app (รายการแรกอยู่บนสุด) กดเลือกชั้นเพื่อดูคำอธิบาย
const props = defineProps<{ layers: { title: string; text: string; example?: string }[] }>()
const s = useStepper(computed(() => props.layers.length), 2500)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-col gap-2">
      <button
        v-for="(l, i) in layers"
        :key="i"
        type="button"
        class="rounded-xl border-2 px-4 py-3 text-left transition-all motion-reduce:transition-none"
        :class=" i === s.index.value
            ? 'border-ink bg-paper'
            : 'border-line hover:border-ink'"
        :aria-pressed="i === s.index.value"
        @click="s.goto(i)"
      >
        <span class="font-semibold">{{ l.title }}</span>
        <span v-if="l.example" class="ml-2 text-sm text-mute">{{ l.example }}</span>
      </button>
    </div>
    <p class="mt-4 min-h-14 leading-8 text-ink/80" aria-live="polite">
      {{ layers[s.index.value]?.text }}
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
