<script setup lang="ts">
// แผนภาพทีละขั้น กดถัดไป/ย้อนกลับได้
const props = defineProps<{ steps: { title: string; text: string }[]; caption?: string }>()
const s = useStepper(computed(() => props.steps.length), 3500)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <ol class="mb-4 flex items-center gap-1.5" aria-label="ขั้นตอน">
      <li v-for="(st, i) in steps" :key="i" class="flex-1">
        <button
          type="button"
          class="h-2 w-full rounded-full transition-colors"
          :class="i <= s.index.value ? 'bg-ink' : 'bg-line'"
          :aria-label="`ไปขั้นที่ ${i + 1}: ${st.title}`"
          @click="s.goto(i)"
        />
      </li>
    </ol>
    <div class="min-h-32" aria-live="polite">
      <p class="text-sm font-medium text-mute">ขั้นที่ {{ s.index.value + 1 }} / {{ steps.length }}</p>
      <Transition name="fade" mode="out-in">
        <div :key="s.index.value">
          <h4 class="mt-1 text-lg font-semibold">{{ steps[s.index.value]?.title }}</h4>
          <p class="mt-2 leading-8 text-ink/80">{{ steps[s.index.value]?.text }}</p>
        </div>
      </Transition>
    </div>
    <AnimControls
      class="mt-4"
      :playing="s.playing.value"
      :is-first="s.isFirst.value"
      :is-last="s.isLast.value"
      @toggle="s.toggle"
      @prev="s.prev"
      @next="s.next"
      @reset="s.reset"
    />
    <figcaption v-if="caption" class="mt-3 text-sm text-mute">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
