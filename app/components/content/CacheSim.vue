<script setup lang="ts">
// แคชแบบ direct-mapped ขนาดจิ๋ว (8 ไลน์ × 16 ไบต์) ลองรูปแบบการเข้าถึงหน่วยความจำแล้วดู hit/miss
const LINE = 16
const LINES = 8
const HIT_NS = 1
const MISS_NS = 80

interface Pattern { id: string; label: string; hint: string; addrs: number[] }
const range = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i))
const patterns: Pattern[] = [
  { id: 'seq', label: 'อ่านอาร์เรย์ตามลำดับ (int 4 ไบต์ × 64 ตัว)', hint: 'ได้ spatial locality: เจอ miss ครั้งเดียวต่อไลน์ แล้ว 3 ครั้งถัดไป hit เพราะตัวข้างเคียงมากับไลน์เดียวกัน', addrs: range(64, (i) => i * 4) },
  { id: 'small', label: 'วนซ้ำอาร์เรย์เล็ก (64 ไบต์ × 4 รอบ)', hint: 'ได้ทั้ง spatial และ temporal locality: อาร์เรย์เล็กกว่าแคช รอบที่ 2 เป็นต้นไปเป็น hit หมด', addrs: range(64, (i) => (i % 16) * 4) },
  { id: 'big', label: 'วนซ้ำอาร์เรย์ใหญ่ (256 ไบต์ × 3 รอบ)', hint: 'อาร์เรย์ใหญ่กว่าแคช (128 ไบต์) ไลน์ต้นถูกไลน์ท้ายแทนที่ก่อนรอบถัดไปจะวนมา จึงไม่ได้ประโยชน์จากการวนซ้ำ ได้แค่ spatial', addrs: range(192, (i) => (i % 64) * 4) },
  { id: 'stride16', label: 'กระโดดทีละ 16 ไบต์ (ทุกครั้งคนละไลน์)', hint: 'ทิ้ง spatial locality: ทุกครั้งแตะไลน์ใหม่ จึง miss ตลอด เหมือนอ่านอาร์เรย์ทีละแถวกับข้อมูลที่เรียงเป็นคอลัมน์', addrs: range(48, (i) => (i % 16) * 16) },
  { id: 'conflict', label: 'กระโดดทีละ 128 ไบต์ (ชนกันที่ไลน์เดียว)', hint: 'ใช้ข้อมูลแค่ 8 ไลน์ ซึ่งพอดีกับแคช แต่ทุกตำแหน่งแมปไปไลน์ 0 เหมือนกัน เกิด conflict miss ตลอด แม้แคชส่วนใหญ่ว่าง', addrs: range(32, (i) => (i % 8) * 128) },
]

const pid = ref('seq')
const pat = computed(() => patterns.find((p) => p.id === pid.value)!)
const pos = ref(0)
const tags = ref<(number | null)[]>(Array(LINES).fill(null))
const hits = ref(0)
const misses = ref(0)
const last = ref<{ addr: number; idx: number; hit: boolean } | null>(null)

function reset() {
  pos.value = 0
  tags.value = Array(LINES).fill(null)
  hits.value = 0
  misses.value = 0
  last.value = null
}
function pick(id: string) {
  pid.value = id
  reset()
}
function step() {
  if (pos.value >= pat.value.addrs.length) return
  const addr = pat.value.addrs[pos.value]!
  const block = Math.floor(addr / LINE)
  const idx = block % LINES
  const hit = tags.value[idx] === block
  if (hit) hits.value++
  else {
    misses.value++
    tags.value = tags.value.map((t, i) => (i === idx ? block : t))
  }
  last.value = { addr, idx, hit }
  pos.value++
}
function runAll() {
  while (pos.value < pat.value.addrs.length) step()
}
const done = computed(() => pos.value >= pat.value.addrs.length)
const total = computed(() => hits.value + misses.value)
const hitRate = computed(() => (total.value ? hits.value / total.value : 0))
const amat = computed(() => HIT_NS + (1 - hitRate.value) * MISS_NS)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2 text-sm">
      <button v-for="p in patterns" :key="p.id" type="button" class="rounded-md border px-3 py-1.5 text-left transition" :class="pid === p.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="pid === p.id" @click="pick(p.id)">{{ p.label }}</button>
    </div>
    <p class="mt-3 text-sm leading-7 text-mute">{{ pat.hint }}</p>

    <div class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8" aria-label="ไลน์ของแคช">
      <div v-for="(t, i) in tags" :key="i" class="rounded-md border p-2 text-center font-mono text-xs transition" :class="last && last.idx === i ? (last.hit ? 'border-ink bg-ink text-paper' : 'border-ink border-dashed bg-paper') : 'border-line bg-paper'">
        <p class="opacity-70">ไลน์ {{ i }}</p>
        <p class="mt-1">{{ t === null ? 'ว่าง' : `บล็อก ${t}` }}</p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper disabled:opacity-40" :disabled="done" @click="step">เข้าถึงถัดไป</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink disabled:opacity-40" :disabled="done" @click="runAll">รันจนจบ</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">เริ่มใหม่</button>
      <span class="ml-auto font-mono text-xs text-mute">{{ pos }} / {{ pat.addrs.length }}</span>
    </div>

    <p class="mt-3 rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-6 sm:text-sm" aria-live="polite">
      <template v-if="last">อ่านที่อยู่ {{ last.addr }} → บล็อก {{ Math.floor(last.addr / LINE) }} → ไลน์ {{ last.idx }} → <strong>{{ last.hit ? 'HIT' : 'MISS' }}</strong></template>
      <template v-else>กด “เข้าถึงถัดไป” เพื่อดูทีละครั้ง ที่อยู่ → บล็อก (÷16) → ไลน์ (บล็อก mod 8)</template>
    </p>

    <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">hit / miss</p><p class="font-mono">{{ hits }} / {{ misses }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">hit rate</p><p class="font-mono">{{ Math.round(hitRate * 100) }}%</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">เวลาเข้าถึงเฉลี่ย (AMAT)</p><p class="font-mono">{{ total ? amat.toFixed(1) : '–' }} ns</p></div>
    </div>
    <figcaption class="mt-3 text-sm text-mute">แคชจิ๋วเพื่อให้เห็นภาพ (แคชจริงไลน์ 64 ไบต์ และมักเป็นแบบ set-associative) ใช้ค่าสมมติ hit = {{ HIT_NS }} ns, miss = {{ MISS_NS }} ns · AMAT = hit + miss rate × miss penalty</figcaption>
  </figure>
</template>
