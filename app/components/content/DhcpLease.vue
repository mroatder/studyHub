<script setup lang="ts">
// เส้นเวลาสัญญาเช่า DHCP: T1 (50%) ต่อกับเซิร์ฟเวอร์เดิมแบบ unicast, T2 (87.5%) broadcast หาเซิร์ฟเวอร์ใดก็ได้, หมดอายุแล้วเริ่มใหม่ (จำลอง)
const leases = [
  { label: '1 ชั่วโมง', s: 3600 },
  { label: '8 ชั่วโมง', s: 28800 },
  { label: '24 ชั่วโมง', s: 86400 },
  { label: '7 วัน', s: 604800 },
]
const lease = ref(86400)
const pct = ref(0)
const origUp = ref(true)
const otherUp = ref(false)

const fmt = (sec: number) => {
  if (sec < 60) return `${Math.round(sec)} วินาที`
  if (sec < 3600) return `${(sec / 60).toFixed(1).replace(/\.0$/, '')} นาที`
  if (sec < 172800) return `${(sec / 3600).toFixed(1).replace(/\.0$/, '')} ชั่วโมง`
  return `${(sec / 86400).toFixed(1).replace(/\.0$/, '')} วัน`
}
const t = computed(() => (pct.value / 100) * lease.value)
const t1 = computed(() => lease.value * 0.5)
const t2 = computed(() => lease.value * 0.875)

