<script setup lang="ts">
// คำถามทบทวน: คิดเองก่อน แล้วกดดูเฉลย
defineProps<{ question: string }>()
</script>

<template>
  <details class="not-prose group my-3 rounded-xl border border-line bg-soft p-4">
    <summary class="cursor-pointer list-none font-medium marker:hidden">
      <span class="mr-2 text-mute">❓</span>{{ question }}
      <span class="ml-2 text-sm text-mute group-open:hidden">(กดเพื่อดูเฉลย)</span>
    </summary>
    <div class="mt-3 border-t border-line pt-3 leading-8 text-ink/80">
      <slot />
    </div>
  </details>
</template>
