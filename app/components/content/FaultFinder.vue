<script setup lang="ts">
// ลองหาจุดเสียของเครือข่ายที่ซ่อนอยู่ แล้วเทียบกลยุทธ์ bottom-up, top-down, divide and conquer ว่าใช้กี่ครั้ง
const points = [
  { label: 'การ์ดเครือข่าย/TCP-IP ในเครื่อง', cmd: 'ping 127.0.0.1' },
  { label: 'ถึงเราเตอร์ (gateway)', cmd: 'ping 192.168.1.1' },
  { label: 'ออกอินเทอร์เน็ตด้วยหมายเลข IP', cmd: 'ping 1.1.1.1' },
  { label: 'แปลงชื่อเว็บเป็น IP (DNS)', cmd: 'ping example.com' },
  { label: 'เปิดเว็บในเบราว์เซอร์', cmd: 'เปิด http://example.com' },
]
const faults = [
  'TCP/IP ในเครื่องเสียหาย',
  'สายแลนหลุด หรือ Wi-Fi หลุด',
  'เราเตอร์ออกอินเทอร์เน็ตไม่ได้ (ฝั่งผู้ให้บริการล่ม)',
  'DNS เซิร์ฟเวอร์ล่ม',
  'เว็บปลายทางล่ม',
]
const fault = ref(Math.floor(Math.random() * 5))
const tested = ref<Record<number, boolean>>({})
const order = ref<number[]>([])
const showCompare = ref(false)

const passes = (i: number) => i < fault.value
function test(i: number) {
  if (tested.value[i] === undefined) order.value.push(i)
  tested.value[i] = passes(i)
}
function again() {
  fault.value = Math.floor(Math.random() * 5)
  tested.value = {}
  order.value = []
  showCompare.value = false
}
const found = computed(() => {
  for (let i = 0; i < 5; i++) {
    const r = tested.value[i]
    if (r === false && (i === 0 || tested.value[i - 1] === true)) return i
  }
  if (tested.value[3] === true) return 4
  return -1
})

// อาการที่ผู้ใช้แจ้งคือ "เปิดเว็บไม่ได้" (จุดที่ 5 ล้มเหลวอยู่แล้ว) จึงไม่นับเป็นการทดสอบ
const f = computed(() => fault.value)
const bottomUp = computed(() => {
  const seq: number[] = []
  for (let i = 0; i <= 3; i++) {
    seq.push(i)
    if (i >= f.value) break
  }
  return seq
})
const topDown = computed(() => {
  const seq: number[] = []
  for (let i = 3; i >= 0; i--) {
    seq.push(i)
    if (passes(i)) break
  }
  return seq
})
const divide = computed(() => {
  const seq: number[] = []
  let lo = 0
  let hi = 4
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    seq.push(mid)
    if (passes(mid)) lo = mid + 1
    else hi = mid
  }
  return seq
})
const strategies = computed(() => [
  { name: 'Bottom-up (จากล่างขึ้นบน)', seq: bottomUp.value },
  { name: 'Top-down (จากบนลงล่าง)', seq: topDown.value },
  { name: 'Divide and conquer (แบ่งครึ่ง)', seq: divide.value },
])
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm leading-7">ผู้ใช้แจ้งว่า <b>"เปิดเว็บไม่ได้"</b> สาเหตุจริงถูกซ่อนไว้ ลองกดทดสอบทีละจุดตามลำดับที่คุณเลือก เป้าหมายคือหาจุดเสียด้วยจำนวนครั้งน้อยที่สุด</p>

    <ol class="mt-3 space-y-2" aria-live="polite">
      <li v-for="(p, i) in points" :key="p.cmd">
        <button type="button" class="flex min-h-12 w-full items-center gap-3 rounded-lg border bg-paper px-3 py-2 text-left text-sm transition hover:border-ink" :class="tested[i] === undefined ? 'border-line' : 'border-ink'" @click="test(i)">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line font-mono text-xs">{{ i + 1 }}</span>
          <span class="min-w-0 flex-1">
            <span class="block">{{ p.label }}</span>
            <span class="block break-all font-mono text-xs text-mute">{{ p.cmd }}</span>
          </span>
          <span v-if="tested[i] !== undefined" class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold" :class="tested[i] ? 'border border-ink' : 'bg-ink text-paper'">{{ tested[i] ? 'ผ่าน' : 'ไม่ผ่าน' }}</span>
        </button>
      </li>
    </ol>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-mute">ทดสอบไปแล้ว {{ order.length }} ครั้ง</span>
      <button type="button" class="ml-auto min-h-10 rounded-md border border-line px-3 hover:border-ink" @click="again">สุ่มปัญหาใหม่</button>
      <button type="button" class="min-h-10 rounded-md border border-ink px-3" @click="showCompare = !showCompare">{{ showCompare ? 'ซ่อนเฉลย' : 'เฉลยและเทียบกลยุทธ์' }}</button>
    </div>

    <p v-if="found >= 0" class="mt-3 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-paper">พบจุดเสียแล้ว: จุดที่ {{ found + 1 }} ({{ points[found]!.label }}) ใช้ทดสอบ {{ order.length }} ครั้ง</p>

    <div v-if="showCompare" class="mt-4 rounded-lg border border-line bg-paper p-3 text-sm">
      <p>สาเหตุจริง: <b>{{ faults[fault] }}</b> (จุดแรกที่เสียคือจุดที่ {{ fault + 1 }})</p>
      <ul class="mt-3 space-y-2">
        <li v-for="s in strategies" :key="s.name" class="rounded border border-line p-2">
          <p class="font-semibold">{{ s.name }} · {{ s.seq.length }} ครั้ง</p>
          <p class="mt-1 text-xs leading-6 text-mute">ลำดับจุดที่ทดสอบ: {{ s.seq.map((n) => n + 1).join(' → ') }}</p>
        </li>
      </ul>
      <p class="mt-3 text-xs leading-6 text-mute">ไม่มีกลยุทธ์ใดชนะทุกกรณี: ถ้าสงสัยว่าเป็นที่แอปหรือ DNS top-down เร็ว ถ้าสงสัยว่าเป็นสายหรือฮาร์ดแวร์ bottom-up เร็ว ส่วน divide and conquer ใช้ได้ดีเมื่อไม่มีเบาะแส และใช้จำนวนครั้งไม่เกินประมาณ log ของจำนวนจุด</p>
    </div>
    <figcaption class="mt-3 text-sm text-mute">จำลองในหน้าเว็บ: ผลเป็นแบบง่าย (จุดที่อยู่ก่อนจุดเสียผ่านทั้งหมด จุดที่เสียและจุดหลังจากนั้นไม่ผ่านหมด) ซึ่งเป็นความจริงของเส้นทางเครือข่ายแบบต่อเนื่อง</figcaption>
  </figure>
</template>
