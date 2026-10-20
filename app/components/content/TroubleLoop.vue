<script setup lang="ts">
// วงจรแก้ปัญหา 6 ขั้น: เดินทีละขั้น และตัดสินใจที่ขั้น 3 (ยืนยัน/หักล้างทฤษฎี) กับขั้น 5 (ผู้ใช้ยืนยันหรือยัง)
const steps = [
  {
    t: 'ระบุปัญหา (Identify)',
    what: ['ถามคำถามปลายเปิด: ทำอะไรอยู่ เห็นอะไร ข้อความ error ว่าอย่างไร', 'ถาม "มีอะไรเปลี่ยนไปเมื่อเร็วๆ นี้" (อัปเดต แก้ค่า ย้ายสาย)', 'ลองทำซ้ำให้เกิดปัญหาด้วยตัวเอง', 'ดู log และสภาพแวดล้อม (ไฟดับ งานซ่อมบำรุง)', 'ประเมินขอบเขต: คนเดียว แผนก หรือทั้งองค์กร'],
    trap: 'รับอาการของผู้ใช้เป็นสาเหตุ เช่น "เน็ตล่ม" ทั้งที่แค่เบราว์เซอร์ค้าง',
  },
  {
    t: 'ตั้งทฤษฎีสาเหตุที่เป็นไปได้ (Theory)',
    what: ['ลิสต์สาเหตุที่เป็นไปได้ เริ่มจากง่ายที่สุดก่อน', 'เลือกกลยุทธ์หา: top-down, bottom-up หรือ divide and conquer', 'เรียงตามความน่าจะเป็นและต้นทุนการทดสอบ'],
    trap: 'กระโดดไปสาเหตุซับซ้อนทั้งที่ยังไม่ได้เช็กสายไฟ ปลั๊ก หรือสิทธิ์',
  },
  {
    t: 'ทดสอบทฤษฎี (Test)',
    what: ['ทดสอบด้วยวิธีที่ไม่ทำลายข้อมูลและย้อนกลับได้', 'เปลี่ยนตัวแปรทีละอย่างเท่านั้น', 'ถ้าทฤษฎีผิด คืนค่าเดิมก่อนลองทฤษฎีถัดไป', 'ถ้าเกินอำนาจหรือความสามารถ ให้ escalate'],
    trap: 'แก้หลายอย่างพร้อมกัน จนไม่รู้ว่าอะไรได้ผล หรืออะไรทำให้พังเพิ่ม',
  },
  {
    t: 'วางแผนและลงมือแก้ (Plan & Fix)',
    what: ['เขียนขั้นตอนแก้ที่แน่นอน', 'ระบุผลข้างเคียง (ต้องรีสตาร์ต บริการหยุดชั่วคราว)', 'เตรียมแผนย้อนกลับ (rollback) และสำรองข้อมูลก่อน', 'งานที่กระทบคนหมู่มากทำในช่วงเวลาซ่อมบำรุงที่อนุมัติแล้ว'],
    trap: 'แก้ระบบจริงโดยไม่มีทางย้อนกลับ ถ้าแย่ลงจะกู้ไม่ได้',
  },
  {
    t: 'ตรวจสอบและป้องกันซ้ำ (Verify & Prevent)',
    what: ['ให้ผู้ใช้ลองทำงานจริงของเขา (เช่น พิมพ์ PDF จริง)', 'ตรวจว่าไม่มีผลข้างเคียงกับระบบอื่น', 'ใส่มาตรการป้องกัน เช่น log rotation, จัดผู้ใช้เข้ากลุ่มที่ถูก'],
    trap: 'ประกาศว่าเสร็จตอนที่ตัวเองเห็นว่าใช้ได้ โดยที่ผู้ใช้ยังไม่ยืนยัน',
  },
  {
    t: 'บันทึกผล (Document)',
    what: ['อาการที่ผู้ใช้แจ้ง', 'สาเหตุที่แท้จริง', 'ขั้นตอนที่แก้ (ละเอียดพอให้คนอื่นทำซ้ำได้)', 'ผลลัพธ์และค่าที่เปลี่ยน'],
    trap: 'ปิดงานโดยไม่จด ทำให้คนถัดไปต้องเริ่มวนใหม่ตั้งแต่ศูนย์',
  },
]
const cur = ref(0)
const tried = ref(1)
const loops = ref(0)
const done = ref(false)
const log = ref<string[]>(['เริ่มที่ขั้น 1'])

