<script setup lang="ts">
// เปรียบเทียบเส้นทางข้อมูล: SATA ถนนเส้นเดียวผ่านตัวควบคุม vs NVMe หลายเลนตรงเข้า CPU ผ่าน PCIe
const lanes = {
  sata: { tracks: 1, dur: 3.2, dots: 3 },
  nvme: { tracks: 4, dur: 0.7, dots: 4 },
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="space-y-5">
      <div v-for="k in (['sata', 'nvme'] as const)" :key="k" class="rounded-lg border border-line bg-paper p-3">
        <div class="flex flex-wrap items-baseline justify-between gap-1">
          <p class="text-sm font-semibold">{{ k === 'sata' ? 'SSD แบบ SATA (ต่อด้วยสาย)' : 'SSD แบบ M.2 NVMe (เสียบบนบอร์ด)' }}</p>
          <p class="text-sm"><strong>{{ k === 'sata' ? '~600 MB/s' : '7,000+ MB/s' }}</strong> <span class="text-mute">{{ k === 'sata' ? '(SATA III 6 Gbps)' : '(PCIe)' }}</span></p>
        </div>
        <div class="mt-3 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 text-center text-xs">
          <span class="rounded border-2 border-ink px-2 py-1">{{ k === 'sata' ? 'SSD' : 'SSD M.2' }}</span>
          <div class="space-y-1">
            <div v-for="t in lanes[k].tracks" :key="t" class="track relative h-1.5 overflow-hidden rounded-full bg-line">
              <i v-for="d in lanes[k].dots" :key="d" class="dot" :style="{ animationDuration: `${lanes[k].dur}s`, animationDelay: `${(-d * lanes[k].dur) / lanes[k].dots - t * 0.13}s` }" />
            </div>
            <p class="text-[10px] text-mute">{{ k === 'sata' ? 'สาย SATA (1 ทาง)' : 'PCIe 4 เลน' }}</p>
          </div>
          <span class="rounded border border-line px-2 py-1">{{ k === 'sata' ? 'ตัวควบคุม SATA' : 'CPU' }}</span>
          <template v-if="k === 'sata'">
            <div class="track relative h-1.5 overflow-hidden rounded-full bg-line">
              <i v-for="d in 3" :key="d" class="dot" :style="{ animationDuration: '3.2s', animationDelay: `${-d * 1.06}s` }" />
            </div>
            <span class="rounded border border-line px-2 py-1">CPU</span>
          </template>
        </div>
      </div>
    </div>
    <p class="mt-4 leading-8 text-ink/80">
      จุดที่วิ่งคือข้อมูล <strong>SATA</strong> ถูกออกแบบมาสำหรับ HDD จึงเป็นทางเดี่ยวและต้องผ่านตัวควบคุมก่อนถึง CPU ส่วน <strong>NVMe</strong> ต่อเข้า PCIe หลายเลนพร้อมกันและตรงกว่า ข้อมูลจึงไหลได้มากและเร็วกว่า
    </p>
    <figcaption class="mt-1 text-sm text-mute">แอนิเมชันแสดงหลักการ ไม่ใช่ความเร็วตามสัดส่วนจริง ตัวเลขเป็นค่าสูงสุดตามมาตรฐานโดยประมาณ</figcaption>
  </figure>
</template>

<style scoped>
.dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 100%;
  border-radius: 9999px;
  background: var(--ink);
  animation: travel linear infinite;
}
@keyframes travel {
  from {
    left: -10px;
  }
  to {
    left: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    left: 40%;
  }
}
</style>
