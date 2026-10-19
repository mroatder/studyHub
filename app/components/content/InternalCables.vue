<script setup lang="ts">
// สายไฟภายในเคส: กดสายแต่ละเส้นเพื่อดูว่าจาก PSU ไปเลี้ยงอะไร แรงดันเท่าไร
const cables = [
  { id: 'atx', name: '24-pin ATX', to: 'เมนบอร์ด', volts: '+3.3V · +5V · +12V', text: 'สายหลักที่ใหญ่ที่สุด จ่ายไฟหลายระดับให้วงจรบนบอร์ด ช่อง PCIe และชิ้นส่วนที่ฝังอยู่บนบอร์ด' },
  { id: 'eps', name: '8-pin EPS (4+4)', to: 'CPU', volts: '+12V', text: 'สายเฉพาะสำหรับ CPU เสียบใกล้ช่อง socket CPU ต้องการกระแสสูงและนิ่งมากตอนทำงานหนัก จึงมีสายแยกตรงจาก PSU ไม่ผ่านเมนบอร์ด' },
  { id: 'pcie', name: '6+2 pin PCIe', to: 'การ์ดจอแยก', volts: '+12V', text: 'การ์ดจอแรงๆ กินไฟเกินกว่าที่ช่อง PCIe บนบอร์ดจ่ายให้ได้ (ราว 75W ตามมาตรฐาน) จึงต้องต่อสายเสริมจาก PSU ตรงๆ' },
  { id: 'sata', name: 'SATA power (15-pin)', to: 'HDD / SSD แบบ SATA', volts: '+3.3V · +5V · +12V', text: 'หัวแบนกว้าง จ่ายไฟให้ดิสก์แบบ SATA ส่วนข้อมูลใช้สาย SATA data อีกเส้นต่างหาก' },
] as const
type Id = (typeof cables)[number]['id']
const active = ref<Id>('atx')
const cur = computed(() => cables.find((c) => c.id === active.value)!)
const idx = (id: Id) => cables.findIndex((c) => c.id === id)
const y = (i: number) => 40 + i * 52
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <svg viewBox="0 0 420 240" class="w-full" role="img" aria-label="สายไฟจาก PSU ไปยังชิ้นส่วนต่างๆ">
      <rect x="8" y="14" width="96" height="212" rx="6" class="fill-ink" />
      <text x="56" y="124" text-anchor="middle" font-size="13" class="fill-paper" font-weight="600">PSU</text>
      <g v-for="c in cables" :key="c.id" class="cursor-pointer" @click="active = c.id">
        <path :d="`M104 ${y(idx(c.id))} H300`" fill="none" :class="[active === c.id ? 'stroke-ink wire' : 'stroke-line']" :stroke-width="active === c.id ? 3 : 2" />
        <text x="200" :y="y(idx(c.id)) - 6" text-anchor="middle" font-size="10" :class="active === c.id ? 'fill-ink' : 'fill-mute'">{{ c.name }}</text>
        <rect x="300" :y="y(idx(c.id)) - 18" width="108" height="36" rx="4" :class="active === c.id ? 'fill-ink stroke-ink' : 'fill-paper stroke-line'" stroke-width="1.5" />
        <text x="354" :y="y(idx(c.id)) + 4" text-anchor="middle" font-size="11" :class="active === c.id ? 'fill-paper' : 'fill-ink'">{{ c.to }}</text>
      </g>
    </svg>
    <div class="mt-3 flex flex-wrap gap-2" role="tablist">
      <button v-for="c in cables" :key="c.id" type="button" role="tab" :aria-selected="active === c.id" class="rounded-md border px-2.5 py-1 text-xs transition" :class="active === c.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="active = c.id">{{ c.name }}</button>
    </div>
    <p class="mt-3 min-h-20 leading-8 text-ink/80" aria-live="polite">
      <strong class="text-ink">{{ cur.name }} → {{ cur.to }}</strong> <span class="font-mono text-sm text-mute">({{ cur.volts }})</span><br />{{ cur.text }}
    </p>
    <figcaption class="text-sm text-mute">เส้นประที่เคลื่อนที่คือไฟที่ไหลจาก PSU ไปยังชิ้นส่วน กำลังไฟที่ระบุเป็นค่ามาตรฐานโดยประมาณ</figcaption>
  </figure>
</template>

<style scoped>
.wire {
  stroke-dasharray: 8 5;
  animation: run 0.8s linear infinite;
}
@keyframes run {
  to {
    stroke-dashoffset: -13;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wire {
    animation: none;
  }
}
</style>
