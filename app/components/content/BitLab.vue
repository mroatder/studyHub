<script setup lang="ts">
// สลับบิตทีละตัว ดูค่าในฐานสอง/สิบ/สิบหก, two's complement (เลขติดลบ) และรหัสตัวอักษร ASCII
const bits = ref<number[]>([0, 1, 0, 0, 0, 0, 0, 1])
const note = ref('')

const value = computed(() => bits.value.reduce((n, b) => n * 2 + b, 0))
const signed = computed(() => (value.value >= 128 ? value.value - 256 : value.value))
const hex = computed(() => value.value.toString(16).toUpperCase().padStart(2, '0'))
const ascii = computed(() => (value.value >= 32 && value.value <= 126 ? String.fromCharCode(value.value) : value.value === 32 ? 'ช่องว่าง' : '(ไม่ใช่ตัวอักษรที่พิมพ์ได้)'))

function set(n: number) {
  const v = ((n % 256) + 256) % 256
  bits.value = v.toString(2).padStart(8, '0').split('').map(Number)
}
function toggle(i: number) {
  bits.value = bits.value.map((b, k) => (k === i ? 1 - b : b))
  note.value = ''
}
function add(d: number) {
  const before = value.value
  const sBefore = signed.value
  set(before + d)
  if (d > 0 && before === 255) note.value = 'ล้น (overflow): 255 + 1 ครบ 8 บิต ได้ 0 เพราะบิตที่ 9 ไม่มีที่เก็บ'
  else if (d > 0 && sBefore === 127) note.value = 'ถ้าตีความเป็นเลขมีเครื่องหมาย 127 + 1 กลายเป็น -128 (ล้นฝั่งบวก)'
  else if (d < 0 && before === 0) note.value = 'ลบจาก 0 วนไป 255 (11111111) ถ้าตีความมีเครื่องหมายก็คือ -1'
  else note.value = ''
}
function invert() {
  bits.value = bits.value.map((b) => 1 - b)
  note.value = 'กลับทุกบิต (NOT) แล้วบวก 1 = เปลี่ยนเครื่องหมายของเลข (นี่คือวิธีหา -x แบบ two’s complement)'
}
function shift() {
  set(value.value * 2)
  note.value = 'เลื่อนบิตไปซ้าย 1 ตำแหน่ง = คูณ 2 (บิตซ้ายสุดที่หลุดไปหายไป)'
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex justify-center gap-1.5 sm:gap-2" role="group" aria-label="แปดบิต กดเพื่อสลับ 0/1">
      <button v-for="(b, i) in bits" :key="i" type="button" class="flex h-14 w-9 flex-col items-center justify-center rounded-md border font-mono transition sm:h-16 sm:w-11" :class="b ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'" :aria-label="`บิตที่มีน้ำหนัก ${2 ** (7 - i)} ค่า ${b}`" :aria-pressed="b === 1" @click="toggle(i)">
        <span class="text-xl">{{ b }}</span>
        <span class="text-[10px] opacity-70">{{ 2 ** (7 - i) }}</span>
      </button>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ฐานสิบ (ไม่มีเครื่องหมาย)</p><p class="font-mono text-lg">{{ value }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">มีเครื่องหมาย (two’s complement)</p><p class="font-mono text-lg">{{ signed }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ฐานสิบหก</p><p class="font-mono text-lg">0x{{ hex }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ถ้าเป็นรหัส ASCII</p><p class="font-mono text-lg">{{ ascii }}</p></div>
    </div>

    <div class="mt-3 flex flex-wrap gap-2 text-sm">
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="add(1)">+1</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="add(-1)">−1</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="shift">เลื่อนซ้าย (×2)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="invert">กลับบิต (NOT)</button>
      <button type="button" class="ml-auto rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="set(65); note = ''">ตั้งเป็น 'A' (65)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="set(127); note = ''">127</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="set(255); note = ''">255</button>
    </div>
    <p class="mt-3 min-h-6 text-sm leading-7" aria-live="polite">{{ note || 'บิตชุดเดียวกันตีความได้หลายแบบ ขึ้นกับว่าโปรแกรมกำหนดว่าเป็นเลข ตัวอักษร หรือคำสั่ง' }}</p>
    <figcaption class="mt-1 text-sm text-mute">ตัวเลขน้ำหนักใต้แต่ละบิตคือ 128, 64, 32, 16, 8, 4, 2, 1 · จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
