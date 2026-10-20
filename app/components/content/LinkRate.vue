<script setup lang="ts">
// อัตราดิบ (line rate) → หักโอเวอร์เฮดการเข้ารหัสสัญญาณ → ความเร็วข้อมูลสูงสุดในอุดมคติ → เวลาโอนไฟล์
interface Link { name: string; raw: number; unit: string; enc: string; eff: number; note: string }
const links: Link[] = [
  { name: 'USB 2.0', raw: 0.48, unit: 'Gbps', enc: 'NRZI + bit stuffing', eff: 1, note: 'ในทางปฏิบัติได้ราว 35–40 MB/s เพราะโปรโตคอลแบบโพลล์ (ค่าประมาณ)' },
  { name: 'SATA III', raw: 6, unit: 'Gbps', enc: '8b/10b', eff: 8 / 10, note: '10 บิตบนสายต่อ 8 บิตข้อมูล' },
  { name: 'USB 3.2 Gen 1 (3.0)', raw: 5, unit: 'Gbps', enc: '8b/10b', eff: 8 / 10, note: 'พอร์ตสีฟ้าเดิม' },
  { name: 'USB 3.2 Gen 2', raw: 10, unit: 'Gbps', enc: '128b/132b', eff: 128 / 132, note: 'ใช้การเข้ารหัสที่เปลืองน้อยกว่า' },
  { name: 'USB 3.2 Gen 2x2', raw: 20, unit: 'Gbps', enc: '128b/132b', eff: 128 / 132, note: 'สองเลน 10 Gbps รวมกัน' },
  { name: 'Gigabit Ethernet', raw: 1, unit: 'Gbps', enc: 'PAM-5 4 คู่สาย', eff: 1460 / 1538, note: 'ตัวเลขนี้หัก overhead เฟรม (ไม่ใช่การเข้ารหัสสัญญาณ) ราว 95% เมื่อรวม IP+TCP' },
  { name: 'PCIe 3.0 x4 (NVMe)', raw: 32, unit: 'Gbps', enc: '128b/130b', eff: 128 / 130, note: '8 GT/s ต่อเลน × 4 เลน' },
  { name: 'PCIe 4.0 x4 (NVMe)', raw: 64, unit: 'Gbps', enc: '128b/130b', eff: 128 / 130, note: '16 GT/s ต่อเลน × 4 เลน' },
  { name: 'PCIe 5.0 x4 (NVMe)', raw: 128, unit: 'Gbps', enc: '128b/130b', eff: 128 / 130, note: '32 GT/s ต่อเลน × 4 เลน' },
  { name: 'Thunderbolt 3/4', raw: 40, unit: 'Gbps', enc: 'ผสมหลายโปรโตคอล', eff: 1, note: 'ช่องทางแบ่งปันกับภาพ/ข้อมูล ข้อมูล PCIe ได้ราว 22–32 Gbps (ค่าประมาณ)' },
]
const sel = ref(1)
const sizeGB = ref(20)
const cur = computed(() => links[sel.value]!)
const effGbps = computed(() => cur.value.raw * cur.value.eff)
const mbps = computed(() => (effGbps.value * 1000) / 8)
const seconds = computed(() => (sizeGB.value * 8) / effGbps.value)
const fmt = (s: number) => (s < 90 ? `${s.toFixed(1)} วินาที` : `${(s / 60).toFixed(1)} นาที`)
const max = computed(() => Math.max(...links.map(l => l.raw * l.eff)))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-1.5">
      <button
        v-for="(l, i) in links" :key="l.name" type="button"
        class="grid grid-cols-[8.5rem_1fr_4.5rem] items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition sm:grid-cols-[11rem_1fr_5.5rem] sm:text-sm"
        :class="i === sel ? 'border-ink bg-paper' : 'border-line hover:border-ink'" :aria-pressed="i === sel" @click="sel = i"
      >
        <span class="font-medium leading-tight">{{ l.name }}</span>
        <span class="relative h-3 overflow-hidden rounded bg-line" aria-hidden="true">
          <span class="absolute inset-y-0 left-0 rounded bg-ink" :style="{ width: Math.max((l.raw * l.eff / max) * 100, 1.5) + '%' }" />
        </span>
        <span class="text-right font-mono">{{ (l.raw * l.eff * 1000 / 8).toLocaleString(undefined, { maximumFractionDigits: 0 }) }} MB/s</span>
      </button>
    </div>
    <p class="mt-1 text-xs text-mute">แถบเป็นสเกลเชิงเส้น: ลิงก์ช้าเห็นเป็นเส้นเล็ก</p>

    <div class="mt-4 rounded-lg border border-line bg-paper p-3 text-sm" aria-live="polite">
      <p class="font-semibold">{{ cur.name }}</p>
      <p class="mt-1 font-mono text-xs sm:text-sm">{{ cur.raw }} Gbps × ({{ cur.enc }} = {{ (cur.eff * 100).toFixed(1) }}%) = {{ effGbps.toFixed(2) }} Gbps ≈ <b>{{ mbps.toFixed(0) }} MB/s</b></p>
      <p class="mt-1 text-xs text-mute">{{ cur.note }}</p>
      <label class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-xs text-mute">ไฟล์ {{ sizeGB }} GB</span>
        <input v-model.number="sizeGB" type="range" min="1" max="200" class="accent-current" aria-label="ขนาดไฟล์ GB" />
        <span>→ <b>{{ fmt(seconds) }}</b> <span class="text-xs text-mute">(ขอบเขตบนในอุดมคติ ของจริงช้ากว่าเพราะอุปกรณ์ปลายทาง/โปรโตคอล)</span></span>
      </label>
    </div>
  </figure>
</template>
