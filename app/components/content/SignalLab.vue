<script setup lang="ts">
// เทียบ kill (SIGTERM 15) กับ kill -9 (SIGKILL 9) กับโปรเซสที่เขียนข้อมูลผ่าน buffer (จำลอง)
const hung = ref(false)
const alive = ref(true)
const buffered = ref(12) // ระเบียนที่ยังอยู่ใน RAM ยังไม่ลงดิสก์
const onDisk = ref(40)
const log = ref<string[]>(['โปรเซส worker (PID 1841) รันอยู่ · ระเบียนบนดิสก์ 40 · ค้างใน buffer 12'])

function send(sig: 15 | 9) {
  if (!alive.value) return
  if (sig === 15) {
    log.value.push('$ kill 1841   (ส่ง SIGTERM)')
    if (hung.value) {
      log.value.push('โปรเซสค้างอยู่ ไม่ได้อ่านสัญญาณ → ยังรันอยู่')
    } else {
      onDisk.value += buffered.value
      log.value.push(`โปรแกรมรับสัญญาณ เขียน buffer ${buffered.value} ระเบียนลงดิสก์ ปิดไฟล์ แล้วออกเอง`)
      buffered.value = 0
      alive.value = false
    }
  } else {
    log.value.push('$ kill -9 1841   (ส่ง SIGKILL)')
    log.value.push(`เคอร์เนลยุติทันที โปรแกรมไม่ได้ทำอะไรต่อ${buffered.value ? ` → ระเบียน ${buffered.value} รายการใน buffer หาย` : ''}`)
    buffered.value = 0
    alive.value = false
  }
}
function reset() {
  alive.value = true
  buffered.value = 12
  onDisk.value = 40
  log.value = ['โปรเซส worker (PID 1841) รันอยู่ · ระเบียนบนดิสก์ 40 · ค้างใน buffer 12']
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper disabled:opacity-40" :disabled="!alive" @click="send(15)">kill 1841 (SIGTERM 15)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink disabled:opacity-40" :disabled="!alive" @click="send(9)">kill -9 1841 (SIGKILL 9)</button>
      <label class="ml-auto flex items-center gap-2"><input v-model="hung" type="checkbox" class="accent-current" :disabled="!alive" /> โปรเซสค้าง (ไม่ตอบ SIGTERM)</label>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-3">
      <div class="rounded-lg border p-3 text-sm" :class="alive ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-mute'">
        <p class="text-xs opacity-70">สถานะโปรเซส</p>
        <p class="font-mono">{{ alive ? 'รันอยู่' : 'ปิดแล้ว' }}</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="text-xs text-mute">ข้อมูลใน buffer (RAM) ยังไม่ลงดิสก์</p>
        <p class="font-mono">{{ buffered }} ระเบียน</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="text-xs text-mute">ข้อมูลที่ปลอดภัยบนดิสก์</p>
        <p class="font-mono">{{ onDisk }} ระเบียน</p>
      </div>
    </div>

    <ul class="mt-3 grid gap-1 rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-6 sm:text-sm" aria-live="polite">
      <li v-for="(l, i) in log" :key="i" class="break-words">{{ l }}</li>
    </ul>

    <p class="mt-3 text-sm leading-7">
      <strong>ข้อคิด:</strong> SIGTERM เป็นการ "ขอ" ให้ปิด โปรแกรมจัดการเก็บกวาดก่อนออกได้ SIGKILL เคอร์เนลตัดจบเองโดยโปรแกรมไม่มีโอกาสรับรู้ จึงเป็นทางเลือกสุดท้าย ลองกด -9 ตั้งแต่แรกแล้วดู buffer
    </p>
    <figcaption class="mt-3 text-sm text-mute">จำลองในหน้าเว็บ ไม่ได้ส่งสัญญาณจริง ตัวเลขสมมติ</figcaption>
  </figure>
</template>
