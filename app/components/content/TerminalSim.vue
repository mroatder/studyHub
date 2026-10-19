<script setup lang="ts">
// เทอร์มินัลจำลอง: กดคำสั่งตัวอย่าง (หรือพิมพ์เอง) แล้วดูผลลัพธ์พร้อมคำอธิบายทีละบรรทัด
const props = defineProps<{
  title?: string
  prompt?: string
  commands: { cmd: string; out: string; note?: string }[]
}>()

// MDC attribute กลืน backslash ใช้ ⧵ แทน \ (เช่น path ของ Windows)
const bs = (s: string) => s.replaceAll('⧵', '\\')
const prompt = computed(() => bs(props.prompt ?? 'user@lab-node-01:~$'))
const cmds = computed(() => props.commands.map((c) => ({ cmd: bs(c.cmd), out: bs(c.out), note: c.note ? bs(c.note) : undefined })))
const history = ref<{ cmd: string; out: string; note?: string }[]>([])
const typing = ref('')
const busy = ref(false)
const input = ref('')
const box = ref<HTMLElement | null>(null)
const unknown = ref('')

const reduce = () => import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

async function run(c: { cmd: string; out: string; note?: string }) {
  if (busy.value) return
  busy.value = true
  unknown.value = ''
  if (reduce()) {
    typing.value = c.cmd
  } else {
    typing.value = ''
    for (const ch of c.cmd) {
      typing.value += ch
      await new Promise((r) => setTimeout(r, 18))
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  // MDC attribute ไม่เก็บ \n ได้ ใช้ ⏎ แทนการขึ้นบรรทัดใหม่ในผลลัพธ์
  history.value.push({ ...c, out: c.out.replaceAll('⏎', '\n') })
  typing.value = ''
  busy.value = false
  await nextTick()
  box.value?.scrollTo({ top: box.value.scrollHeight })
}

function submit() {
  const v = input.value.trim().replace(/\s+/g, ' ')
  const hit = cmds.value.find((c) => c.cmd === v)
  if (hit) {
    input.value = ''
    run(hit)
  } else {
    unknown.value = `ไม่มีคำสั่ง "${v}" ในตัวอย่างนี้ ลองกดปุ่มด้านล่าง`
  }
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="overflow-hidden rounded-lg border-2 border-ink bg-paper">
      <div class="flex items-center justify-between border-b border-line px-3 py-1.5 text-xs text-mute">
        <span>{{ title ?? 'Terminal (จำลอง)' }}</span>
        <button type="button" class="rounded px-2 py-0.5 transition hover:text-ink" @click="history = []">ล้าง</button>
      </div>
      <div ref="box" class="max-h-96 min-h-40 overflow-auto p-3 font-mono text-[13px] leading-6" aria-live="polite">
        <p v-if="!history.length && !typing" class="text-mute">กดคำสั่งด้านล่างเพื่อรัน</p>
        <div v-for="(h, i) in history" :key="i" class="mb-3">
          <p><span class="text-mute">{{ prompt }}</span> <span class="font-semibold">{{ h.cmd }}</span></p>
          <pre class="whitespace-pre-wrap break-words text-ink/85">{{ h.out }}</pre>
          <p v-if="h.note" class="mt-1 border-l-2 border-ink pl-2 font-sans text-xs leading-6 text-mute">{{ h.note }}</p>
        </div>
        <p v-if="typing"><span class="text-mute">{{ prompt }}</span> <span class="font-semibold">{{ typing }}</span><span class="caret">▌</span></p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="c in cmds"
        :key="c.cmd"
        type="button"
        class="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs transition hover:border-ink disabled:opacity-40"
        :disabled="busy"
        @click="run(c)"
      >{{ c.cmd }}</button>
    </div>
    <form class="mt-3 flex gap-2" @submit.prevent="submit">
      <input v-model="input" type="text" placeholder="หรือพิมพ์คำสั่งเองแล้วกด Enter" class="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-1.5 font-mono text-xs outline-none focus:border-ink" aria-label="พิมพ์คำสั่ง" />
      <button type="submit" class="rounded-md border border-ink px-3 py-1.5 text-xs transition hover:bg-ink hover:text-paper">รัน</button>
    </form>
    <p v-if="unknown" class="mt-2 text-xs text-mute">{{ unknown }}</p>
    <figcaption class="mt-3 text-sm text-mute">เป็นการจำลองเพื่อการเรียนรู้ ผลลัพธ์เป็นตัวอย่าง ค่าจริงในเครื่องของคุณ (ชื่ออินเทอร์เฟซ, IP, เวลา) จะต่างออกไป</figcaption>
  </figure>
</template>

<style scoped>
.caret {
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
}
</style>
