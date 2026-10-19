<script setup lang="ts">
// เปรียบเทียบ 2-3 อย่างเคียงกัน
defineProps<{ items: { title: string; subtitle?: string; points: string[] }[] }>()
</script>

<template>
  <div class="not-prose my-8 grid gap-4" :class="items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'">
    <section
      v-for="(it, i) in items"
      :key="i"
      class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h4 class="text-lg font-semibold">{{ it.title }}</h4>
      <p v-if="it.subtitle" class="text-sm text-indigo-600 dark:text-indigo-400">{{ it.subtitle }}</p>
      <ul class="mt-3 list-disc space-y-2 pl-5 leading-7 text-slate-700 dark:text-slate-300">
        <li v-for="(p, j) in it.points" :key="j">{{ p }}</li>
      </ul>
    </section>
  </div>
</template>
