<script setup lang="ts">
const route = useRoute()
const source = route.params.source as string
const course = route.params.course as string
const { data } = await useCourse(source, course)
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบคอร์สนี้', fatal: true })
useHead({ title: `${data.value.course.titleTh} · Study Hub` })
</script>

<template>
  <CourseShell
    v-if="data"
    :source="source"
    :course="course"
    :course-title="data.course.titleTh"
    :lesson-total="data.course.lessonTotal"
    :modules="data.modules"
  >
    <main class="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <p class="text-xs font-medium uppercase tracking-wide text-mute">{{ data.course.sourceName }}</p>
      <h1 class="text-3xl font-bold">{{ data.course.titleTh }}</h1>
      <p class="text-mute">{{ data.course.title }}</p>
      <p class="mt-4 leading-8 text-ink/80">{{ data.course.description }}</p>
      <a
        v-if="data.course.sourceUrl"
        :href="data.course.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-block text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
      >
        ต้นทาง: {{ data.course.sourceName }} ↗
      </a>

      <section v-for="(m, mi) in data.modules" :key="m.folder" class="mt-10">
        <h2 class="text-xl font-semibold">Module {{ mi + 1 }}: {{ m.titleTh }}</h2>
        <p class="text-sm text-mute">{{ m.title }}</p>
        <p v-if="m.description" class="mt-2 text-ink/80">{{ m.description }}</p>
        <ol class="mt-4 divide-y divide-line rounded-xl border border-line">
          <li v-for="(l, li) in m.lessons" :key="l.stem">
            <NuxtLink :to="l.path" class="flex gap-3 px-4 py-3 transition hover:bg-soft">
              <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft text-sm font-medium">{{ li + 1 }}</span>
              <span>
                <span class="block font-medium">{{ l.title }}</span>
                <span v-if="l.summary" class="block text-sm text-mute">{{ l.summary }}</span>
              </span>
            </NuxtLink>
          </li>
          <li v-for="(t, pi) in m.planned" :key="t" class="flex gap-3 px-4 py-3 text-mute/70">
            <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-sm">{{ m.lessons.length + pi + 1 }}</span>
            <span>{{ t }} <span class="text-xs">· เร็วๆ นี้</span></span>
          </li>
          <li v-if="!m.lessons.length && !m.planned.length" class="px-4 py-3 text-sm text-mute">ยังไม่มีบทเรียน</li>
        </ol>
      </section>
    </main>
  </CourseShell>
</template>
