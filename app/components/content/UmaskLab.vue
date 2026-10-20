<script setup lang="ts">
// umask คือ "สิทธิ์ที่ต้องปิด" ตอนสร้างไฟล์ใหม่ ไฟล์เริ่มที่ 666 โฟลเดอร์เริ่มที่ 777 แล้วเอาบิตของ umask ออก
const presets = ['000', '002', '022', '027', '077']
const umask = ref('022')

const digits = computed(() => [...umask.value].map(Number))
const calc = (base: number) => digits.value.map((u) => base & ~u & 7)
const fileDigits = computed(() => calc(6))
const dirDigits = computed(() => calc(7))
const sym = (d: number) => `${d & 4 ? 'r' : '-'}${d & 2 ? 'w' : '-'}${d & 1 ? 'x' : '-'}`
const full = (arr: number[]) => arr.map(sym).join('')
const notes: Record<string, string> = {
  '000': 'ไม่ปิดสิทธิ์อะไรเลย ไฟล์ใหม่ใครก็แก้ได้ ไม่ควรใช้',
  '002': 'ปิดแค่การเขียนของ "คนอื่น" นิยมในระบบที่ทำงานร่วมกันเป็นกลุ่ม',
  '022': 'ค่าเริ่มต้นที่พบบ่อย กลุ่มและคนอื่นอ่านได้แต่แก้ไม่ได้',
  '027': 'กลุ่มอ่านได้ คนอื่นไม่มีสิทธิ์เลย เหมาะกับเซิร์ฟเวอร์ที่เข้มงวดขึ้น',
  '077': 'เฉพาะเจ้าของเท่านั้นที่เข้าถึงได้ เหมาะกับข้อมูลส่วนตัว',
}
const ok = computed(() => /^[0-7]{3}$/.test(umask.value))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <label for="umask-in" class="text-mute">umask</label>
      <input id="umask-in" v-model="umask" type="text" inputmode="numeric" maxlength="3" class="w-20 rounded-md border border-line bg-paper px-2 py-1.5 text-center font-mono outline-none focus:border-ink" />
      <button v-for="p in presets" :key="p" type="button" class="rounded-md border px-2.5 py-1.5 font-mono text-xs transition" :class="umask === p ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'" @click="umask = p">{{ p }}</button>
    </div>
    <p v-if="!ok" class="mt-3 text-sm text-mute">ใส่เลขฐานแปด 3 หลัก (0-7)</p>
    <template v-else>
      <div class="mt-4 grid gap-4 md:grid-cols-2" aria-live="polite">
        <div class="rounded-lg border border-line bg-paper p-3 text-sm">
          <p class="text-xs text-mute">ไฟล์ใหม่ (เริ่มที่ 666 ไม่มี x อัตโนมัติ)</p>
          <p class="mt-2 font-mono">666 − umask {{ umask }} → <span class="font-semibold">{{ fileDigits.join('') }}</span></p>
          <p class="mt-1 font-mono text-xs text-mute">-{{ full(fileDigits) }}</p>
        </div>
        <div class="rounded-lg border border-line bg-paper p-3 text-sm">
          <p class="text-xs text-mute">โฟลเดอร์ใหม่ (เริ่มที่ 777)</p>
          <p class="mt-2 font-mono">777 − umask {{ umask }} → <span class="font-semibold">{{ dirDigits.join('') }}</span></p>
          <p class="mt-1 font-mono text-xs text-mute">d{{ full(dirDigits) }}</p>
        </div>
      </div>
      <p class="mt-3 text-sm leading-7">{{ notes[umask] ?? 'ลองเทียบกับค่าสำเร็จรูปด้านบน' }}</p>
    </template>
    <figcaption class="mt-3 text-sm text-mute">"ลบ" ในที่นี้คือปิดบิต (ไม่ใช่ลบเลขตรงๆ เสมอไป) เช่น 6 กับ umask 5 ได้ 2 เพราะบิต r และ x ถูกปิด แต่บิต w ยังอยู่</figcaption>
  </figure>
</template>
