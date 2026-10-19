<script setup lang="ts">
// ลำดับเหตุการณ์ตอนติดตั้ง Windows ระหว่าง 4 ผู้เล่น: ช่างเทคนิค / WinPE / ดิสก์ / OOBE
const actors = ['ช่างเทคนิค', 'Windows Setup (WinPE)', 'ดิสก์ (GPT/NTFS)', 'OOBE']
const msgs = [
  { from: 0, to: 1, title: 'บูตจาก USB / PXE แล้วส่งค่าตั้งต้น', text: 'เฟิร์มแวร์ UEFI โหลด WinPE ซึ่งเป็น Windows ย่อส่วนที่รันจากหน่วยความจำ ช่างเลือกภาษา รุ่น (edition) และคีย์ หรือป้อนผ่าน unattend.xml' },
  { from: 1, to: 2, title: 'สร้างโครงสร้าง GPT และฟอร์แมต NTFS', text: 'Setup เขียนตารางพาร์ทิชัน สร้างพาร์ทิชัน EFI, Recovery และพาร์ทิชันระบบ แล้วฟอร์แมตเป็น NTFS (EFI เป็น FAT32)' },
  { from: 1, to: 2, title: 'นำ install.wim มากางลงดิสก์ พร้อมไฟล์บูต', text: 'ไฟล์ image ที่บีบอัดอยู่ถูกแตกลงพาร์ทิชันระบบ และคัดลอกไฟล์บูตที่ UEFI ต้องใช้ไปไว้ใน EFI' },
  { from: 2, to: 3, title: 'รีบูตเข้าระบบที่เพิ่งติดตั้ง', text: 'คราวนี้บูตจากดิสก์ ไม่ใช่ USB เครื่องเข้าสู่ขั้นเตรียมเฉพาะเครื่อง (specialize) แล้วเปิด OOBE' },
  { from: 3, to: 0, title: 'ถามเครือข่าย บัญชี และความเป็นส่วนตัว', text: 'ช่างเชื่อม Wi-Fi/Ethernet สร้างบัญชีในเครื่องหรือเข้าด้วย Entra ID / โดเมน และเลือกระดับ telemetry และตำแหน่ง' },
  { from: 0, to: 3, title: 'ยืนยันค่า เสร็จสิ้นการตั้งค่า', text: 'OOBE สร้างโปรไฟล์ผู้ใช้ครั้งแรก แล้วแสดงเดสก์ท็อป ขั้นต่อไปคือติดตั้งไดรเวอร์และอัปเดต' },
]
const s = useStepper(computed(() => msgs.length), 4000)
const cur = computed(() => msgs[s.index.value]!)
const x = (i: number) => 60 + i * 160
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="overflow-x-auto">
      <svg viewBox="0 0 700 330" class="mx-auto min-w-[560px] w-full" role="img" aria-label="แผนผังลำดับเหตุการณ์ติดตั้ง Windows">
        <g v-for="(a, i) in actors" :key="a">
          <rect :x="x(i) - 62" y="8" width="124" height="34" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" />
          <text :x="x(i)" y="29" text-anchor="middle" font-size="11" fill="var(--ink)">{{ a }}</text>
          <line :x1="x(i)" y1="42" :x2="x(i)" y2="320" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4 4" />
        </g>
        <g v-for="(m, i) in msgs" :key="i" :opacity="i <= s.index.value ? 1 : 0.18" class="msg">
          <line :x1="x(m.from)" :y1="72 + i * 44" :x2="x(m.to)" :y2="72 + i * 44" :stroke="i === s.index.value ? 'var(--ink)' : 'var(--mute)'" :stroke-width="i === s.index.value ? 3 : 1.5" />
          <path :d="`M ${x(m.to)} ${72 + i * 44} l ${m.to > m.from ? -9 : 9} -5 v 10 z`" :fill="i === s.index.value ? 'var(--ink)' : 'var(--mute)'" />
          <circle :cx="Math.min(x(m.from), x(m.to)) + 14" :cy="72 + i * 44 - 12" r="9" :fill="i === s.index.value ? 'var(--ink)' : 'var(--paper)'" stroke="var(--ink)" />
          <text :x="Math.min(x(m.from), x(m.to)) + 14" :y="72 + i * 44 - 8.5" text-anchor="middle" font-size="10" :fill="i === s.index.value ? 'var(--paper)' : 'var(--ink)'">{{ i + 1 }}</text>
        </g>
      </svg>
    </div>
    <div class="mt-3 min-h-28" aria-live="polite">
      <p class="text-sm font-medium text-mute">ขั้นที่ {{ s.index.value + 1 }} / {{ msgs.length }}</p>
      <Transition name="fade" mode="out-in">
        <div :key="s.index.value">
          <h4 class="mt-1 text-lg font-semibold">{{ cur.title }}</h4>
          <p class="mt-1 leading-8 text-ink/80">{{ cur.text }}</p>
        </div>
      </Transition>
    </div>
    <AnimControls class="mt-3" :playing="s.playing.value" :is-first="s.isFirst.value" :is-last="s.isLast.value" @toggle="s.toggle" @prev="s.prev" @next="s.next" @reset="s.reset" />
  </figure>
</template>

<style scoped>
.msg {
  transition: opacity 0.4s ease;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .msg,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
