<script setup lang="ts">
// ลองเขียนข้อความลงไฟล์ด้วย > (ทับ) และ >> (ต่อท้าย) แล้วดูว่าเนื้อหาเดิมหายหรืออยู่
const base = ['Service started', 'Worker thread active']
const lines = ref<string[]>([...base])
const lost = ref<string[]>([])
const exists = ref(true)
const last = ref<'' | 'over' | 'app'>('')
const text = ref('Status: OK')
const os = ref<'sh' | 'ps'>('sh')

const t = computed(() => text.value.trim() || '(ว่าง)')
const cmd = (mode: 'over' | 'app') => {
  const op = mode === 'over' ? '>' : '>>'
  return os.value === 'sh' ? `echo "${t.value}" ${op} server.log` : `"${t.value}" ${op} server.log`
}

function write(mode: 'over' | 'app') {
  if (mode === 'over') {
    lost.value = exists.value ? [...lines.value] : []
    lines.value = [t.value]
  } else {
    lost.value = []
    lines.value = [...lines.value, t.value]
  }
  exists.value = true
  last.value = mode
}
function reset(noFile = false) {
  lines.value = noFile ? [] : [...base]
  exists.value = !noFile
  lost.value = []
  last.value = ''
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="o in (['sh', 'ps'] as const)" :key="o" type="button" class="rounded-md border px-3 py-1.5 transition" :class="os === o ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="os === o" @click="os = o">
        {{ o === 'sh' ? 'Linux (Bash)' : 'Windows (PowerShell)' }}
      </button>
      <button type="button" class="ml-auto rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="reset(false)">เริ่มใหม่ (มีไฟล์ 2 บรรทัด)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="reset(true)">เริ่มจากยังไม่มีไฟล์</button>
    </div>

    <label class="mt-4 block text-sm text-mute" for="redirect-text">ข้อความที่จะเขียน</label>
    <input id="redirect-text" v-model="text" type="text" maxlength="40" class="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 font-mono text-sm outline-none focus:border-ink" />

    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <button type="button" class="rounded-lg border border-line bg-paper p-3 text-left transition hover:border-ink" @click="write('over')">
        <span class="block text-xs text-mute">ทับ (overwrite)</span>
        <span class="mt-1 block break-all font-mono text-sm">{{ cmd('over') }}</span>
      </button>
      <button type="button" class="rounded-lg border border-line bg-paper p-3 text-left transition hover:border-ink" @click="write('app')">
        <span class="block text-xs text-mute">ต่อท้าย (append)</span>
        <span class="mt-1 block break-all font-mono text-sm">{{ cmd('app') }}</span>
      </button>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2" aria-live="polite">
      <div class="rounded-lg border-2 border-ink bg-paper p-3">
        <p class="text-xs text-mute">server.log</p>
        <p v-if="!exists" class="mt-2 text-sm text-mute">ยังไม่มีไฟล์นี้ (ทั้ง &gt; และ &gt;&gt; จะสร้างให้เอง)</p>
        <ol v-else class="mt-2 font-mono text-sm leading-7">
          <li v-for="(l, i) in lines" :key="i" class="flex gap-2 rounded px-1" :class="i === lines.length - 1 && last ? 'bg-ink text-paper' : ''">
            <span class="w-5 select-none text-right opacity-60">{{ i + 1 }}</span><span class="break-all">{{ l }}</span>
          </li>
        </ol>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p v-if="last === 'over'" class="font-semibold">ไฟล์ถูกตัดให้ว่างก่อนเขียน</p>
        <p v-else-if="last === 'app'" class="font-semibold">เนื้อหาเดิมอยู่ครบ ข้อความใหม่ต่อท้ายบรรทัดสุดท้าย</p>
        <p v-else class="text-mute">กดปุ่มด้านบนเพื่อลอง</p>
        <div v-if="lost.length" class="mt-3 rounded border border-dashed border-ink p-2">
          <p class="text-xs text-mute">เนื้อหาที่หายไป (ไม่มีถังขยะ ไม่มี undo)</p>
          <p v-for="(l, i) in lost" :key="i" class="font-mono text-xs line-through opacity-70">{{ l }}</p>
        </div>
        <p class="mt-3 text-xs leading-6 text-mute">ตัวอักษรเดียวต่างกัน แต่ผลต่างกันมาก: ถ้าตั้งใจเก็บ log สะสม แล้วพิมพ์ &gt; ตัวเดียว ข้อมูลเก่าหายทันที</p>
      </div>
    </div>
    <figcaption class="mt-3 text-sm text-mute">จำลองในหน้าเว็บ ไม่ได้แตะไฟล์จริงในเครื่องของคุณ</figcaption>
  </figure>
</template>
