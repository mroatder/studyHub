<script setup lang="ts">
// เปรียบเทียบความเร็วของหน่วยความจำแต่ละชั้น พร้อมมุมมอง "ถ้า 1 นาโนวินาที = 1 วินาที"
const rows = [
  { name: 'แคช L1', size: 'หลักสิบ KB', ns: 1, real: '~1 ns' },
  { name: 'แคช L2', size: 'หลักร้อย KB – MB', ns: 4, real: '~4 ns' },
  { name: 'แคช L3', size: 'หลาย MB – สิบ MB', ns: 15, real: '~15 ns' },
  { name: 'RAM', size: 'หลาย GB', ns: 80, real: '~80 ns' },
  { name: 'SSD', size: 'หลายร้อย GB – TB', ns: 80_000, real: '~80 µs' },
  { name: 'HDD', size: 'หลาย TB', ns: 8_000_000, real: '~8 ms' },
]
const scaled = ref(true)
const shown = ref(false)
onMounted(() => requestAnimationFrame(() => (shown.value = true)))

function human(sec: number) {
  if (sec < 60) return `${Math.round(sec)} วินาที`
  if (sec < 3600) return `${(sec / 60).toFixed(1).replace('.0', '')} นาที`
  if (sec < 86400) return `${Math.round(sec / 3600)} ชั่วโมง`
  if (sec < 86400 * 30) return `${Math.round(sec / 86400)} วัน`
  return `${Math.round(sec / (86400 * 30))} เดือน`
}
// ใช้สเกล log เพราะค่าต่างกันหลายล้านเท่า
const width = (ns: number) => `${shown.value ? 6 + (Math.log10(ns) / 7) * 94 : 0}%`
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-medium">เวลาที่ใช้หยิบข้อมูลหนึ่งครั้ง</p>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-sm transition hover:border-ink" @click="scaled = !scaled">
        {{ scaled ? 'ดูค่าจริง (ns / µs / ms)' : 'ดูแบบ "1 ns = 1 วินาที"' }}
      </button>
    </div>
    <ul class="space-y-3">
      <li v-for="r in rows" :key="r.name" class="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[7rem_1fr]">
        <div>
          <p class="text-sm font-semibold">{{ r.name }}</p>
          <p class="text-xs text-mute">{{ r.size }}</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-5 rounded-sm bg-ink transition-[width] duration-1000 ease-out motion-reduce:transition-none" :style="{ width: width(r.ns) }" />
          <span class="whitespace-nowrap text-sm font-medium">{{ scaled ? human(r.ns) : r.real }}</span>
        </div>
      </li>
    </ul>
    <figcaption class="mt-4 text-sm leading-7 text-mute">
      แท่งใช้สเกลแบบ log (แต่ละช่วงยาวขึ้นเท่าตัวคูณ) เพราะค่าต่างกันหลายล้านเท่า ถ้าตีให้ L1 ใช้ 1 วินาที RAM จะใช้ราวหนึ่งนาทีกว่า SSD ราวหนึ่งวัน และ HDD ราวสามเดือน นี่คือเหตุผลที่ระบบพยายามเก็บข้อมูลไว้ชั้นบนให้มากที่สุด ตัวเลขเป็นค่าประมาณเพื่อเปรียบเทียบเชิงขนาด
    </figcaption>
  </figure>
</template>
