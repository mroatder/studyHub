<script setup lang="ts">
// ห้องทดลองเรียงลำดับทดสอบ: เลือกลำดับทดสอบทฤษฎี 5 ข้อ เห็นต้นทุนเฉลี่ยที่คาดหวัง
// เทียบกับลำดับที่ดีที่สุด (เรียงตาม p/c) แล้วรันกับปัญหาสุ่มทีละขั้น หรือรัน 2,000 รอบดูค่าเฉลี่ย
const H = [
  { name: 'ปลั๊ก / สาย / Wi-Fi หลุด', test: 'ดูไฟลิงก์และไอคอน Wi-Fi', p: 0.2, c: 1 },
  { name: 'เบราว์เซอร์: แคช / ส่วนขยาย', test: 'เปิดหน้าต่างส่วนตัวหรือเบราว์เซอร์อื่น', p: 0.35, c: 2 },
  { name: 'พร็อกซีตั้งผิด', test: 'เปิดดูค่า proxy ของระบบ', p: 0.1, c: 2 },
  { name: 'DNS ใช้ไม่ได้', test: 'nslookup เทียบกับการเข้าด้วย IP ตรงๆ', p: 0.25, c: 3 },
  { name: 'เซิร์ฟเวอร์ปลายทางล่ม', test: 'ขอข้อมูลจากทีมเซิร์ฟเวอร์ (ต้องรอ)', p: 0.1, c: 10 },
]
const plan = ref<number[]>([])
const truth = ref(-1)
const shown = ref(0)
const mc = ref<number | null>(null)

const cost = (order: number[]) => {
  let t = 0
  let e = 0
  for (const i of order) { t += H[i]!.c; e += H[i]!.p * t }
  return e
}
const idx = H.map((_, i) => i)
const byRatio = [...idx].sort((a, b) => H[b]!.p / H[b]!.c - H[a]!.p / H[a]!.c)
const best = cost(byRatio)
const worst = cost([...byRatio].reverse())
const mine = computed(() => (plan.value.length === H.length ? cost(plan.value) : null))

