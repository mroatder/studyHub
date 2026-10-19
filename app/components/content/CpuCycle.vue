<script setup lang="ts">
// จำลอง CPU รันโปรแกรมเล็กๆ: 2 + 3 แล้วเก็บผลลัพธ์ ดูข้อมูลวิ่งระหว่าง RAM กับส่วนต่างๆ ใน CPU
type Part = 'ram' | 'cu' | 'reg' | 'alu'
interface Step {
  phase: string
  parts: Part[]
  text: string
  pc: number
  ir: string
  r1: string
  r2: string
  mem: string
}
const program = ['LOAD R1, 2', 'LOAD R2, 3', 'ADD R1, R2', 'STORE R1 → ผลลัพธ์']
const steps: Step[] = [
  { phase: 'Fetch', parts: ['ram', 'cu'], text: 'CU ไปดึงคำสั่งบรรทัดที่ 0 จาก RAM', pc: 0, ir: 'LOAD R1, 2', r1: '–', r2: '–', mem: '–' },
  { phase: 'Decode + Execute', parts: ['cu', 'reg'], text: 'ถอดรหัสได้ว่า "เอาเลข 2 ใส่ R1" แล้วเขียนค่าลง register', pc: 0, ir: 'LOAD R1, 2', r1: '2', r2: '–', mem: '–' },
  { phase: 'Fetch', parts: ['ram', 'cu'], text: 'PC เลื่อนไปบรรทัดที่ 1 CU ดึงคำสั่งถัดไปจาก RAM', pc: 1, ir: 'LOAD R2, 3', r1: '2', r2: '–', mem: '–' },
  { phase: 'Decode + Execute', parts: ['cu', 'reg'], text: 'เอาเลข 3 ใส่ R2', pc: 1, ir: 'LOAD R2, 3', r1: '2', r2: '3', mem: '–' },
  { phase: 'Fetch', parts: ['ram', 'cu'], text: 'ดึงคำสั่งบรรทัดที่ 2 คือ ADD', pc: 2, ir: 'ADD R1, R2', r1: '2', r2: '3', mem: '–' },
  { phase: 'Decode', parts: ['cu', 'alu'], text: 'CU ตีความว่าต้อง "บวกเลข" จึงสั่งงานหน่วยคำนวณ (ALU)', pc: 2, ir: 'ADD R1, R2', r1: '2', r2: '3', mem: '–' },
  { phase: 'Execute', parts: ['reg', 'alu'], text: 'ALU หยิบ R1 กับ R2 มาบวกกัน 2 + 3 = 5 แล้วเก็บกลับใน R1', pc: 2, ir: 'ADD R1, R2', r1: '5', r2: '3', mem: '–' },
  { phase: 'Write back', parts: ['reg', 'ram'], text: 'คำสั่งสุดท้าย: เขียนค่าใน R1 ลง RAM เป็นผลลัพธ์ของโปรแกรม', pc: 3, ir: 'STORE R1', r1: '5', r2: '3', mem: '5' },
]
const s = useStepper(steps.length, 2600)
const cur = computed(() => steps[s.index.value]!)
const on = (p: Part) => cur.value.parts.includes(p)
const box = (p: Part) => (on(p) ? 'border-ink bg-ink text-paper' : 'border-line bg-paper')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-3 sm:grid-cols-[1fr_2fr]">
      <!-- RAM -->
      <div class="rounded-lg border-2 p-3 transition-colors" :class="box('ram')">
        <p class="text-xs font-semibold uppercase tracking-wide">RAM</p>
        <ol class="mt-2 space-y-1 font-mono text-xs">
          <li v-for="(line, i) in program" :key="i" class="rounded px-1.5 py-0.5"
            :class="i === cur.pc ? (on('ram') ? 'bg-paper text-ink' : 'bg-ink text-paper') : ''">
            {{ i }}: {{ line }}
          </li>
        </ol>
        <p class="mt-2 font-mono text-xs">ผลลัพธ์ = {{ cur.mem }}</p>
      </div>
      <!-- CPU -->
      <div class="rounded-lg border-2 border-ink/30 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-mute">CPU</p>
        <div class="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div class="rounded-lg border-2 p-2 transition-colors" :class="box('cu')">
            <p class="font-semibold">Control Unit</p>
            <p class="mt-1 font-mono opacity-80">PC = {{ cur.pc }}</p>
            <p class="font-mono opacity-80">IR = {{ cur.ir }}</p>
          </div>
          <div class="rounded-lg border-2 p-2 transition-colors" :class="box('reg')">
            <p class="font-semibold">Registers</p>
            <p class="mt-1 font-mono opacity-80">R1 = {{ cur.r1 }}</p>
            <p class="font-mono opacity-80">R2 = {{ cur.r2 }}</p>
          </div>
          <div class="rounded-lg border-2 p-2 transition-colors" :class="box('alu')">
            <p class="font-semibold">ALU</p>
            <p class="mt-1 font-mono opacity-80">{{ on('alu') && cur.phase === 'Execute' ? '2 + 3 = 5' : 'คำนวณ' }}</p>
          </div>
        </div>
      </div>
    </div>
    <p class="mt-4 min-h-16 leading-8 text-ink/80" aria-live="polite">
      <span class="mr-2 rounded bg-ink px-2 py-0.5 text-xs font-semibold text-paper">{{ cur.phase }}</span>{{ cur.text }}
    </p>
    <AnimControls :playing="s.playing.value" :is-first="s.isFirst.value" :is-last="s.isLast.value" @toggle="s.toggle" @prev="s.prev" @next="s.next" @reset="s.reset" />
    <figcaption class="mt-3 text-sm text-mute">ขั้นที่ {{ s.index.value + 1 }} / {{ steps.length }} · กล่องที่เข้มคือส่วนที่กำลังทำงานในขั้นนี้ (PC = ตัวนับว่าคำสั่งถัดไปอยู่ที่ไหน, IR = คำสั่งที่กำลังทำ)</figcaption>
  </figure>
</template>
