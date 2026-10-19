<script setup lang="ts">
defineProps<{ playing: boolean; isFirst: boolean; isLast: boolean; showPlay?: boolean }>()
defineEmits<{ prev: []; next: []; toggle: []; reset: [] }>()

const btn =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium transition hover:bg-soft disabled:opacity-40 disabled:hover:bg-transparent'
</script>

<template>
  <div class="not-prose flex flex-wrap items-center gap-2">
    <button v-if="showPlay !== false" type="button" :class="btn" @click="$emit('toggle')">
      {{ playing ? '⏸ หยุด' : '▶ เล่น' }}
    </button>
    <button type="button" :class="btn" :disabled="isFirst" @click="$emit('prev')">← ย้อนกลับ</button>
    <button type="button" :class="btn" :disabled="isLast" @click="$emit('next')">ถัดไป →</button>
    <button type="button" :class="btn" @click="$emit('reset')">↺ เริ่มใหม่</button>
  </div>
</template>
