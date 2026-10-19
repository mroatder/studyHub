<script setup lang="ts">
const route = useRoute()
const source = route.params.source as string
const course = route.params.course as string

const { data: page } = await useAsyncData(`lesson:${route.path}`, () =>
  queryCollection('lessons').path(route.path).first(),
)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบบทเรียนนี้', fatal: true })

// บทก่อนหน้า / ถัดไป (เฉพาะในคอร์สเดียวกัน)
const { data: surround } = await useAsyncData(`surround:${route.path}`, async () => {
  const all = await queryCollectionItemSurroundings('lessons', route.path, { fields: ['title', 'stem'] })
  const prefix = `${source}/${course}/`
  return all.map((l) => (l?.stem?.startsWith(prefix) ? l : null))
})
const prev = computed(() => surround.value?.[0])
const next = computed(() => surround.value?.[1])

const { data: courseData } = await useCourse(source, course)

useHead({ title: `${page.value.title} · Study Hub` })

const toc = computed(() => page.value?.body?.toc?.links ?? [])
</script>

<template>
  <div v-if="page" class="mx-auto flex max-w-5xl gap-10 px-4 py-8">
    <article class="min-w-0 max-w-3xl flex-1">
      <nav class="text-sm text-slate-500" aria-label="breadcrumb">
        <NuxtLink to="/" class="hover:underline">หน้าแรก</NuxtLink>
        <span> / </span>
        <NuxtLink :to="`/${source}/${course}`" class="hover:underline">{{ courseData?.course.titleTh }}</NuxtLink>
      </nav>
      <h1 class="mt-3 text-3xl font-bold leading-snug">{{ page.title }}</h1>
      <p v-if="page.titleEn" class="text-slate-500">{{ page.titleEn }}</p>

      <div
        class="prose prose-slate mt-6 max-w-none text-[1.0625rem] leading-9 dark:prose-invert prose-headings:scroll-mt-20 prose-headings:no-underline [&_:is(h2,h3)_a]:no-underline prose-headings:leading-snug prose-table:text-base"
      >
        <ContentRenderer :value="page" />
      </div>

      <a
        v-if="page.sourceUrl"
        :href="page.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-8 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ลิงก์ต้นทาง ↗
      </a>

      <nav class="mt-10 grid gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:grid-cols-2" aria-label="บทก่อนหน้า/ถัดไป">
        <NuxtLink
          v-if="prev"
          :to="prev.path"
          class="rounded-xl border border-slate-200 p-4 hover:border-indigo-400 dark:border-slate-800"
        >
          <span class="text-xs text-slate-500">← บทก่อนหน้า</span>
          <span class="mt-1 block font-medium">{{ prev.title }}</span>
        </NuxtLink>
        <span v-else />
        <NuxtLink
          v-if="next"
          :to="next.path"
          class="rounded-xl border border-slate-200 p-4 text-right hover:border-indigo-400 dark:border-slate-800"
        >
          <span class="text-xs text-slate-500">บทถัดไป →</span>
          <span class="mt-1 block font-medium">{{ next.title }}</span>
        </NuxtLink>
      </nav>
    </article>

    <aside v-if="toc.length" class="hidden w-56 shrink-0 lg:block">
      <div class="sticky top-20 text-sm">
        <p class="mb-2 font-semibold">สารบัญ</p>
        <ul class="space-y-2 border-l border-slate-200 pl-3 dark:border-slate-800">
          <li v-for="l in toc" :key="l.id">
            <a :href="`#${l.id}`" class="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
              {{ l.text }}
            </a>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>
