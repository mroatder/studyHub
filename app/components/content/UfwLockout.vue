<script setup lang="ts">
// จำลองการตั้งไฟร์วอลล์บนเซิร์ฟเวอร์ที่ SSH เข้าอยู่ ลำดับคำสั่งผิด = ถูกล็อกออก
const allowFirst = ref(false)
const state = ref<'idle' | 'ok' | 'locked'>('idle')
const log = ref<string[]>([])

function run() {
  log.value = ['$ sudo ufw default deny incoming', '$ sudo ufw default allow outgoing']
  if (allowFirst.value) {
    log.value.push('$ sudo ufw allow ssh', '$ sudo ufw enable', 'Firewall is active and enabled on system startup')
    state.value = 'ok'
  } else {
    log.value.push('$ sudo ufw enable', 'Firewall is active and enabled on system startup', '... client_loop: send disconnect: Connection reset')
    state.value = 'locked'
  }
}
function reset() {
  state.value = 'idle'
  log.value = []
}
watch(allowFirst, reset)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <input v-model="allowFirst" type="checkbox" class="accent-[var(--ink)]" />
      รัน <code class="rounded border border-line px-1.5 py-0.5 font-mono text-xs">ufw allow ssh</code> ก่อนเปิดไฟร์วอลล์
    </label>

    <div class="mt-4 grid items-center gap-3 text-center text-sm sm:grid-cols-[1fr_auto_1fr]">
      <div class="rounded-lg border border-line bg-paper p-3"><p class="font-medium">แล็ปท็อปของคุณ</p><p class="text-xs text-mute">ssh sysadmin@server</p></div>
      <div class="relative mx-auto h-8 w-24 sm:w-32">
        <div class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 transition" :class="state === 'locked' ? 'border-t-2 border-dashed border-mute bg-transparent' : 'bg-ink'" />
        <span v-if="state === 'locked'" class="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-paper text-sm font-bold">✕</span>
        <span v-else-if="state === 'ok'" class="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">✓</span>
      </div>
      <div class="rounded-lg border-2 border-ink bg-paper p-3"><p class="font-medium">เซิร์ฟเวอร์ Linux</p><p class="text-xs text-mute">ufw: {{ state === 'idle' ? 'ยังไม่เปิด' : 'เปิดอยู่ (ปฏิเสธขาเข้า)' }}</p></div>
    </div>

    <div class="mt-4 flex gap-2">
      <button type="button" class="rounded-md border border-ink px-3 py-1.5 text-sm transition hover:bg-ink hover:text-paper" @click="run">รันชุดคำสั่ง</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 text-sm transition hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>
    <pre v-if="log.length" class="mt-3 overflow-x-auto rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-6">{{ log.join('\n') }}</pre>
    <p class="mt-3 min-h-6 text-sm leading-7" aria-live="polite">
      <template v-if="state === 'locked'"><strong>ถูกล็อกออก!</strong> ไฟร์วอลล์ปฏิเสธทุกขาเข้ารวมพอร์ต 22 ที่ SSH ใช้ ผู้ดูแลต้องไปนั่งหน้าเครื่องหรือใช้คอนโซลของผู้ให้บริการคลาวด์เพื่อแก้</template>
      <template v-else-if="state === 'ok'"><strong>ปลอดภัย</strong> พอร์ต 22 ถูกอนุญาตไว้ก่อนแล้ว ขาเข้าอื่นถูกบล็อก การเชื่อมต่อของคุณจึงไม่ขาด</template>
    </p>
  </figure>
</template>