function toggle(i: number) {
  const k = plan.value.indexOf(i)
  plan.value = k >= 0 ? plan.value.filter(x => x !== i) : [...plan.value, i]
  resetRun()
}
function resetRun() { truth.value = -1; shown.value = 0; mc.value = null }
function preset(kind: 'p' | 'c' | 'r') {
  const f = {
    p: (a: number, b: number) => H[b]!.p - H[a]!.p,
    c: (a: number, b: number) => H[a]!.c - H[b]!.c,
    r: (a: number, b: number) => H[b]!.p / H[b]!.c - H[a]!.p / H[a]!.c,
  }[kind]
  plan.value = [...idx].sort(f)
  resetRun()
}
function draw() {
  let r = Math.random()
  for (let i = 0; i < H.length; i++) { r -= H[i]!.p; if (r < 0) return i }
  return H.length - 1
}
function newCase() { truth.value = draw(); shown.value = 0; mc.value = null }
const steps = computed(() => {
  const out: { i: number; total: number; hit: boolean }[] = []
  let t = 0
  for (const i of plan.value.slice(0, shown.value)) {
    t += H[i]!.c
    out.push({ i, total: t, hit: i === truth.value })
  }
  return out
})
const found = computed(() => steps.value.some(s => s.hit))
function step() { if (!found.value && shown.value < plan.value.length) shown.value++ }
function many() {
  let sum = 0
  const N = 2000
  for (let n = 0; n < N; n++) {
    const t = draw()
    let c = 0
    for (const i of plan.value) { c += H[i]!.c; if (i === t) break }
    sum += c
  }
  mc.value = sum / N
}
const f = (x: number) => x.toFixed(2)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm"><span class="text-xs text-mute">ผู้ใช้แจ้งว่า</span> <b>เปิดเว็บภายในบริษัทไม่ได้ เพื่อนร่วมงานเปิดได้</b></p>
    <p class="mt-1 text-xs text-mute">กดเลือกการทดสอบตามลำดับที่จะทำ (กดซ้ำเพื่อยกเลิก) ตัวเลข p = ความน่าจะเป็นที่เป็นสาเหตุ, c = นาทีที่ใช้ทดสอบ (ค่าสมมุติเพื่อการสอน)</p>

    <ul class="mt-3 grid gap-2">
      <li v-for="(h, i) in H" :key="h.name">
        <button type="button" class="flex w-full items-center gap-3 rounded-lg border bg-paper p-3 text-left transition hover:border-ink"
          :class="plan.includes(i) ? 'border-ink' : 'border-line'" :aria-pressed="plan.includes(i)" @click="toggle(i)">
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold"
            :class="plan.includes(i) ? 'border-ink bg-ink text-paper' : 'border-line text-mute'">{{ plan.includes(i) ? plan.indexOf(i) + 1 : '–' }}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">{{ h.name }}</span>
            <span class="block text-xs text-mute">ทดสอบ: {{ h.test }}</span>
          </span>
          <span class="shrink-0 text-right text-xs tabular-nums">
            <span class="block">p = {{ h.p }}</span>
            <span class="block text-mute">c = {{ h.c }} นาที</span>
          </span>
        </button>
      </li>
    </ul>

    <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
      <span class="text-mute">ลองสูตรสำเร็จรูป:</span>
      <button type="button" class="rounded-md border border-line px-2 py-1 hover:border-ink" @click="preset('p')">มีโอกาสสูงก่อน</button>
      <button type="button" class="rounded-md border border-line px-2 py-1 hover:border-ink" @click="preset('c')">ถูกก่อน</button>
      <button type="button" class="rounded-md border border-line px-2 py-1 hover:border-ink" @click="preset('r')">p ÷ c สูงก่อน</button>
      <button type="button" class="rounded-md border border-line px-2 py-1 text-mute hover:border-ink" @click="plan = []; resetRun()">ล้าง</button>
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-3" aria-live="polite">
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs text-mute">ลำดับของคุณ (ต้นทุนเฉลี่ยที่คาดหวัง)</p>
        <p class="text-lg font-semibold tabular-nums">{{ mine === null ? 'เลือกให้ครบ 5' : f(mine) + ' นาที' }}</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs text-mute">ดีที่สุด (เรียงตาม p ÷ c)</p>
        <p class="text-lg font-semibold tabular-nums">{{ f(best) }} นาที</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs text-mute">แย่ที่สุด (กลับด้าน)</p>
        <p class="text-lg font-semibold tabular-nums">{{ f(worst) }} นาที</p>
      </div>
    </div>

    <div v-if="mine !== null" class="mt-4 rounded-lg border border-line bg-paper p-3">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="rounded-md bg-ink px-2.5 py-1 text-xs text-paper" @click="newCase">🎲 สุ่มปัญหาจริง (ซ่อนสาเหตุ)</button>
        <button type="button" :disabled="truth < 0 || found" class="rounded-md border border-line px-2.5 py-1 text-xs enabled:hover:border-ink disabled:opacity-40" @click="step">▶ ทดสอบข้อถัดไป</button>
        <button type="button" class="rounded-md border border-line px-2.5 py-1 text-xs hover:border-ink" @click="many">รัน 2,000 รอบ หาค่าเฉลี่ย</button>
      </div>
      <ol v-if="steps.length" class="mt-3 grid gap-1 text-xs">
        <li v-for="(s, k) in steps" :key="k" class="flex flex-wrap items-center gap-2">
          <span class="text-mute">{{ k + 1 }}.</span>
          <span>{{ H[s.i]!.test }}</span>
          <span class="ml-auto tabular-nums text-mute">สะสม {{ s.total }} นาที</span>
          <b>{{ s.hit ? '✓ เจอสาเหตุ: ' + H[s.i]!.name : '✕ ไม่ใช่' }}</b>
        </li>
      </ol>
      <p v-if="found" class="mt-2 text-sm">รอบนี้ใช้เวลา <b>{{ steps[steps.length - 1]!.total }} นาที</b> (โชคดีหรือโชคร้ายเป็นรายรอบ ค่าเฉลี่ยจึงต้องดูหลายรอบ)</p>
      <p v-if="mc !== null" class="mt-2 text-sm">เฉลี่ยจาก 2,000 รอบสุ่ม: <b class="tabular-nums">{{ f(mc) }} นาที</b> ใกล้ค่าคาดหวัง {{ f(mine) }} นาทีที่คำนวณจากสูตร</p>
    </div>

    <figcaption class="mt-3 text-xs text-mute">สูตร: ต้นทุนคาดหวัง = Σ pᵢ × (ผลรวม c ของทุกการทดสอบจนถึงข้อ i) ลำดับที่ลดต้นทุนเฉลี่ยได้ต่ำสุดคือเรียง pᵢ ÷ cᵢ จากมากไปน้อย (ใช้ได้เมื่อรู้ว่ามีสาเหตุเดียวและการทดสอบแต่ละข้อยืนยันได้แน่)</figcaption>
  </figure>
</template>
