<script setup lang="ts">
// PSU แปลงไฟบ้าน (AC) เป็นไฟตรง (DC) แล้วแบ่งเป็นหลายระดับแรงดัน สลับดู PSU ดี vs คุณภาพต่ำ
const good = ref(true)

const W = 140
function wave(fn: (x: number) => number) {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 2) pts.push(`${x === 0 ? 'M' : 'L'}${x} ${fn(x).toFixed(1)}`)
  return pts.join(' ')
}
const ac = wave((x) => 30 + 22 * Math.sin((x / W) * Math.PI * 6))
// ripple แบบกำหนดค่าตายตัว เพื่อให้ผลตรงกันทุกครั้ง
const dc = computed(() => wave((x) => 30 + (good.value ? 0 : 7 * Math.sin(x * 0.9) + 4 * Math.sin(x * 2.3 + 1))))

const rails = [
  { v: '+12V', to: 'CPU · การ์ดจอ · พัดลม' },
  { v: '+5V', to: 'USB · ไดรฟ์ SATA' },
  { v: '+3.3V', to: 'ช่อง PCIe/M.2 · วงจรลอจิก' },
]
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <div class="rounded-lg border border-line bg-paper p-3 text-center">
        <p class="text-sm font-semibold">ไฟบ้าน (AC)</p>
        <svg viewBox="0 0 140 60" class="mt-1 w-full"><path :d="ac" fill="none" class="stroke-ink" stroke-width="2" /></svg>
        <p class="text-xs text-mute">กระแสสลับ แรงดันสูง</p>
      </div>
      <div class="flow-x hidden h-0.5 w-10 sm:block" />
      <div class="rounded-lg border-2 border-ink bg-ink p-3 text-center text-paper">
        <p class="text-sm font-semibold">PSU</p>
        <p class="text-xs opacity-80">แปลง + ปรับแรงดัน</p>
      </div>
      <div class="flow-x hidden h-0.5 w-10 sm:block" />
      <div class="rounded-lg border border-line bg-paper p-3 text-center">
        <p class="text-sm font-semibold">ไฟตรง (DC)</p>
        <svg viewBox="0 0 140 60" class="mt-1 w-full"><path :d="dc" fill="none" class="stroke-ink" stroke-width="2" /></svg>
        <p class="text-xs text-mute">{{ good ? 'นิ่ง เรียบ' : 'กระเพื่อม (ripple)' }}</p>
      </div>
    </div>

    <ul class="mt-4 grid gap-2 sm:grid-cols-3">
      <li v-for="r in rails" :key="r.v" class="rounded-lg border border-line bg-paper p-3">
        <p class="font-mono text-base font-semibold">{{ r.v }}</p>
        <p class="text-sm text-mute">{{ r.to }}</p>
      </li>
    </ul>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" class="rounded-md border px-3 py-1.5 text-sm transition" :class="good ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="good = true">PSU คุณภาพดี</button>
      <button type="button" class="rounded-md border px-3 py-1.5 text-sm transition" :class="!good ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="good = false">PSU คุณภาพต่ำ</button>
    </div>
    <p class="mt-3 leading-8 text-ink/80" aria-live="polite">
      {{ good ? 'ไฟตรงที่นิ่งทำให้ชิ้นส่วนทำงานเสถียรและเสียหายยาก' : 'ไฟกระเพื่อมทำให้เครื่องรีบูตเอง ค้าง และชิ้นส่วนเสื่อมเร็ว นี่คือเหตุผลที่ไม่ควรประหยัดกับ PSU' }}
    </p>
    <figcaption class="mt-2 text-sm text-mute">ระดับแรงดันบนเมนบอร์ดบางจุด (เช่น ของ CPU และ RAM) ถูกแปลงลงต่ออีกชั้นโดยวงจรบนบอร์ดเอง ภาพนี้แสดงเฉพาะสาย rail หลักของ PSU</figcaption>
  </figure>
</template>

<style scoped>
.flow-x {
  background-image: linear-gradient(90deg, var(--ink) 50%, transparent 50%);
  background-size: 8px 100%;
  animation: dash 0.8s linear infinite;
}
@keyframes dash {
  to {
    background-position: 8px 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .flow-x {
    animation: none;
  }
}
</style>