const phase = computed(() => {
  const p = pct.value
  if (p < 50) return { name: 'BOUND', th: 'ใช้งานปกติ', ok: true, text: `ยังไม่ถึง T1 (${fmt(t1.value)}) เครื่องใช้ IP นี้ต่อได้เลย ไม่ส่งอะไรออกไป` }
  if (p < 87.5) {
    if (origUp.value) return { name: 'RENEWING', th: 'ต่ออายุที่ T1 สำเร็จ', ok: true, text: `ที่ T1 เครื่องส่ง DHCPREQUEST แบบ unicast ไปหาเซิร์ฟเวอร์เดิม ได้ DHCPACK กลับมา นาฬิกาเริ่มนับ ${fmt(lease.value)} ใหม่ จึงไม่มีทางถึง T2 ตราบที่เซิร์ฟเวอร์เดิมยังตอบ` }
    return { name: 'RENEWING', th: 'ขอต่ออายุแต่เซิร์ฟเวอร์เดิมเงียบ', ok: true, text: 'เครื่องส่ง unicast ไปหาเซิร์ฟเวอร์เดิมไม่ได้คำตอบ จึงลองซ้ำเป็นระยะ (RFC 2131 ให้ลองซ้ำทุกครึ่งหนึ่งของเวลาที่เหลือจนถึง T2 อย่างน้อย 60 วินาที) ระหว่างนี้ยังใช้ IP เดิมได้ตามปกติ' }
  }
  if (p < 100) {
    if (origUp.value) return { name: 'RENEWING', th: 'ต่ออายุที่ T1 สำเร็จไปแล้ว', ok: true, text: 'เซิร์ฟเวอร์เดิมตอบตั้งแต่ T1 นาฬิกาถูกรีเซ็ตแล้ว จึงไม่เข้าช่วงนี้' }
    if (otherUp.value) return { name: 'REBINDING', th: 'ผูกใหม่ที่ T2 สำเร็จ', ok: true, text: 'ที่ T2 เครื่อง broadcast DHCPREQUEST ถามเซิร์ฟเวอร์ตัวไหนก็ได้ที่ตอบ ได้ DHCPACK จากเซิร์ฟเวอร์อื่น (ที่ดูแลช่วงเดียวกัน เช่น คู่ failover) ต่ออายุสำเร็จ' }
    return { name: 'REBINDING', th: 'ไม่มีเซิร์ฟเวอร์ใดตอบ', ok: false, text: `ผ่าน T2 แล้ว broadcast ไม่มีใครตอบ เครื่องยังใช้ IP เดิมได้อีก ${fmt(lease.value - t.value)} ก่อนสัญญาหมด หลังจากนั้นต้องทิ้ง IP` }
  }
  if (origUp.value || otherUp.value) return { name: 'RENEWED', th: 'ต่อสัญญาไปแล้วก่อนหมดอายุ', ok: true, text: 'มีเซิร์ฟเวอร์ตอบในช่วง T1 หรือ T2 สัญญาถูกต่อก่อนถึงจุดนี้' }
  return { name: 'EXPIRED', th: 'สัญญาหมด ต้องทิ้ง IP', ok: false, text: 'ไม่มีเซิร์ฟเวอร์ตอบเลยจนสัญญาหมด เครื่องต้องหยุดใช้ IP เดิมทันที กลับไป INIT ส่ง DHCPDISCOVER ใหม่ และถ้ายังไม่มีใครตอบ ระบบมักตั้ง APIPA 169.254.x.x ที่คุยออกนอกซับเน็ตไม่ได้' }
})
const bar = (p: number) => ({ left: p + '%' })
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <span>อายุสัญญา:</span>
      <button v-for="l in leases" :key="l.s" type="button" class="rounded-md border px-3 py-1.5 transition" :class="lease === l.s ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="lease === l.s" @click="lease = l.s">{{ l.label }}</button>
    </div>
    <div class="mt-3 flex flex-wrap gap-4 text-sm">
      <label class="flex items-center gap-2"><input v-model="origUp" type="checkbox" class="h-4 w-4 accent-current" /> เซิร์ฟเวอร์เดิมตอบ</label>
      <label class="flex items-center gap-2"><input v-model="otherUp" type="checkbox" class="h-4 w-4 accent-current" /> มีเซิร์ฟเวอร์สำรองตอบ</label>
    </div>

    <div class="mt-6 px-2">
      <div class="relative h-3 rounded-full border border-line bg-paper">
        <div class="absolute inset-y-0 left-0 rounded-full bg-mute/40" :style="{ width: pct + '%' }" />
        <span class="absolute -top-1 h-5 w-0.5 bg-ink" :style="bar(50)" />
        <span class="absolute -top-1 h-5 w-0.5 bg-ink" :style="bar(87.5)" />
        <span class="absolute -top-1 h-5 w-0.5 bg-ink" :style="bar(100)" />
      </div>
      <div class="relative mt-1 h-10 text-[11px] sm:text-xs">
        <span class="absolute -translate-x-1/2 text-center" style="left: 0%">เริ่ม<br />0</span>
        <span class="absolute -translate-x-1/2 text-center font-semibold" style="left: 50%">T1<br />{{ fmt(t1) }}</span>
        <span class="absolute -translate-x-1/2 text-center font-semibold" style="left: 87.5%">T2<br />{{ fmt(t2) }}</span>
        <span class="absolute -translate-x-full text-center" style="left: 100%">หมด<br />{{ fmt(lease) }}</span>
      </div>
      <label class="mt-2 block text-sm">
        <span class="flex justify-between"><span>เวลาที่ผ่านไปหลังได้ IP</span><span class="font-mono">{{ fmt(t) }} ({{ pct.toFixed(1) }}%)</span></span>
        <input v-model.number="pct" type="range" min="0" max="100" step="0.5" class="mt-1 w-full accent-current" aria-label="เวลาที่ผ่านไปหลังได้ IP" />
      </label>
    </div>

    <div class="mt-3 rounded-lg border p-3 text-sm leading-7" :class="phase.ok ? 'border-line bg-paper' : 'border-ink bg-paper'" aria-live="polite">
      <p><strong>สถานะ {{ phase.name }} · {{ phase.th }}</strong></p>
      <p class="mt-1">{{ phase.text }}</p>
    </div>
    <figcaption class="mt-3 text-sm text-mute">T1 = 50% และ T2 = 87.5% ของอายุสัญญา เป็นค่าปริยายตาม RFC 2131 (เซิร์ฟเวอร์ปรับได้ด้วย option 58/59) จำลองในหน้าเว็บ ลองปิด &quot;เซิร์ฟเวอร์เดิมตอบ&quot; แล้วเลื่อนเวลาไปที่ 90%</figcaption>
  </figure>
</template>
