<script setup lang="ts">
// Encapsulation: ข้อมูลผู้ใช้ถูกห่อด้วย header ทีละชั้น คำนวณจำนวนเฟรมและประสิทธิภาพบน Ethernet (MTU 1500)
const MTU = 1500
const ETH = 14
const FCS = 4
const IP = 20
const GAP = 20 // preamble 8 + inter-frame gap 12 (อยู่บนสายแต่ไม่นับในเฟรม)
const MIN_FRAME = 64

const payload = ref(3000)
const proto = ref<'TCP' | 'UDP'>('TCP')

const tHdr = computed(() => (proto.value === 'TCP' ? 20 : 8))
// TCP: แบ่งเป็น segment ตาม MSS | UDP: IP แบ่ง datagram เป็น fragment (ข้อมูล IP ต่อชิ้นสูงสุด 1480 ไบต์)
const chunks = computed(() => {
  const out: { data: number; tcpUdp: number }[] = []
  if (proto.value === 'TCP') {
    const mss = MTU - IP - 20
    let left = payload.value
    do {
      const d = Math.min(left, mss)
      out.push({ data: d, tcpUdp: 20 })
      left -= d
    } while (left > 0)
  } else {
    let left = payload.value + 8
    let first = true
    do {
      const d = Math.min(left, MTU - IP)
      out.push({ data: first ? d - 8 : d, tcpUdp: first ? 8 : 0 })
      left -= d
      first = false
    } while (left > 0)
  }
  return out
})
const frames = computed(() =>
  chunks.value.map((c) => {
    const raw = ETH + IP + c.tcpUdp + c.data + FCS
    return { ...c, raw, size: Math.max(MIN_FRAME, raw), pad: Math.max(0, MIN_FRAME - raw) }
  }),
)
const wire = computed(() => frames.value.reduce((n, f) => n + f.size + GAP, 0))
const eff = computed(() => (wire.value ? payload.value / wire.value : 0))
const first = computed(() => frames.value[0]!)
const bar = computed(() => {
  const f = first.value
  const parts = [
    { l: 'Ethernet', n: ETH, c: 'bg-mute/30' },
    { l: 'IP', n: IP, c: 'bg-mute/50' },
    ...(f.tcpUdp ? [{ l: proto.value, n: f.tcpUdp, c: 'bg-mute/70' }] : []),
    { l: 'ข้อมูล', n: f.data, c: 'bg-ink text-paper' },
    ...(f.pad ? [{ l: 'pad', n: f.pad, c: 'bg-paper' }] : []),
    { l: 'FCS', n: FCS, c: 'bg-mute/30' },
  ]
  return parts
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="p in (['TCP', 'UDP'] as const)" :key="p" type="button" class="rounded-md border px-3 py-1.5 transition" :class="proto === p ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="proto === p" @click="proto = p">{{ p }}</button>
      <span class="text-mute">ข้อมูลจากแอป:</span>
      <button v-for="n in [1, 100, 1460, 3000, 6000]" :key="n" type="button" class="rounded-md border px-2.5 py-1 font-mono transition" :class="payload === n ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="payload === n" @click="payload = n">{{ n }}</button>
    </div>
    <label class="mt-3 block text-sm">
      ขนาดข้อมูลจากแอป: <strong class="font-mono">{{ payload.toLocaleString() }} ไบต์</strong>
      <input v-model.number="payload" type="range" min="1" max="6000" step="1" class="mt-1 w-full accent-current" />
    </label>

    <p class="mt-3 text-xs text-mute">เฟรมแรก ({{ first.size }} ไบต์ รวม FCS) เรียงตามลำดับบนสาย: Ethernet ห่อ IP ห่อ {{ proto }} ห่อข้อมูล แล้วปิดท้ายด้วย FCS</p>
    <div class="mt-2 flex flex-wrap gap-1.5" role="img" :aria-label="`โครงสร้างเฟรมแรก ข้อมูล ${first.data} ไบต์ จากทั้งหมด ${first.size} ไบต์`">
      <div v-for="p in bar" :key="p.l" class="flex min-w-16 flex-col items-center justify-center rounded-md border border-line px-3 py-2 text-center text-xs" :class="[p.c, p.l === 'ข้อมูล' ? 'min-w-28 flex-1' : '']">
        <span>{{ p.l }}</span><span class="font-mono text-sm">{{ p.n }} ไบต์</span>
      </div>
    </div>
    <p class="mt-3 text-xs text-mute">สัดส่วนจริงตามขนาด (ส่วน header เล็กมากเมื่อเทียบกับข้อมูลเต็มเฟรม):</p>
    <div class="mt-1 flex h-3 overflow-hidden rounded border border-line" aria-hidden="true">
      <div v-for="p in bar" :key="'s' + p.l" class="border-r border-paper" :class="p.c" :style="{ width: (p.n / first.size) * 100 + '%' }" />
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">{{ proto === 'TCP' ? 'segment' : 'IP fragment' }} / เฟรม</p><p class="font-mono">{{ frames.length }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ไบต์บนสายรวม</p><p class="font-mono">{{ wire.toLocaleString() }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ประสิทธิภาพ (ข้อมูล ÷ สาย)</p><p class="font-mono">{{ (eff * 100).toFixed(1) }}%</p></div>
    </div>

    <p class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <template v-if="first.pad">ข้อมูลน้อยมาก เฟรม Ethernet ต้องยาวอย่างน้อย {{ MIN_FRAME }} ไบต์ จึงเติม pad {{ first.pad }} ไบต์ ประสิทธิภาพต่ำเพราะ header และช่องว่างบนสายมีขนาดคงที่ ({{ ETH + IP + tHdr + FCS + GAP }} ไบต์ต่อเฟรม)</template>
      <template v-else-if="frames.length > 1 && proto === 'TCP'">ข้อมูลเกิน MSS = 1500 − 20 − 20 = 1460 ไบต์ TCP จึงแบ่งเป็น {{ frames.length }} segment (เฟรมสุดท้ายเล็กกว่า) overhead คิดซ้ำทุกเฟรม</template>
      <template v-else-if="frames.length > 1">ดาตาแกรม UDP ใหญ่กว่า MTU ({{ MTU }}) ชั้น IP จึงต้องแบ่งเป็น {{ frames.length }} fragment ถ้ามีชิ้นเดียวหาย ทั้งดาตาแกรมใช้ไม่ได้ (UDP ไม่ส่งซ้ำให้)</template>
      <template v-else>ข้อมูลพอดีในเฟรมเดียว ประสิทธิภาพสูงสุดของ Ethernet+IP+TCP คือ 1460 ÷ 1538 ≈ 94.9%</template>
    </p>
    <figcaption class="mt-3 text-sm text-mute">คำนวณตามขนาด header มาตรฐาน (IP 20, TCP 20 ไม่นับ options, UDP 8, Ethernet 14 + FCS 4, preamble+gap 20) จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
