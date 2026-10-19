<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <header class="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-[100rem] items-center justify-between px-4">
        <div class="flex items-center gap-5">
          <NuxtLink to="/" class="text-base font-semibold tracking-tight">Stackup</NuxtLink>
          <NuxtLink to="/roadmap" class="text-sm text-mute transition hover:text-ink" active-class="!text-ink font-medium">แผนที่การเรียน</NuxtLink>
        </div>
        <ClientOnly>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-md text-mute transition hover:bg-soft hover:text-ink"
            :aria-label="isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'"
            @click="toggleTheme"
          >
            <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
          <template #fallback><span class="h-9 w-9" /></template>
        </ClientOnly>
      </div>
    </header>
    <slot />
  </div>
</template>