const go = (i: number, msg: string, loop = false) => {
  cur.value = i
  done.value = false
  if (loop) loops.value++
  log.value = [...log.value.slice(-5), msg]
}
const next = () => go(Math.min(cur.value + 1, 5), `ไปขั้น ${Math.min(cur.value + 2, 6)}`)
function disproved() {
  tried.value++
  go(1, `ขั้น 3: ทฤษฎีถูกหักล้าง คืนค่าเดิมแล้วกลับไปขั้น 2 (ทฤษฎีที่ ${tried.value})`, true)
}
const confirmed = () => go(3, 'ขั้น 3: ยืนยันสาเหตุ ไปขั้น 4')
const userNo = () => go(1, 'ขั้น 5: ผู้ใช้ยังใช้ไม่ได้ กลับไปทบทวนทฤษฎี (ขั้น 2)', true)
const userYes = () => go(5, 'ขั้น 5: ผู้ใช้ยืนยันแล้ว ไปบันทึกผล')
const finish = () => {
  done.value = true
  log.value = [...log.value.slice(-5), 'ปิดงานพร้อมบันทึกเรียบร้อย']
}
function reset() {
  cur.value = 0
  tried.value = 1
  loops.value = 0
  done.value = false
  log.value = ['เริ่มที่ขั้น 1']
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <ol class="grid grid-cols-6 gap-1.5" aria-label="ขั้นตอนทั้ง 6">
      <li v-for="(s, i) in steps" :key="s.t">
        <button type="button" class="flex h-11 w-full items-center justify-center rounded-md border text-sm font-semibold transition" :class="i === cur ? 'border-ink bg-ink text-paper' : i < cur ? 'border-ink' : 'border-line bg-paper hover:border-ink'" :aria-current="i === cur ? 'step' : undefined" :aria-label="`ขั้น ${i + 1}: ${s.t}`" @click="go(i, `กระโดดไปดูขั้น ${i + 1}`)">{{ i + 1 }}</button>
      </li>
    </ol>

    <div class="mt-4 rounded-lg border border-line bg-paper p-4" aria-live="polite">
      <p class="text-xs text-mute">ขั้นที่ {{ cur + 1 }} / 6</p>
      <h4 class="mt-1 text-lg font-semibold">{{ steps[cur]!.t }}</h4>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-7">
        <li v-for="w in steps[cur]!.what" :key="w">{{ w }}</li>
      </ul>
      <p class="mt-3 rounded border border-dashed border-ink p-2 text-sm leading-7"><span class="font-semibold">กับดัก:</span> {{ steps[cur]!.trap }}</p>
    </div>

    <div class="mt-3 flex flex-wrap gap-2 text-sm">
      <template v-if="done">
        <button type="button" class="min-h-10 rounded-md border border-ink bg-ink px-3 text-paper" @click="reset">เริ่มปัญหาใหม่</button>
      </template>
      <template v-else-if="cur === 2">
        <button type="button" class="min-h-10 rounded-md border border-ink bg-ink px-3 text-paper" @click="confirmed">ผลทดสอบยืนยันทฤษฎี → ขั้น 4</button>
        <button type="button" class="min-h-10 rounded-md border border-ink px-3" @click="disproved">ผลทดสอบหักล้าง → กลับขั้น 2</button>
      </template>
      <template v-else-if="cur === 4">
        <button type="button" class="min-h-10 rounded-md border border-ink bg-ink px-3 text-paper" @click="userYes">ผู้ใช้ยืนยันว่าใช้ได้ → ขั้น 6</button>
        <button type="button" class="min-h-10 rounded-md border border-ink px-3" @click="userNo">ผู้ใช้ยังมีปัญหา → กลับขั้น 2</button>
      </template>
      <template v-else-if="cur === 5">
        <button type="button" class="min-h-10 rounded-md border border-ink bg-ink px-3 text-paper" @click="finish">บันทึกครบ ปิดงาน</button>
      </template>
      <template v-else>
        <button type="button" class="min-h-10 rounded-md border border-ink bg-ink px-3 text-paper" @click="next">ขั้นถัดไป →</button>
      </template>
      <button type="button" class="min-h-10 rounded-md border border-line px-3 hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>

    <p class="mt-3 text-sm text-mute">ทฤษฎีที่ลองแล้ว: {{ tried }} · จำนวนครั้งที่ต้องวนกลับ: {{ loops }}</p>
    <ol class="mt-1 space-y-0.5 text-xs text-mute">
      <li v-for="(l, i) in log" :key="i">{{ l }}</li>
    </ol>
    <figcaption class="mt-3 text-sm text-mute">งานจริงมักวนหลายรอบ การวนกลับไปขั้น 2 เมื่อทฤษฎีผิด ไม่ใช่ความล้มเหลว แต่คือวิธีการทำงานปกติ</figcaption>
  </figure>
</template>
