<script setup lang="ts">
// เกมเรียงงานหลังติดตั้ง Windows: กดงานตามลำดับที่ควรทำ ถ้าผิดจะบอกว่าต้องทำอะไรก่อน
const order = [
  { t: 'เชื่อมต่อเครือข่าย', why: 'ต้องออนไลน์ก่อน จึงจะดึงอัปเดตและไดรเวอร์ได้' },
  { t: 'ติดตั้งไดรเวอร์จากผู้ผลิต (ชิปเซ็ต, การ์ดจอ, เครือข่าย)', why: 'ไดรเวอร์ทั่วไปมีฟังก์ชันจำกัด และการอัปเดตบางส่วนต้องการไดรเวอร์ที่ถูกต้อง' },
  { t: 'รัน Windows Update ให้ครบ (รีบูตซ้ำจนไม่มีรายการ)', why: 'ปิดช่องโหว่ที่รู้แล้วก่อนเปิดใช้งานจริง' },
  { t: 'ตรวจว่า Defender / ไฟร์วอลล์ / ซอฟต์แวร์ป้องกันทำงาน', why: 'เปิดการป้องกันให้ครบก่อนติดตั้งโปรแกรมหรือเปิดไฟล์ใดๆ' },
  { t: 'สร้างบัญชีผู้ใช้ปกติสำหรับใช้งานประจำ (ไม่ใช้แอดมิน)', why: 'ใช้สิทธิ์ต่ำในชีวิตประจำวัน ลดความเสียหายถ้าโดนมัลแวร์' },
  { t: 'เปิดการเข้ารหัสดิสก์ (BitLocker) และสำรองรหัสกู้คืน', why: 'ปกป้องข้อมูลถ้าเครื่องหาย ควรเปิดก่อนใส่ข้อมูลสำคัญ' },
  { t: 'ตั้งค่า Power plan ให้เหมาะกับบทบาทเครื่อง', why: 'เซิร์ฟเวอร์ต้องไม่หลับ แล็ปท็อปต้องประหยัดแบตเตอรี่' },
  { t: 'สร้างจุดกู้คืนหรือ image สำรองของระบบที่ตั้งค่าเสร็จ', why: 'เก็บสถานะที่ดีไว้ย้อนกลับ ทำเป็นขั้นสุดท้าย' },
]

// สลับลำดับแบบคงที่เพื่อไม่ให้ SSR กับ client ต่างกัน
const shuffled = [3, 6, 0, 7, 2, 5, 1, 4].map((i) => ({ i, ...order[i]! }))
const next = ref(0)
const picked = ref<number[]>([])
const hint = ref('')
const wrong = ref<number | null>(null)

function pick(i: number) {
  if (picked.value.includes(i)) return
  if (i === next.value) {
    picked.value = [...picked.value, i]
    next.value++
    hint.value = ''
  } else {
    wrong.value = i
    hint.value = `ยังไม่ใช่ตอนนี้ ลองนึกว่า "${order[next.value]!.t}" ควรทำก่อนหรือไม่`
    setTimeout(() => (wrong.value = null), 450)
  }
}
function reset() {
  next.value = 0
  picked.value = []
  hint.value = ''
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm font-medium text-mute">กดงานตามลำดับที่ควรทำ ({{ next }} / {{ order.length }})</p>
    <div class="mt-3 grid gap-2 lg:grid-cols-2">
      <div>
        <p class="mb-2 text-xs uppercase tracking-wide text-mute">งานที่ต้องทำ</p>
        <ul class="space-y-2">
          <li v-for="o in shuffled" :key="o.i">
            <button
              type="button"
              class="w-full rounded-lg border bg-paper px-3 py-2 text-left text-sm transition disabled:opacity-30"
              :class="[wrong === o.i ? 'shake border-ink' : 'border-line hover:border-ink']"
              :disabled="picked.includes(o.i)"
              @click="pick(o.i)"
            >{{ o.t }}</button>
          </li>
        </ul>
      </div>
      <div>
        <p class="mb-2 text-xs uppercase tracking-wide text-mute">ลำดับของคุณ</p>
        <ol class="space-y-2">
          <li v-for="(p, n) in picked" :key="p" class="rounded-lg border-2 border-ink bg-paper px-3 py-2 text-sm">
            <span class="font-semibold">{{ n + 1 }}.</span> {{ order[p]!.t }}
            <span class="mt-1 block text-xs leading-6 text-mute">{{ order[p]!.why }}</span>
          </li>
          <li v-if="!picked.length" class="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-mute">ยังไม่ได้เลือก</li>
        </ol>
      </div>
    </div>
    <p class="mt-3 min-h-6 text-sm" aria-live="polite">
      <template v-if="next === order.length"><strong>ครบแล้ว!</strong> ลำดับนี้คือหลักการ "เชื่อมต่อ → ซ่อมช่องโหว่ → ป้องกัน → ลดสิทธิ์ → เข้ารหัส → ปรับแต่ง → สำรอง"</template>
      <template v-else>{{ hint }}</template>
    </p>
    <button type="button" class="mt-2 rounded-md border border-line px-3 py-1.5 text-sm transition hover:border-ink" @click="reset">เริ่มใหม่</button>
    <figcaption class="mt-3 text-sm text-mute">ในงานจริงบางข้ออาจสลับกันได้ (เช่น ไดรเวอร์กับอัปเดต) แบบฝึกนี้ใช้ลำดับที่อธิบายเหตุผลได้ง่ายที่สุด</figcaption>
  </figure>
</template>

<style scoped>
.shake {
  animation: shake 0.4s;
}
@keyframes shake {
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .shake {
    animation: none;
  }
}
</style>
