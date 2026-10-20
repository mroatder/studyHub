<script setup lang="ts">
// ดิสก์ว่างหลาย GB แต่ inode หมด → สร้างไฟล์ไม่ได้ (ตัวเลขสมมติ: 50 GB, 1,000,000 inode, บล็อก 4 KB)
const diskGb = 50
const inodeTotal = 1_000_000
const blockKb = 4

const smallFiles = ref(0) // จำนวนไฟล์เล็ก
const bigGb = ref(0)
const touchResult = ref('')

const inodeUsed = computed(() => 12_000 + smallFiles.value) // 12,000 = ไฟล์ระบบเดิม
const usedGb = computed(() => 8 + (smallFiles.value * blockKb) / 1024 / 1024 + bigGb.value)
const freeGb = computed(() => Math.max(0, diskGb - usedGb.value))
const inodeFull = computed(() => inodeUsed.value >= inodeTotal)
const spaceFull = computed(() => freeGb.value <= 0.05)

const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)
const pctSpace = computed(() => Math.min(100, Math.round((usedGb.value / diskGb) * 100)))
const pctInode = computed(() => Math.min(100, Math.round((inodeUsed.value / inodeTotal) * 100)))

function addSmall() {
  smallFiles.value = Math.min(inodeTotal - 12_000, smallFiles.value + 150_000)
  touchResult.value = ''
}
function addBig() {
  bigGb.value = Math.min(diskGb - 8, bigGb.value + 10)
  touchResult.value = ''
}
function reset() {
  smallFiles.value = 0
  bigGb.value = 0
  touchResult.value = ''
}
function touchTest() {
  touchResult.value = inodeFull.value || spaceFull.value ? 'touch: cannot touch test.txt: No space left on device' : '(สำเร็จ ไม่มีข้อความ)'
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2 text-sm">
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="addSmall">+ ไฟล์เล็ก 150,000 ไฟล์ (เช่น session/cache)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="addBig">+ ไฟล์ใหญ่ 10 GB</button>
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper" @click="touchTest">$ touch test.txt</button>
      <button type="button" class="ml-auto rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="font-mono text-sm">$ df -h /</p>
        <p class="mt-1 font-mono text-xs text-mute">ขนาด {{ diskGb }}G · ใช้ {{ f1(usedGb) }}G · ว่าง {{ f1(freeGb) }}G · {{ pctSpace }}%</p>
        <div class="mt-2 h-3 overflow-hidden rounded bg-soft" role="img" :aria-label="`พื้นที่ใช้ไป ${pctSpace} เปอร์เซ็นต์`"><div class="h-full bg-ink transition-all duration-300 motion-reduce:transition-none" :style="{ width: pctSpace + '%' }" /></div>
      </div>
      <div class="rounded-lg border bg-paper p-3" :class="inodeFull ? 'border-ink' : 'border-line'">
        <p class="font-mono text-sm">$ df -i /</p>
        <p class="mt-1 font-mono text-xs text-mute">inode ทั้งหมด {{ inodeTotal.toLocaleString() }} · ใช้ {{ inodeUsed.toLocaleString() }} · {{ pctInode }}%</p>
        <div class="mt-2 h-3 overflow-hidden rounded bg-soft" role="img" :aria-label="`inode ใช้ไป ${pctInode} เปอร์เซ็นต์`"><div class="h-full bg-ink transition-all duration-300 motion-reduce:transition-none" :style="{ width: pctInode + '%' }" /></div>
      </div>
    </div>

    <p v-if="touchResult" class="mt-3 break-all rounded-lg border border-line bg-paper p-3 font-mono text-sm" aria-live="polite">{{ touchResult }}</p>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <p v-if="inodeFull && !spaceFull"><strong>นี่คือเหตุการณ์ในโจทย์:</strong> พื้นที่ยังว่าง {{ f1(freeGb) }} GB แต่ inode หมด ทุกไฟล์ใหม่ต้องใช้ 1 inode จึงสร้างไม่ได้ ไฟล์เล็กๆ จำนวนมากกินจำนวน inode ไม่ใช่พื้นที่ ทางแก้: หาโฟลเดอร์ที่มีไฟล์เป็นแสนๆ แล้วลบ/ตั้ง cron ล้างไฟล์เก่า</p>
      <p v-else-if="spaceFull && !inodeFull"><strong>พื้นที่เต็มแบบปกติ:</strong> <code>df -h</code> เห็นเต็ม 100% ใช้ <code>du -sh</code> หาโฟลเดอร์ที่กินที่</p>
      <p v-else-if="spaceFull && inodeFull"><strong>เต็มทั้งสองอย่าง</strong> ต้องแก้ทั้งขนาดและจำนวนไฟล์</p>
      <p v-else>กดเพิ่มไฟล์เล็กหลายๆ ครั้ง แล้วดูว่า <code>df -h</code> ยังสบาย แต่ <code>df -i</code> ค่อยๆ เต็ม จากนั้นกด <code>touch test.txt</code></p>
    </div>
    <figcaption class="mt-3 text-sm text-mute">ตัวเลขสมมติ (ดิสก์ 50 GB, 1,000,000 inode, บล็อก 4 KB) ระบบจริงอาจต่างกันตามชนิดระบบไฟล์ จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
