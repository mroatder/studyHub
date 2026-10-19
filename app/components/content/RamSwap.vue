<script setup lang="ts">
// ลองเปิดโปรแกรมเองจนเห็นว่า RAM เต็มแล้วระบบย้ายข้อมูลลงดิสก์ (swap) และเครื่องเริ่มอืด (thrashing) อย่างไร
interface App {
  id: number
  name: string
  size: number
  where: 'ram' | 'disk'
  used: number
}
const RAM_SLOTS = 8
const catalog = [
  { name: 'เบราว์เซอร์', size: 3 },
  { name: 'Word', size: 2 },
  { name: 'เกม', size: 4 },
  { name: 'วิดีโอ', size: 3 },
]
const apps = ref<App[]>([])
const tick = ref(0)
const recent = ref<number[]>([]) // จำนวนการ swap ในแต่ละการกระทำล่าสุด
const lastSwap = ref(0)
let nextId = 1

const inRam = computed(() => apps.value.filter((a) => a.where === 'ram'))
const onDisk = computed(() => apps.value.filter((a) => a.where === 'disk'))
const ramUsed = computed(() => inRam.value.reduce((n, a) => n + a.size, 0))

function makeRoom(need: number, keep?: App) {
  let swaps = 0
  while (RAM_SLOTS - ramUsed.value < need) {
    const victim = inRam.value.filter((a) => a !== keep).sort((a, b) => a.used - b.used)[0]
    if (!victim) break
    victim.where = 'disk'
    swaps++
  }
  return swaps
}
function finish(swaps: number) {
  recent.value = [...recent.value, swaps].slice(-4)
  lastSwap.value = swaps
  tick.value++
}
function open(c: { name: string; size: number }) {
  const app: App = { id: nextId++, name: c.name, size: c.size, where: 'ram', used: ++tick.value }
  const swaps = makeRoom(c.size)
  apps.value.push(app)
  finish(swaps)
}
function use(a: App) {
  a.used = ++tick.value
  if (a.where === 'ram') return finish(0)
  const swaps = makeRoom(a.size, a)
  a.where = 'ram'
  finish(swaps)
}
function close(a: App) {
  apps.value = apps.value.filter((x) => x !== a)
  finish(0)
}
function reset() {
  apps.value = []
  recent.value = []
  lastSwap.value = 0
}

const load = computed(() => recent.value.reduce((n, v) => n + v, 0))
const status = computed(() => {
  if (load.value === 0) return { t: 'ลื่น', d: 'ทุกโปรแกรมอยู่ใน RAM CPU หยิบข้อมูลได้ทันที' }
  if (load.value <= 2) return { t: 'เริ่มช้า', d: 'ระบบต้องย้ายข้อมูลลงดิสก์เพื่อเอาที่ว่าง ดิสก์ช้ากว่า RAM มาก' }
  return { t: 'อืดมาก (thrashing)', d: 'สลับข้อมูลระหว่าง RAM กับดิสก์ถี่จนแทบไม่ได้ทำงานจริง ลองปิดโปรแกรมบางตัว' }
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="mb-2 text-sm font-medium">1) กดเปิดโปรแกรม (RAM มี {{ RAM_SLOTS }} ช่อง)</p>
    <div class="flex flex-wrap gap-2">
      <button v-for="c in catalog" :key="c.name" type="button" class="rounded-md border border-line px-3 py-1.5 text-sm transition hover:border-ink" @click="open(c)">
        + {{ c.name }} <span class="text-mute">({{ c.size }} ช่อง)</span>
      </button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-sm text-mute transition hover:border-ink" @click="reset">↺ เริ่มใหม่</button>
    </div>

    <p class="mb-1 mt-5 text-sm font-medium">RAM <span class="text-mute">({{ ramUsed }}/{{ RAM_SLOTS }} ช่อง)</span></p>
    <div class="grid h-12 grid-cols-8 gap-1 rounded-lg border border-line bg-paper p-1">
      <button v-for="a in inRam" :key="a.id" type="button" class="truncate rounded bg-ink px-1 text-xs text-paper" :style="{ gridColumn: `span ${a.size}` }" :title="`${a.name}: กดเพื่อวางใช้งาน/ปิด`" @click="use(a)">
        {{ a.name }}
      </button>
    </div>

    <p class="mb-1 mt-4 flex items-center gap-2 text-sm font-medium">
      ดิสก์ (พื้นที่ swap)
      <span :key="tick" class="inline-block h-2.5 w-2.5 rounded-full border border-ink" :class="lastSwap > 0 ? 'led bg-ink' : ''" />
    </p>
    <div class="flex min-h-12 flex-wrap gap-1 rounded-lg border border-dashed border-line bg-paper p-1">
      <button v-for="a in onDisk" :key="a.id" type="button" class="rounded border border-ink px-2 py-1 text-xs" title="กดเพื่อเรียกกลับเข้า RAM" @click="use(a)">
        {{ a.name }} ↩
      </button>
      <span v-if="!onDisk.length" class="px-2 py-1 text-xs text-mute">ยังไม่มีข้อมูลถูกย้ายมาพัก</span>
    </div>

    <p class="mt-4 leading-8 text-ink/80" aria-live="polite">
      <span class="mr-2 rounded bg-ink px-2 py-0.5 text-xs font-semibold text-paper">เครื่อง: {{ status.t }}</span>{{ status.d }}
    </p>
    <figcaption class="mt-2 text-sm text-mute">ลองเปิดเบราว์เซอร์ เกม และวิดีโอ จนเต็ม แล้วกดชื่อโปรแกรมที่อยู่บนดิสก์เพื่อสลับกลับมา จะเห็นระบบต้องไล่ย้ายตัวอื่นออกไปแทน</figcaption>
  </figure>
</template>

<style scoped>
.led {
  animation: blink 0.5s ease-out 2;
}
@keyframes blink {
  50% {
    opacity: 0.15;
  }
}
@media (prefers-reduced-motion: reduce) {
  .led {
    animation: none;
  }
}
</style>
