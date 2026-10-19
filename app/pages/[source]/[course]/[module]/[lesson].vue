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

useHead({ title: `${page.value.title} · Stackup` })

const toc = computed(() => page.value?.body?.toc?.links ?? [])
</script>

<template>
  <CourseShell
    v-if="page && courseData"
    :source="source"
    :course="course"
    :course-title="courseData.course.titleTh"
    :lesson-total="courseData.course.lessonTotal"
    :modules="courseData.modules"
    :current-path="route.path"
  >
    <div class="flex gap-10 px-4 py-8 lg:px-8">
      <article class="mx-auto min-w-0 max-w-5xl flex-1">
        <p class="text-xs uppercase tracking-wide text-mute">Module {{ page.module }} · Lesson {{ page.lesson }}</p>
        <h1 class="mt-2 text-2xl font-bold leading-snug sm:text-3xl">{{ page.title }}</h1>
        <p v-if="page.titleEn" class="text-mute">{{ page.titleEn }}</p>

        <details v-if="toc.length" class="mt-4 rounded-lg border border-line bg-soft xl:hidden">
          <summary class="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium">สารบัญหน้านี้</summary>
          <ul class="space-y-1 border-t border-line px-3 py-2 text-sm">
            <li v-for="l in toc" :key="l.id">
              <a :href="`#${l.id}`" class="flex min-h-9 items-center text-mute hover:text-ink">{{ l.text }}</a>
            </li>
          </ul>
        </details>

        <div
          class="prose mt-6 max-w-none text-[1.0625rem] leading-9 prose-headings:scroll-mt-20 prose-headings:no-underline [&_:is(h2,h3)_a]:no-underline prose-headings:leading-snug prose-table:text-base"
        >
          <ContentRenderer :value="page" />
        </div>

        <a
          v-if="page.sourceUrl"
          :href="page.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-8 inline-block text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
        >
          ลิงก์ต้นทาง ↗
        </a>

        <nav class="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="บทก่อนหน้า/ถัดไป">
          <NuxtLink v-if="prev" :to="prev.path" class="rounded-xl border border-line p-4 transition hover:border-ink">
            <span class="text-xs text-mute">← บทก่อนหน้า</span>
            <span class="mt-1 block font-medium">{{ prev.title }}</span>
          </NuxtLink>
          <span v-else />
          <NuxtLink v-if="next" :to="next.path" class="rounded-xl border border-line p-4 text-right transition hover:border-ink">
            <span class="text-xs text-mute">บทถัดไป →</span>
            <span class="mt-1 block font-medium">{{ next.title }}</span>
          </NuxtLink>
        </nav>
      </article>

      <aside v-if="toc.length" class="hidden w-52 shrink-0 xl:block">
        <div class="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto text-sm">
          <p class="mb-2 font-semibold">สารบัญหน้านี้</p>
          <ul class="space-y-2 border-l border-line pl-3">
            <li v-for="l in toc" :key="l.id">
              <a :href="`#${l.id}`" class="text-mute transition hover:text-ink">{{ l.text }}</a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </CourseShell>
</template>
