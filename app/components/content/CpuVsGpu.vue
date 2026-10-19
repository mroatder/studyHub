<script setup lang="ts">
// แข่งวาดภาพ 128 พิกเซล: CPU แกนน้อยแต่เก่ง (ทำทีละ 4) vs GPU แกนเยอะ (ทำทีละ 64)
const TOTAL = 128
const CPU_CORES = 4
const GPU_CORES = 64
const cpuDone = ref(0)
const gpuDone = ref(0)
const cpuRounds = ref(0)
const gpuRounds = ref(0)
const running = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  if (timer) clearInterval(timer)
  timer = undefined
  running.value = false
}
function reset() {
  stop()
  cpuDone.value = gpuDone.value = cpuRounds.value = gpuRounds.value = 0
}
function start() {
  reset()
  running.value = true
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  timer = setInterval(() => {
    if (cpuDone.value < TOTAL) {
      cpuDone.value = Math.min(TOTAL, cpuDone.value + CPU_CORES)
      cpuRounds.value++
    }
    if (gpuDone.value < TOTAL) {
      gpuDone.value = Math.min(TOTAL, gpuDone.value + GPU_CORES)
      gpuRounds.value++
    }
    if (cpuDone.value >= TOTAL) stop()
  }, reduce ? 10 : 160)
}
onBeforeUnmount(stop)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-4 sm:grid-cols-2">
      <div v-for="p in [
        { n: 'CPU', d: `${CPU_CORES} แกน แรงและฉลาด`, done: cpuDone, rounds: cpuRounds, cores: CPU_CORES },
        { n: 'GPU', d: `${GPU_CORES}+ แกน ง่ายแต่เยอะ`, done: gpuDone, rounds: gpuRounds, cores: GPU_CORES },
      ]" :key="p.n" class="rounded-lg border border-line bg-paper p-3">
        <p class="text-sm font-semibold">{{ p.n }} <span class="font-normal text-mute">{{ p.d }}</span></p>
        <div class="mt-2 flex gap-1" aria-hidden="true">
          <span v-for="c in Math.min(p.cores, 16)" :key="c" class="h-2.5 flex-1 rounded-sm bg-ink" :class="p.n === 'CPU' ? 'h-5' : ''" />
        </div>
        <div class="mt-3 grid gap-px" style="grid-template-columns: repeat(16, minmax(0, 1fr))" role="img" :aria-label="`${p.n} วาดแล้ว ${p.done} จาก ${TOTAL} พิกเซล`">
          <span v-for="i in TOTAL" :key="i" class="aspect-square rounded-[1px] border border-line transition-colors duration-100" :class="i <= p.done ? 'bg-ink' : 'bg-soft'" />
        </div>
        <p class="mt-2 text-sm">ใช้ไป <strong>{{ p.rounds }}</strong> รอบ <span v-if="p.done >= TOTAL" class="text-mute">· เสร็จแล้ว</span></p>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" class="rounded-lg border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-40" :disabled="running" @click="start">▶ เริ่มวาดภาพ</button>
      <button type="button" class="rounded-lg border border-line px-4 py-2 text-sm transition hover:border-ink" @click="reset">↺ เริ่มใหม่</button>
    </div>
    <figcaption class="mt-3 text-sm leading-7 text-mute">งานนี้ทาสีแต่ละพิกเซลอิสระต่อกัน GPU จึงทำได้พร้อมกันจำนวนมาก แต่ถ้างานต้องคิดซับซ้อนเป็นลำดับ (เช่น ตัดสินใจทีละขั้น) แกนของ CPU ที่แรงกว่าจะเหมาะกว่า ภาพแสดงหลักการ ตัวเลขแกนเป็นตัวอย่างเพื่อให้เห็นความต่าง</figcaption>
  </figure>
</template>
