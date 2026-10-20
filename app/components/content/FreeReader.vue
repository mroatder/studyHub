<script setup lang="ts">
// อ่านผล free -h: used / buff/cache / free / available และจำลองว่าแอปขอ RAM เพิ่มแล้วเกิดอะไรขึ้น (ตัวเลขสมมติ)
const total = 7.7
const used = 5.2
const free = 0.3
const cache = 2.2
const available = 2.1 // ส่วนของ cache ที่เคอร์เนลคืนให้ได้ ไม่ใช่ทั้งหมด
const swapFree = 0.2

const need = ref(0)
const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

const fromFree = computed(() => Math.min(need.value, free))
const fromCache = computed(() => Math.min(need.value - fromFree.value, available - free))
const toSwap = computed(() => Math.max(0, need.value - fromFree.value - fromCache.value))
const oom = computed(() => toSwap.value > swapFree)

const pct = (n: number) => `${(n / total) * 100}%`
const bar = computed(() => {
  const newUsed = used + need.value
  const newCache = cache - fromCache.value
  const newFree = free - fromFree.value
  return [
    { label: 'used', v: Math.min(newUsed, total), cls: 'bg-ink text-paper' },
    { label: 'buff/cache', v: Math.max(0, newCache), cls: 'bg-mute/40' },
    { label: 'free', v: Math.max(0, newFree), cls: 'bg-paper border-l border-line' },
  ]
})
const barLabel = computed(() => `หน่วยความจำ ${bar.value.map((b) => `${b.label} ${fmt(b.v)} GB`).join(', ')}`)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="break-all rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-6 sm:text-sm">
      $ free -h<br />
      <span class="whitespace-pre">{{ '              total   used   free  buff/cache  available' }}</span><br />
      <span class="whitespace-pre">{{ 'Mem:          7.7Gi  5.2Gi  310Mi      2.2Gi      2.1Gi' }}</span>
    </p>

    <div class="mt-4 flex h-12 overflow-hidden rounded-lg border border-line" role="img" :aria-label="barLabel">
      <div v-for="b in bar" :key="b.label" class="flex items-center justify-center overflow-hidden text-[11px] transition-all duration-300 motion-reduce:transition-none" :class="b.cls" :style="{ width: pct(b.v) }">
        <span v-if="b.v / total > 0.12" class="px-1">{{ b.label }} {{ fmt(b.v) }}</span>
      </div>
    </div>
    <p class="mt-1 text-xs text-mute">ทั้งแถบ = RAM {{ total }} GB · ส่วน <strong>available</strong> ≈ free + cache ที่คืนได้ = {{ available }} GB</p>

    <label class="mt-4 block text-sm">
      สมมติมีแอปขอ RAM เพิ่ม: <strong>{{ fmt(need) }} GB</strong>
      <input v-model.number="need" type="range" min="0" max="4" step="0.1" class="mt-2 w-full accent-current" />
    </label>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <p v-if="need === 0">เลื่อนแถบเพื่อดูว่าเคอร์เนลหาหน่วยความจำให้แอปจากไหน สังเกตว่า <strong>free มีแค่ 0.3 GB</strong> แต่เครื่องยังไม่ได้ติดขัด เพราะ cache คืนได้</p>
      <template v-else>
        <p>จัดสรรจาก free: {{ fmt(fromFree) }} GB</p>
        <p v-if="fromCache > 0">เคอร์เนลทิ้งแคชไฟล์ (buff/cache) คืนให้: {{ fmt(fromCache) }} GB <span class="text-mute">(ไม่เกิน available)</span></p>
        <p v-if="toSwap > 0"><strong>เกิน available แล้ว:</strong> ต้องเขียนข้อมูลลง swap {{ fmt(toSwap) }} GB (ช้ากว่า RAM มาก) · swap ว่างอยู่แค่ {{ swapFree }} GB</p>
        <p v-if="oom" class="mt-1 font-semibold">swap ไม่พอ → เสี่ยงที่ OOM killer จะสังหารโปรเซสเพื่อกู้หน่วยความจำ</p>
        <p v-else-if="toSwap === 0" class="mt-1">ยังไม่ต้องใช้ swap เครื่องไม่ช้า</p>
      </template>
    </div>
    <figcaption class="mt-3 text-sm text-mute">ตัวเลขเป็นตัวอย่างสมมติ จำลองในหน้าเว็บ ไม่ได้อ่านหน่วยความจำจริง</figcaption>
  </figure>
</template>
