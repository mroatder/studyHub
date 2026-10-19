<script setup lang="ts">
// เปรียบเทียบ 2-3 อย่างเคียงกัน
defineProps<{ items: { title: string; subtitle?: string; points: string[] }[] }>()
</script>

<template>
  <div class="not-prose my-8 grid gap-4" :class="items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'">
    <section
      v-for="(it, i) in items"
      :key="i"
      class="rounded-xl border border-line bg-soft p-5"
    >
      <h4 class="text-lg font-semibold">{{ it.title }}</h4>
      <p v-if="it.subtitle" class="text-sm text-mute">{{ it.subtitle }}</p>
      <ul class="mt-3 list-disc space-y-2 pl-5 leading-7 text-ink/80">
        <li v-for="(p, j) in it.points" :key="j">{{ p }}</li>
      </ul>
    </section>
  </div>
</template>
