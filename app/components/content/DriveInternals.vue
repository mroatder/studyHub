<script setup lang="ts">
// HDD ต้องหมุนจานและเลื่อนแขนไปหาข้อมูล ส่วน SSD เข้าถึงเซลล์ใดก็ได้ทันที กดเพื่อลองอ่านข้อมูล 3 ตำแหน่งสุ่ม
const reads = [
  { angle: -9, cell: 5 },
  { angle: 11, cell: 21 },
  { angle: -2, cell: 12 },
]
const hddAngle = ref(0)
const ssdCell = ref(-1)
const done = ref(0)
const running = ref(false)
let timers: ReturnType<typeof setTimeout>[] = []

function run() {
  if (running.value) return
  running.value = true
  done.value = 0
  hddAngle.value = 0
  ssdCell.value = -1
  reads.forEach((r, i) => {
    timers.push(
      setTimeout(() => {
        hddAngle.value = r.angle
        ssdCell.value = r.cell
        done.value = i + 1
        if (i === reads.length - 1) timers.push(setTimeout(() => (running.value = false), 900))
      }, 400 + i * 1100),
    )
  })
}
onBeforeUnmount(() => timers.forEach(clearTimeout))

const hddTime = computed(() => (done.value * 8).toString())
const ssdTime = computed(() => (done.value * 0.08).toFixed(2))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-4 sm:grid-cols-2">
      <!-- HDD -->
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-sm font-semibold">HDD <span class="font-normal text-mute">จานหมุน + แขนอ่าน</span></p>
        <svg viewBox="0 0 200 150" class="mt-2 w-full" role="img" aria-label="ภาพตัดของ HDD แบบย่อ">
          <g class="platter">
            <circle cx="90" cy="80" r="62" class="fill-soft stroke-ink" stroke-width="1.5" />
            <circle cx="90" cy="80" r="44" fill="none" class="stroke-line" />
            <circle cx="90" cy="80" r="28" fill="none" class="stroke-line" />
            <line x1="90" y1="80" x2="90" y2="22" class="stroke-ink" stroke-width="1.5" />
          </g>
          <circle cx="90" cy="80" r="6" class="fill-ink" />
          <g :style="{ transform: `rotate(${hddAngle}deg)`, transformOrigin: '186px 24px' }" class="arm">
            <line x1="186" y1="24" x2="104" y2="76" class="stroke-ink" stroke-width="4" stroke-linecap="round" />
            <circle cx="104" cy="76" r="4" class="fill-paper stroke-ink" stroke-width="1.5" />
          </g>
          <circle cx="186" cy="24" r="5" class="fill-ink" />
        </svg>
        <p class="text-sm">รอทั้งจานหมุนและแขนเลื่อน: <strong>~{{ hddTime }} ms</strong></p>
      </div>
      <!-- SSD -->
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-sm font-semibold">SSD <span class="font-normal text-mute">ชิปแฟลช ไม่มีชิ้นส่วนเคลื่อนไหว</span></p>
        <div class="mt-2 grid aspect-[4/3] grid-cols-8 gap-1 rounded-md border border-ink p-1.5">
          <div v-for="i in 32" :key="i" class="rounded-sm border border-line transition-colors duration-75" :class="ssdCell === i - 1 ? 'bg-ink' : 'bg-soft'" />
        </div>
        <p class="mt-2 text-sm">เข้าถึงเซลล์ไหนก็ได้ทันที: <strong>~{{ ssdTime }} ms</strong></p>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button type="button" class="rounded-lg border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-40" :disabled="running" @click="run">
        {{ running ? 'กำลังอ่าน...' : '▶ อ่านข้อมูลสุ่ม 3 ตำแหน่ง' }}
      </button>
      <span class="text-sm text-mute">อ่านแล้ว {{ done }}/3 ตำแหน่ง</span>
    </div>
    <figcaption class="mt-3 text-sm leading-7 text-mute">เวลาเป็นค่าประมาณ (HDD ราว 8 ms ต่อการอ่านสุ่ม, SSD ราว 0.08 ms) ภาพแสดงเฉพาะหลักการ ไม่ใช่สัดส่วนจริง</figcaption>
  </figure>
</template>

<style scoped>
.platter {
  transform-origin: 90px 80px;
  animation: spin 1.4s linear infinite;
}
.arm {
  transition: transform 0.7s ease-in-out;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .platter {
    animation: none;
  }
  .arm {
    transition: none;
  }
}
</style>
