<script setup lang="ts">
// แปลที่อยู่เสมือน (virtual) เป็นที่อยู่จริง (physical) ด้วย page table + TLB (จำลอง: ที่อยู่ 16 บิต หน้า 4 KB)
type Entry = { kind: 'ram'; frame: number } | { kind: 'disk' } | { kind: 'none' }
const PAGE_BITS = 12
const table = ref<Record<number, Entry>>({
  0: { kind: 'ram', frame: 0x5 },
  1: { kind: 'ram', frame: 0x2 },
  2: { kind: 'disk' },
  4: { kind: 'ram', frame: 0x7 },
  6: { kind: 'disk' },
})
const samples = [0x0123, 0x0ff0, 0x1a40, 0x2fff, 0x4008, 0x5000]
const addr = ref(0x0123)
const tlb = ref<{ vpn: number; frame: number }[]>([])
const TLB_SIZE = 2
const nextFrame = ref(0x9)

const hex = (n: number, w = 4) => n.toString(16).toUpperCase().padStart(w, '0')
const bin = (n: number, w: number) => n.toString(2).padStart(w, '0')
const vpn = computed(() => addr.value >> PAGE_BITS)
const offset = computed(() => addr.value & 0xfff)
const entry = computed<Entry>(() => table.value[vpn.value] ?? { kind: 'none' })
const inTlb = computed(() => tlb.value.find((t) => t.vpn === vpn.value))
const outcome = computed(() => {
  if (inTlb.value) return { t: 'tlb', frame: inTlb.value.frame }
  if (entry.value.kind === 'ram') return { t: 'table', frame: entry.value.frame }
  return { t: entry.value.kind }
})
const phys = computed(() => (outcome.value.frame !== undefined ? (outcome.value.frame << PAGE_BITS) | offset.value : null))

