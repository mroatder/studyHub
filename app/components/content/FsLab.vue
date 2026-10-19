<script setup lang="ts">
// ห้องทดลองระบบไฟล์: เลือก NTFS / exFAT / FAT32 แล้วกดทดลอง 3 สถานการณ์ ดูผลต่างกัน
type Fs = 'ntfs' | 'exfat' | 'fat32'
type Test = 'big' | 'acl' | 'crash'

const fs = ref<Fs>('ntfs')
const done = ref<Record<string, boolean>>({})

const names: Record<Fs, string> = { ntfs: 'NTFS', exfat: 'exFAT', fat32: 'FAT32' }
const tests: { id: Test; label: string }[] = [
  { id: 'big', label: 'คัดลอกไฟล์ 6 GB' },
  { id: 'acl', label: 'ตั้งสิทธิ์: ให้ Alice อ่านอย่างเดียว' },
  { id: 'crash', label: 'ไฟดับระหว่างเขียนไฟล์' },
]

const results: Record<Test, Record<Fs, { ok: boolean; text: string }>> = {
  big: {
    ntfs: { ok: true, text: 'สำเร็จ ขนาดไฟล์สูงสุดใหญ่มาก (เกินที่ดิสก์ทั่วไปจะมี)' },
    exfat: { ok: true, text: 'สำเร็จ ไม่มีเพดานขนาดไฟล์ในทางปฏิบัติ' },
    fat32: { ok: false, text: 'ล้มเหลว FAT32 รับไฟล์เดียวได้ไม่เกิน 4 GB (ลบ 1 ไบต์)' },
  },
  acl: {
    ntfs: { ok: true, text: 'ทำได้ NTFS เก็บ ACL ต่อไฟล์ จึงกำหนดสิทธิ์รายผู้ใช้ได้ละเอียด' },
    exfat: { ok: false, text: 'ทำไม่ได้ exFAT ไม่เก็บ ACL ใครต่อดิสก์ก็เปิดอ่านและแก้ไขได้' },
    fat32: { ok: false, text: 'ทำไม่ได้ FAT32 ไม่มีกลไกสิทธิ์ระดับไฟล์' },
  },
  crash: {
    ntfs: { ok: true, text: 'กู้ได้ NTFS จดบันทึก (journal) ก่อนแก้ไข รีบูตแล้วย้อนหรือทำซ้ำรายการที่ค้างให้โครงสร้างกลับมาสอดคล้อง' },
    exfat: { ok: false, text: 'เสี่ยง ไม่มี journal ตารางไฟล์อาจค้างครึ่งๆ กลางๆ ต้องรัน chkdsk และอาจสูญเสียไฟล์' },
    fat32: { ok: false, text: 'เสี่ยง ไม่มี journal ตาราง FAT อาจเสียหาย (ไฟล์กลายเป็นชิ้นส่วนที่ไม่มีเจ้าของ)' },
  },
}

function run(t: Test) {
  done.value = { ...done.value, [`${fs.value}:${t}`]: true }
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2" role="tablist" aria-label="ระบบไฟล์">
      <button
        v-for="f in (['ntfs', 'exfat', 'fat32'] as const)"
        :key="f"
        type="button"
        role="tab"
        :aria-selected="fs === f"
        class="rounded-md border px-4 py-1.5 text-sm font-medium transition"
        :class="fs === f ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'"
        @click="fs = f"
      >{{ names[f] }}</button>
    </div>
    <p class="mt-3 text-sm text-mute">เลือกระบบไฟล์ แล้วกดทดลองแต่ละสถานการณ์</p>

    <ul class="mt-3 space-y-2">
      <li v-for="t in tests" :key="t.id" class="rounded-lg border border-line bg-paper p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-medium">{{ t.label }}</span>
          <button type="button" class="rounded-md border border-ink px-3 py-1 text-sm transition hover:bg-ink hover:text-paper" @click="run(t.id)">ทดลอง</button>
        </div>
        <Transition name="pop">
          <p v-if="done[`${fs}:${t.id}`]" :key="fs + t.id" class="mt-2 flex items-start gap-2 text-sm leading-7" aria-live="polite">
            <span
              class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
              :class="results[t.id][fs].ok ? 'border-ink bg-ink text-paper' : 'border-ink'"
            >{{ results[t.id][fs].ok ? '✓' : '✕' }}</span>
            <span>{{ results[t.id][fs].text }}</span>
          </p>
        </Transition>
      </li>
    </ul>
    <figcaption class="mt-3 text-sm text-mute">สรุปคือ ดิสก์ระบบของ Windows ต้องเป็น NTFS ส่วน exFAT เหมาะแฟลชไดรฟ์/การ์ดที่ต้องใช้ข้ามระบบและมีไฟล์ใหญ่ FAT32 เหลือใช้เฉพาะอุปกรณ์เก่าหรือพาร์ทิชัน EFI</figcaption>
  </figure>
</template>

<style scoped>
.pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
@media (prefers-reduced-motion: reduce) {
  .pop-enter-active {
    transition: none;
  }
}
</style>
