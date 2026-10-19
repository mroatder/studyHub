<script setup lang="ts">
// เทียบ MBR กับ GPT: เลื่อนขนาดดิสก์ดูว่าใช้พื้นที่ได้เท่าไร และดูจำนวนพาร์ทิชัน / การบูต
const mode = ref<'mbr' | 'gpt'>('mbr')
const tb = ref(4)
const MBR_LIMIT = 2

const usable = computed(() => (mode.value === 'mbr' ? Math.min(tb.value, MBR_LIMIT) : tb.value))
const wastedPct = computed(() => Math.round(((tb.value - usable.value) / tb.value) * 100))

const info = computed(() =>
  mode.value === 'mbr'
    ? {
        firmware: 'BIOS แบบเดิม (Legacy)',
        parts: 'สูงสุด 4 พาร์ทิชันหลัก (หรือ 3 + 1 extended)',
        backup: 'ตารางพาร์ทิชันอยู่ที่เดียว (ถ้าเสียก็เสียทั้งก้อน)',
        secure: 'ไม่รองรับ Secure Boot',
        blocks: ['MBR (512 ไบต์)', 'C: ระบบ', 'D: ข้อมูล'],
      }
    : {
        firmware: 'UEFI',
        parts: 'ได้ 128 พาร์ทิชันใน Windows',
        backup: 'มีสำเนาตารางที่ท้ายดิสก์ และมี CRC ตรวจความเสียหาย',
        secure: 'รองรับ Secure Boot',
        blocks: ['EFI (ESP)', 'Recovery', 'C: ระบบ', 'D: ข้อมูล'],
      },
)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="m in (['mbr', 'gpt'] as const)"
        :key="m"
        type="button"
        class="rounded-md border px-4 py-1.5 text-sm font-medium transition"
        :class="mode === m ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'"
        @click="mode = m"
      >{{ m.toUpperCase() }}</button>
      <span class="text-sm text-mute">{{ mode === 'mbr' ? 'Master Boot Record (รุ่นเก่า)' : 'GUID Partition Table (มาตรฐานปัจจุบัน)' }}</span>
    </div>

    <label class="mt-5 block text-sm">
      ขนาดดิสก์ <strong>{{ tb }} TB</strong>
      <input v-model.number="tb" type="range" min="0.5" max="8" step="0.5" class="mt-1 w-full accent-[var(--ink)]" />
    </label>

    <div class="mt-4">
      <div class="flex h-14 overflow-hidden rounded-lg border-2 border-ink bg-paper text-xs">
        <div class="flex min-w-0 items-center justify-center gap-px transition-[width] duration-500 motion-reduce:transition-none" :style="{ width: `${(usable / tb) * 100}%` }">
          <div v-for="(b, i) in info.blocks" :key="b" class="flex h-full flex-1 items-center justify-center overflow-hidden border-r border-line px-1 text-center last:border-r-0" :class="i === 0 ? 'bg-ink text-paper' : ''">{{ b }}</div>
        </div>
        <div v-if="wastedPct" class="hatch flex flex-1 items-center justify-center px-1 text-center font-medium">ใช้ไม่ได้ {{ tb - usable }} TB</div>
      </div>
      <p class="mt-2 text-sm" aria-live="polite">
        ใช้งานได้ <strong>{{ usable }} TB</strong> จาก {{ tb }} TB
        <span v-if="wastedPct" class="text-mute">· เสียพื้นที่ {{ wastedPct }}% เพราะ MBR อ้างตำแหน่งได้ไม่เกิน ~2 TB</span>
      </p>
    </div>

    <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">เฟิร์มแวร์ที่คู่กัน</dt><dd class="mt-1 font-medium">{{ info.firmware }}</dd></div>
      <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">จำนวนพาร์ทิชัน</dt><dd class="mt-1 font-medium">{{ info.parts }}</dd></div>
      <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">ความทนทานของตาราง</dt><dd class="mt-1 font-medium">{{ info.backup }}</dd></div>
      <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">ความปลอดภัยตอนบูต</dt><dd class="mt-1 font-medium">{{ info.secure }}</dd></div>
    </dl>
    <figcaption class="mt-3 text-sm text-mute">ผังเป็นภาพย่อเพื่อเข้าใจ ขนาดพาร์ทิชันจริงไม่ได้เป็นไปตามสัดส่วน ขีดจำกัด ~2 TB ของ MBR มาจากการใช้ตัวเลขตำแหน่งขนาด 32 บิต (ที่เซกเตอร์ละ 512 ไบต์)</figcaption>
  </figure>
</template>

<style scoped>
.hatch {
  background: repeating-linear-gradient(45deg, transparent 0 6px, var(--line) 6px 7px);
  color: var(--mute);
}
</style>