function access() {
  const o = outcome.value
  if (o.t === 'table' && o.frame !== undefined) {
    tlb.value = [...tlb.value, { vpn: vpn.value, frame: o.frame }].slice(-TLB_SIZE)
  }
}
function pick(a: number) {
  addr.value = a
}
function handleFault() {
  if (entry.value.kind !== 'disk') return
  table.value = { ...table.value, [vpn.value]: { kind: 'ram', frame: nextFrame.value } }
  nextFrame.value++
}
function reset() {
  tlb.value = []
  table.value = { 0: { kind: 'ram', frame: 5 }, 1: { kind: 'ram', frame: 2 }, 2: { kind: 'disk' }, 4: { kind: 'ram', frame: 7 }, 6: { kind: 'disk' } }
  nextFrame.value = 9
}
const rows = computed(() => Array.from({ length: 8 }, (_, i) => ({ i, e: table.value[i] ?? ({ kind: 'none' } as Entry) })))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <span>เลือกที่อยู่เสมือนที่โปรแกรมอ้างถึง:</span>
      <button v-for="a in samples" :key="a" type="button" class="rounded-md border px-2.5 py-1 font-mono transition" :class="addr === a ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="addr === a" @click="pick(a)">0x{{ hex(a) }}</button>
    </div>

    <div class="mt-4 rounded-lg border border-line bg-paper p-3 font-mono text-sm">
      <p>ที่อยู่ 0x{{ hex(addr) }} = {{ bin(vpn, 4) }} {{ bin(offset, 12) }}</p>
      <p class="mt-1 text-xs text-mute">4 บิตบน = หมายเลขหน้า (VPN) = {{ vpn }} · 12 บิตล่าง = ตำแหน่งในหน้า (offset) = 0x{{ hex(offset, 3) }} (หน้าละ 2¹² = 4096 ไบต์)</p>
    </div>

    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs font-semibold uppercase tracking-wide">Page table (ของโปรเซสนี้)</p>
        <ul class="mt-2 grid gap-1 font-mono text-xs">
          <li v-for="r in rows" :key="r.i" class="flex justify-between rounded px-2 py-1" :class="r.i === vpn ? 'bg-ink text-paper' : ''">
            <span>หน้า {{ r.i }}</span>
            <span>{{ r.e.kind === 'ram' ? `→ เฟรม ${r.e.frame.toString(16).toUpperCase()}` : r.e.kind === 'disk' ? 'อยู่บนดิสก์ (swap)' : 'ไม่ได้จอง' }}</span>
          </li>
        </ul>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs font-semibold uppercase tracking-wide">TLB (แคชของ page table · จุได้ {{ TLB_SIZE }})</p>
        <ul class="mt-2 grid gap-1 font-mono text-xs">
          <li v-for="i in TLB_SIZE" :key="i" class="rounded border border-line px-2 py-1" :class="tlb[i - 1] && tlb[i - 1]!.vpn === vpn ? 'border-ink bg-ink text-paper' : ''">
            {{ tlb[i - 1] ? `หน้า ${tlb[i - 1]!.vpn} → เฟรม ${tlb[i - 1]!.frame.toString(16).toUpperCase()}` : 'ว่าง' }}
          </li>
        </ul>
        <div class="mt-3 flex gap-2 text-sm">
          <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper" @click="access">เข้าถึงที่อยู่นี้</button>
          <button type="button" class="rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">รีเซ็ต</button>
        </div>
      </div>
    </div>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <template v-if="outcome.t === 'tlb'"><p><strong>TLB hit:</strong> เจอหน้า {{ vpn }} ใน TLB ไม่ต้องไปเปิด page table ในหน่วยความจำ → ที่อยู่จริง = เฟรม {{ outcome.frame!.toString(16).toUpperCase() }} ต่อ offset = <strong class="font-mono">0x{{ hex(phys!) }}</strong></p></template>
      <template v-else-if="outcome.t === 'table'"><p><strong>TLB miss แต่ page table มี:</strong> CPU ต้องอ่าน page table (เข้าหน่วยความจำเพิ่ม 1 ครั้งขึ้นไป) ได้เฟรม {{ outcome.frame!.toString(16).toUpperCase() }} → ที่อยู่จริง <strong class="font-mono">0x{{ hex(phys!) }}</strong> แล้วจำใส่ TLB (กด “เข้าถึง” เพื่อบันทึก) ลองกดซ้ำจะเป็น TLB hit</p></template>
      <template v-else-if="outcome.t === 'disk'">
        <p><strong>Page fault:</strong> หน้า {{ vpn }} ถูกย้ายลงดิสก์ CPU แจ้งขัดจังหวะให้ระบบปฏิบัติการ ซึ่งต้องหาเฟรมว่าง อ่านหน้านั้นกลับจากดิสก์ (ช้าระดับมิลลิวินาทีหรือสิบไมโครวินาทีบน SSD) แล้วแก้ page table ก่อนสั่งคำสั่งเดิมซ้ำ</p>
        <button type="button" class="mt-2 rounded-md border border-ink bg-ink px-3 py-1.5 text-paper" @click="handleFault">ให้ OS จัดการ page fault (โหลดหน้านี้เข้า RAM)</button>
      </template>
      <template v-else><p><strong>Segmentation fault:</strong> หน้า {{ vpn }} ไม่ได้อยู่ในพื้นที่ที่โปรเซสจองไว้ ระบบปฏิบัติการไม่โหลดให้ และยุติโปรเซส (บน Windows เรียกว่า access violation) นี่คือสิ่งที่กันโปรแกรมหนึ่งไม่ให้อ่าน/เขียนหน่วยความจำของอีกโปรแกรม</p></template>
    </div>
    <figcaption class="mt-3 text-sm text-mute">ย่อให้เล็ก: ที่อยู่ 16 บิต, page table 8 แถวแรก, TLB 2 ช่อง (ของจริง 48 บิตขึ้นไป หลายระดับ และ TLB หลายสิบ–พันช่อง) จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
