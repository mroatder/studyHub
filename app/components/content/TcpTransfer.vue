<script setup lang="ts">
// ส่ง 8 segment: TCP (ACK + ส่งซ้ำ) เทียบ UDP (ไม่รับประกัน) เมื่อมี segment หายระหว่างทาง
type St = 'idle' | 'flight' | 'lost' | 'got' | 'acked'
interface Frame { title: string; text: string; st: St[]; rtt: number }

const W = 4
const N = 8
const mode = ref<'TCP' | 'UDP'>('TCP')
const lossAt = ref(3) // 0 = ไม่มีการสูญหาย

const frames = computed<Frame[]>(() => {
  const L = lossAt.value
  const tcp = mode.value === 'TCP'
  const st: St[] = Array(N).fill('idle')
  let rtt = 0
  let retr = false
  const out: Frame[] = []
  const push = (title: string, text: string) => out.push({ title, text, st: [...st], rtt })
  push('เริ่มต้น', `ผู้ส่งมีข้อมูลแบ่งเป็น ${N} segment (หน้าต่างส่ง = ${W} segment ต่อรอบ)${L ? ` สมมติ segment ${L} จะหายระหว่างทางครั้งแรก` : ' ครั้งนี้ไม่มีการสูญหาย'}`)
  for (let base = 1; base <= N; base += W) {
    const win = Array.from({ length: Math.min(W, N - base + 1) }, (_, k) => base + k)
    const last = win[win.length - 1]!
    const lostNow = !retr && L >= base && L <= last
    for (const i of win) st[i - 1] = i === L && !retr ? 'lost' : 'flight'
    push('ส่ง', `ผู้ส่งปล่อย segment ${base}–${last} ออกไปพร้อมกัน${lostNow ? ` และ segment ${L} หายในเครือข่าย (✕)` : ''}`)
    for (const i of win) if (st[i - 1] === 'flight') st[i - 1] = 'got'
    rtt += 1
    if (lostNow) {
      if (tcp) {
        push('ผู้รับตอบ ACK ซ้ำ', `ผู้รับได้ segment อื่นแต่ขาด ${L} จึงตอบ ACK ${L} ซ้ำๆ (duplicate ACK = "ฉันยังรอ ${L}") และพัก segment ที่มาก่อนลำดับไว้ในบัฟเฟอร์`)
        st[L - 1] = 'flight'
        retr = true
        push('ส่งซ้ำ (retransmit)', `ผู้ส่งเห็น ACK ซ้ำ 3 ครั้ง (หรือหมดเวลา RTO) จึงส่ง segment ${L} ซ้ำ ใช้เวลาเพิ่มอีกหนึ่งรอบ`)
        st[L - 1] = 'got'
        rtt += 1
        for (const i of win) st[i - 1] = 'acked'
        push('ACK ข้ามไป', `ผู้รับได้ครบลำดับ จึงตอบ ACK ${last + 1} ครั้งเดียว ยืนยัน segment ${base}–${last} ทั้งหมด`)
      } else {
        retr = true
        push('ผู้รับ (UDP)', `ผู้รับได้ ${win.length - 1} จาก ${win.length} segment ไม่มี ACK ไม่มีการส่งซ้ำ ผู้ส่งไม่รู้ด้วยซ้ำว่ามีชิ้นหาย แอปปลายทางต้องตัดสินใจเอง (เช่น ข้ามเฟรมเสียง)`)
      }
    } else if (tcp) {
      for (const i of win) st[i - 1] = 'acked'
      push('ACK', `ผู้รับตอบ ACK ${last + 1} (= "ได้ถึง ${last} ครบแล้ว ต้องการ ${last + 1} ต่อ") ผู้ส่งเลื่อนหน้าต่างไปข้างหน้า`)
    } else {
      push('รับ (UDP)', `ผู้รับได้ segment ${base}–${last} ผู้ส่งไม่รอคำตอบและส่งต่อได้ทันที`)
    }
  }
  const missing = st.filter((x) => x === 'lost').length
  push('สรุป', tcp ? `ครบทั้ง ${N} segment ใช้ ${rtt} รอบเวลาไปกลับ (RTT) ${L ? 'เพราะมีการส่งซ้ำ 1 รอบ' : ''}` : `จบใน ${rtt} รอบ แต่ข้อมูลขาด ${missing} segment ${missing ? '(เร็วกว่า แต่ข้อมูลไม่ครบ)' : ''}`)
  return out
})

const s = useStepper(computed(() => frames.value.length), 2300)
watch([mode, lossAt], () => s.reset())
const cur = computed(() => frames.value[Math.min(s.index.value, frames.value.length - 1)]!)
const label: Record<St, string> = { idle: 'รอส่ง', flight: 'กำลังเดินทาง →', lost: '✕ หาย', got: 'ถึงแล้ว', acked: '✓ ACK แล้ว' }
const cls: Record<St, string> = {
  idle: 'border-line bg-paper text-mute',
  flight: 'border-ink bg-paper motion-safe:animate-pulse',
  lost: 'border-dashed border-ink bg-paper line-through opacity-70',
  got: 'border-ink bg-mute/30',
  acked: 'border-ink bg-ink text-paper',
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="m in (['TCP', 'UDP'] as const)" :key="m" type="button" class="rounded-md border px-3 py-1.5 transition" :class="mode === m ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="mode === m" @click="mode = m">{{ m }}</button>
      <span class="ml-2 text-mute">segment ที่หาย:</span>
      <button v-for="k in [0, 3, 6]" :key="k" type="button" class="rounded-md border px-2.5 py-1 font-mono transition" :class="lossAt === k ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="lossAt === k" @click="lossAt = k">{{ k === 0 ? 'ไม่มี' : k }}</button>
    </div>

    <div class="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-8" aria-label="สถานะของ 8 segment">
      <div v-for="(x, i) in cur.st" :key="i" class="rounded-md border p-2 text-center text-[11px] transition-colors duration-300 motion-reduce:transition-none sm:text-xs" :class="cls[x]">
        <p class="font-mono text-sm">{{ i + 1 }}</p>
        <p class="mt-1 leading-tight">{{ label[x] }}</p>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between text-xs text-mute">
      <span>ขั้นที่ {{ s.index.value + 1 }} / {{ frames.length }}</span>
      <span>เวลาที่ใช้ไป: <strong class="font-mono text-ink">{{ cur.rtt }} RTT</strong></span>
    </div>
    <p class="mt-2 min-h-20 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite"><strong>{{ cur.title }}:</strong> {{ cur.text }}</p>
    <div class="mt-3"><AnimControls :playing="s.playing.value" :is-first="s.isFirst.value" :is-last="s.isLast.value" @toggle="s.toggle" @prev="s.prev" @next="s.next" @reset="s.reset" /></div>
    <figcaption class="mt-3 text-sm text-mute">แบบจำลองย่อ: หน้าต่างส่ง 4 segment, นับเวลาเป็นรอบไปกลับ (RTT) ไม่ได้แสดงการควบคุมความแออัด จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
