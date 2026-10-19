<script setup lang="ts">
// กดเลือกตำแหน่งปัจจุบันและปลายทางในต้นไม้ แล้วดู absolute path / relative path พร้อมขั้นตอนที่ .. และชื่อโฟลเดอร์ทำงาน
type Os = 'linux' | 'windows'
const os = ref<Os>('linux')
const mode = ref<'cwd' | 'target'>('cwd')

const trees: Record<Os, string[][]> = {
  linux: [
    [], ['home'], ['home', 'alex'], ['home', 'alex', 'Desktop'], ['home', 'alex', 'Documents'], ['home', 'alex', 'Documents', 'work'],
    ['home', 'alex', 'Downloads'], ['home', 'sam'], ['var'], ['var', 'log'], ['var', 'log', 'nginx'], ['etc'],
  ],
  windows: [
    [], ['Users'], ['Users', 'Alex'], ['Users', 'Alex', 'Desktop'], ['Users', 'Alex', 'Documents'], ['Users', 'Alex', 'Documents', 'work'],
    ['Users', 'Alex', 'Downloads'], ['Users', 'Sam'], ['Windows'], ['Windows', 'System32'], ['Windows', 'Logs'], ['Program Files'],
  ],
}
const tree = computed(() => trees[os.value])
const sep = computed(() => (os.value === 'linux' ? '/' : '\\'))
const rootLabel = computed(() => (os.value === 'linux' ? '/' : 'C:\\'))

const cwd = ref<string[]>(['home', 'alex', 'Documents'])
const target = ref<string[]>(['home', 'alex', 'Downloads'])

function setOs(o: Os) {
  os.value = o
  cwd.value = o === 'linux' ? ['home', 'alex', 'Documents'] : ['Users', 'Alex', 'Documents']
  target.value = o === 'linux' ? ['home', 'alex', 'Downloads'] : ['Users', 'Alex', 'Downloads']
}
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])
const abs = (p: string[]) => rootLabel.value + p.join(sep.value)
const pick = (p: string[]) => (mode.value === 'cwd' ? (cwd.value = p) : (target.value = p))

const calc = computed(() => {
  const a = cwd.value
  const b = target.value
  let k = 0
  while (k < a.length && k < b.length && a[k] === b[k]) k++
  const ups = a.length - k
  const downs = b.slice(k)
  const parts = [...Array(ups).fill('..'), ...downs]
  const rel = parts.length ? parts.join(sep.value) : '.'
  const steps: string[] = []
  if (ups > 0) steps.push(`ถอยขึ้น ${ups} ชั้น (${Array(ups).fill('..').join(sep.value)}) ไปยัง ${abs(a.slice(0, k)) || rootLabel.value}`)
  downs.forEach((d, i) => steps.push(`เข้าโฟลเดอร์ ${d}${i === downs.length - 1 ? ' (ถึงปลายทาง)' : ''}`))
  if (!steps.length) steps.push('อยู่ที่ปลายทางอยู่แล้ว ใช้ . แทนโฟลเดอร์ปัจจุบัน')
  return { rel, steps, ups }
})
const cmd = computed(() => `cd ${calc.value.rel}`)
const label = (p: string[]) => (p.length ? p[p.length - 1] : rootLabel.value)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2">
      <button v-for="o in (['linux', 'windows'] as const)" :key="o" type="button" class="rounded-md border px-3 py-1.5 text-sm transition" :class="os === o ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="os === o" @click="setOs(o)">
        {{ o === 'linux' ? 'Linux (Bash)' : 'Windows (PowerShell)' }}
      </button>
      <span class="text-sm text-mute">สลับดูตัวคั่น path ที่ต่างกัน</span>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-mute">กดโฟลเดอร์เพื่อกำหนด:</span>
      <button type="button" class="rounded-md border px-3 py-1.5 transition" :class="mode === 'cwd' ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="mode === 'cwd'" @click="mode = 'cwd'">① ตำแหน่งปัจจุบัน</button>
      <button type="button" class="rounded-md border px-3 py-1.5 transition" :class="mode === 'target' ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="mode === 'target'" @click="mode = 'target'">② ปลายทาง</button>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3 font-mono text-sm" role="group" aria-label="ต้นไม้ไดเรกทอรี">
        <button v-for="p in tree" :key="p.join('/')" type="button" class="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left transition hover:bg-soft" :style="{ paddingLeft: `${p.length * 1.1 + 0.25}rem` }" :aria-label="`${abs(p)}${same(p, cwd) ? ' ตำแหน่งปัจจุบัน' : ''}${same(p, target) ? ' ปลายทาง' : ''}`" @click="pick(p)">
          <span :class="same(p, cwd) || same(p, target) ? 'font-semibold' : ''">{{ label(p) }}</span>
          <span v-if="same(p, cwd)" class="rounded border border-ink bg-ink px-1.5 font-sans text-[11px] text-paper">① ที่นี่</span>
          <span v-if="same(p, target)" class="rounded border border-ink px-1.5 font-sans text-[11px]">② ปลายทาง</span>
        </button>
      </div>

      <div class="space-y-3 text-sm" aria-live="polite">
        <div class="rounded-lg border border-line bg-paper p-3">
          <p class="text-xs text-mute">absolute path ของปลายทาง (ใช้ได้จากทุกที่)</p>
          <p class="mt-1 break-all font-mono">{{ abs(target) }}</p>
        </div>
        <div class="rounded-lg border border-line bg-paper p-3">
          <p class="text-xs text-mute">relative path จากตำแหน่งปัจจุบัน <span class="font-mono">{{ abs(cwd) }}</span></p>
          <p class="mt-1 break-all font-mono font-semibold">{{ calc.rel }}</p>
          <p class="mt-2 font-mono text-xs text-mute">{{ os === 'linux' ? 'alex@pc' : 'PS' }} {{ abs(cwd) }}{{ os === 'linux' ? '$' : '>' }} {{ cmd }}</p>
        </div>
        <ol class="list-decimal space-y-1 pl-5 leading-7 text-ink/80">
          <li v-for="(s, i) in calc.steps" :key="i">{{ s }}</li>
        </ol>
      </div>
    </div>
    <figcaption class="mt-3 text-sm text-mute">relative path ขึ้นอยู่กับว่าตอนนี้ยืนอยู่ที่ไหน เปลี่ยนตำแหน่งปัจจุบันแล้ว path เดียวกันจะเปลี่ยนไป แต่ absolute path ของปลายทางเหมือนเดิม</figcaption>
  </figure>
</template>
