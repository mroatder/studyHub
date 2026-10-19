<script setup lang="ts">
const route = useRoute()
const { data } = await useCourse(route.params.source as string, route.params.course as string)
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบคอร์สนี้', fatal: true })
useHead({ title: `${data.value.course.titleTh} · Study Hub` })
</script>

<template>
  <main v-if="data" class="mx-auto max-w-3xl px-4 py-10">
    <NuxtLink to="/" class="text-sm text-slate-500 hover:underline">← คอร์สทั้งหมด</NuxtLink>
    <p class="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{{ data.course.sourceName }}</p>
    <h1 class="text-3xl font-bold">{{ data.course.titleTh }}</h1>
    <p class="text-slate-500">{{ data.course.title }}</p>
    <p class="mt-4 leading-8 text-slate-700 dark:text-slate-300">{{ data.course.description }}</p>
    <a
      v-if="data.course.sourceUrl"
      :href="data.course.sourceUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
    >
      ต้นทาง: {{ data.course.sourceName }} ↗
    </a>

    <section v-for="(m, mi) in data.modules" :key="m.folder" class="mt-10">
      <h2 class="text-xl font-semibold">Module {{ mi + 1 }}: {{ m.titleTh }}</h2>
      <p class="text-sm text-slate-500">{{ m.title }}</p>
      <p v-if="m.description" class="mt-2 text-slate-700 dark:text-slate-300">{{ m.description }}</p>
      <ol class="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        <li v-for="(l, li) in m.lessons" :key="l.stem">
          <NuxtLink :to="l.path" class="flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900">
            <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium dark:bg-slate-800">
              {{ li + 1 }}
            </span>
            <span>
              <span class="block font-medium">{{ l.title }}</span>
              <span v-if="l.summary" class="block text-sm text-slate-500">{{ l.summary }}</span>
            </span>
          </NuxtLink>
        </li>
        <li v-if="!m.lessons.length" class="px-4 py-3 text-sm text-slate-500">ยังไม่มีบทเรียน</li>
      </ol>
    </section>
  </main>
</template>
