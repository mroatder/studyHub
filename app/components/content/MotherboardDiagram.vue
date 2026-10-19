<script setup lang="ts">
// แผนผังเมนบอร์ด: กดชิ้นส่วนเพื่อดูหน้าที่ เส้นประที่วิ่งคือ "ถนนข้อมูล (traces)"
const parts = [
  { id: 'io', label: 'พอร์ต I/O', x: 20, y: 40, w: 46, h: 110, text: 'ช่องเชื่อมอุปกรณ์ภายนอก เช่น USB, LAN, เสียง, จอภาพ ข้อมูลจากอุปกรณ์เหล่านี้ต้องผ่านชิปเซ็ตเข้ามาหา CPU' },
  { id: 'cpu', label: 'CPU socket', x: 110, y: 60, w: 90, h: 90, text: 'ช่องเสียบ CPU ต้องเลือก CPU ให้ตรงกับรุ่นของ socket และชิปเซ็ต ไม่เช่นนั้นเสียบไม่ได้หรือใช้ไม่ได้' },
  { id: 'ram', label: 'RAM', x: 228, y: 50, w: 74, h: 110, text: 'ช่องเสียบแรม (DIMM) อยู่ใกล้ CPU เพราะต้องคุยกันเร็วที่สุด การใส่หลายแถวช่วยให้ใช้ช่องทางข้อมูลได้มากขึ้น (memory channels)' },
  { id: 'power', label: 'ไฟจาก PSU', x: 326, y: 60, w: 50, h: 44, text: 'จุดรับไฟจาก PSU เมนบอร์ดจะแจกจ่ายไฟต่อให้ CPU, RAM และชิ้นส่วนอื่น' },
  { id: 'm2', label: 'M.2 (SSD NVMe)', x: 110, y: 170, w: 90, h: 18, text: 'ช่องเสียบ SSD แบบ NVMe ต่อกับ PCIe โดยตรง จึงเร็วกว่า SSD แบบสาย SATA' },
  { id: 'chipset', label: 'Chipset', x: 228, y: 178, w: 58, h: 44, text: 'ศูนย์จัดการจราจรข้อมูลของอุปกรณ์ต่อพ่วง ตัวมันกำหนดว่าบอร์ดมี USB, PCIe ได้กี่ช่องและรองรับ overclock หรือไม่' },
  { id: 'pcie', label: 'PCIe x16 (การ์ดจอ)', x: 40, y: 240, w: 300, h: 16, text: 'ช่องเสียบการ์ดเพิ่ม โดยเฉพาะการ์ดจอ (GPU) เป็นช่องทางความเร็วสูงที่ต่อกับ CPU โดยตรง' },
] as const
type Id = (typeof parts)[number]['id']
const active = ref<Id>('cpu')
const current = computed(() => parts.find((p) => p.id === active.value)!)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <svg viewBox="0 0 400 280" class="w-full" role="img" aria-label="แผนผังเมนบอร์ดแบบย่อ">
      <rect x="8" y="8" width="384" height="264" rx="8" class="fill-paper stroke-line" stroke-width="2" />
      <!-- ถนนข้อมูล -->
      <g class="trace stroke-mute" fill="none" stroke-width="1.5">
        <path d="M200 105 H228" />
        <path d="M155 150 V170" />
        <path d="M200 130 H214 V200 H228" />
        <path d="M257 222 V240" />
        <path d="M66 95 H110" />
        <path d="M302 82 H326" />
      </g>
      <g v-for="p in parts" :key="p.id" class="cursor-pointer" @click="active = p.id">
        <template v-if="p.id === 'ram'">
          <rect v-for="i in 4" :key="i" :x="p.x + (i - 1) * 20" :y="p.y" width="14" :height="p.h" rx="2"
            :class="active === p.id ? 'fill-ink stroke-ink' : 'fill-paper stroke-ink'" stroke-width="1.5" />
        </template>
        <rect v-else :x="p.x" :y="p.y" :width="p.w" :height="p.h" rx="3"
          :class="active === p.id ? 'fill-ink stroke-ink' : 'fill-paper stroke-ink'" stroke-width="1.5" />
        <text :x="p.x + p.w / 2" :y="p.id === 'ram' ? p.y + p.h + 14 : p.y + p.h / 2 + 4" text-anchor="middle"
          font-size="10" :class="active === p.id && p.id !== 'ram' ? 'fill-paper' : 'fill-ink'">{{ p.label }}</text>
      </g>
    </svg>
    <div class="mt-3 flex flex-wrap gap-2" role="tablist">
      <button v-for="p in parts" :key="p.id" type="button" role="tab" :aria-selected="active === p.id"
        class="rounded-md border px-2.5 py-1 text-xs transition"
        :class="active === p.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="active = p.id">
        {{ p.label }}
      </button>
    </div>
    <p class="mt-3 min-h-16 leading-8 text-ink/80" aria-live="polite">
      <strong class="text-ink">{{ current.label }}:</strong> {{ current.text }}
    </p>
    <figcaption class="text-sm text-mute">แผนผังย่อเพื่อการเรียนรู้ ตำแหน่งจริงต่างกันตามรุ่น เส้นประที่เคลื่อนที่คือ traces ซึ่งเป็นเส้นทางของข้อมูล</figcaption>
  </figure>
</template>

<style scoped>
.trace path {
  stroke-dasharray: 4 4;
  animation: flow 1s linear infinite;
}
@keyframes flow {
  to {
    stroke-dashoffset: -8;
  }
}
@media (prefers-reduced-motion: reduce) {
  .trace path {
    animation: none;
  }
}
</style>
