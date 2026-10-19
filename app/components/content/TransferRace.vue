<script setup lang="ts">
// แข่งส่งไฟล์: ปรับขนาดไฟล์แล้วดูเวลา "ในอุดมคติ" ของแต่ละการเชื่อมต่อ (ความเร็วจริงมักต่ำกว่านี้)
const links = [
  { name: 'USB 2.0', gbps: 0.48 },
  { name: 'Ethernet 1 Gbps', gbps: 1 },
  { name: 'USB 3.0 (5 Gbps)', gbps: 5 },
  { name: 'SATA III (6 Gbps)', gbps: 6 },
  { name: 'USB 3.2 Gen 2 / Ethernet 10G', gbps: 10 },
  { name: 'Thunderbolt 3/4', gbps: 40 },
  { name: 'NVMe (~7,000 MB/s)', gbps: 56 },
]
const sizeGB = ref(10)
const go = ref(false)
const rows = computed(() => links.map((l) => ({ ...l, sec: (sizeGB.value * 8) / l.gbps })))
const maxSec = computed(() => Math.max(...rows.value.map((r) => r.sec)))
const ms = (sec: number) => Math.max(250, (sec / maxSec.value) * 7000)

function fmt(sec: number) {
  if (sec < 1) return `${(sec * 1000).toFixed(0)} มิลลิวินาที`
  if (sec < 60) return `${sec.toFixed(1)} วินาที`
  return `${Math.floor(sec / 60)} นาที ${Math.round(sec % 60)} วินาที`
}
async function run() {
  go.value = false
  await nextTick()
  requestAnimationFrame(() => requestAnimationFrame(() => (go.value = true)))
}
watch(sizeGB, () => (go.value = false))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-3">
      <label class="text-sm font-medium" for="sz">ขนาดไฟล์: <strong>{{ sizeGB }} GB</strong></label>
      <input id="sz" v-model.number="sizeGB" type="range" min="1" max="100" class="h-2 flex-1 accent-[var(--ink)]" />
      <button type="button" class="rounded-lg border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper" @click="run">▶ ส่งไฟล์</button>
    </div>
    <ul class="mt-4 space-y-3">
      <li v-for="r in rows" :key="r.name">
        <div class="flex items-baseline justify-between gap-2 text-sm">
          <span class="font-medium">{{ r.name }}</span>
          <span class="text-mute">{{ fmt(r.sec) }}</span>
        </div>
        <div class="mt-1 h-3 overflow-hidden rounded-full bg-line">
          <div class="bar h-full rounded-full bg-ink" :style="{ width: go ? '100%' : '0%', transitionDuration: go ? `${ms(r.sec)}ms` : '0ms' }" />
        </div>
      </li>
    </ul>
    <p class="mt-4 text-sm leading-7 text-ink/80">
      เวลาคำนวณจาก <strong>ขนาดไฟล์ × 8 ÷ ความเร็ว (Gbps)</strong> เพราะ 1 ไบต์ (B) = 8 บิต (b) ความเร็วเครือข่ายและพอร์ตมักบอกเป็นบิต (Mbps/Gbps) ส่วนไฟล์บอกเป็นไบต์ (MB/GB)
    </p>
    <figcaption class="mt-1 text-sm text-mute">แท่งวิ่งด้วยเวลาย่อส่วนให้ดูได้ในไม่กี่วินาที ค่าจริงต่ำกว่าอุดมคติเพราะมีโอเวอร์เฮด และจำกัดโดยอุปกรณ์ปลายทาง (เช่น แฟลชไดรฟ์ช้า ต่อ USB เร็วก็ไม่เร็วตาม)</figcaption>
  </figure>
</template>

<style scoped>
.bar {
  transition-property: width;
  transition-timing-function: linear;
}
@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none !important;
  }
}
</style>
