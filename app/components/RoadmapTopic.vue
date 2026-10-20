<script setup lang="ts">
// กล่องหัวข้อหนึ่งใบในแผนที่: กดเพื่อดูรายละเอียด หัวข้อย่อย (children) ต่อด้วยเส้นประเหมือน roadmap.sh
export interface MapTopic {
  title: string
  titleTh: string
  lesson?: string
  note?: string
  level?: number
  children?: string[]
  ready: boolean
}
defineProps<{ topic: MapTopic; inline?: boolean; dim?: boolean; selected?: boolean }>()
defineEmits<{ select: [topic: MapTopic] }>()
</script>

<template>
  <div class="flex flex-col gap-2 transition-opacity motion-reduce:transition-none" :class="[inline ? 'md:flex-row md:items-center' : '', dim ? 'opacity-25' : '']">
    <button
      type="button"
      class="w-full rounded-md border-2 px-3 py-2 text-left text-sm leading-5 transition md:shrink-0"
      :class="[
        inline ? 'md:w-72' : '',
        topic.ready ? 'border-ink bg-ink text-paper' : 'border-ink bg-paper text-ink hover:bg-soft',
        selected ? 'outline outline-2 outline-offset-2 outline-ink' : '',
      ]"
      :aria-pressed="selected"
      @click="$emit('select', topic)"
    >
      <span class="block font-medium">{{ topic.titleTh }}</span>
      <span class="block text-xs opacity-70">{{ topic.title }}</span>
    </button>

    <template v-if="topic.children?.length">
      <span v-if="inline" class="hidden w-8 shrink-0 border-t-2 border-dotted border-mute md:block" aria-hidden="true" />
      <ul class="flex flex-wrap gap-1.5 border-l-2 border-dotted border-mute pl-3" :class="inline ? 'md:border-l-0 md:pl-0' : 'ml-4'">
        <li v-for="c in topic.children" :key="c" class="rounded border border-ink bg-paper px-2 py-0.5 text-xs">{{ c }}</li>
      </ul>
    </template>
  </div>
</template>
