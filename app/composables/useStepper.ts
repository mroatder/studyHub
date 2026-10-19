// ตัวควบคุมกลางของแอนิเมชันทุกตัว: เล่น / หยุด / ทีละขั้น / เริ่มใหม่
export function useStepper(total: Ref<number> | number, intervalMs = 1800) {
  const count = computed(() => (isRef(total) ? total.value : total))
  const index = ref(0)
  const playing = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  const reducedMotion = ref(false)
  onMounted(() => {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const isFirst = computed(() => index.value <= 0)
  const isLast = computed(() => index.value >= count.value - 1)

  function stop() {
    playing.value = false
    if (timer) clearInterval(timer)
    timer = undefined
  }
  function next() {
    if (!isLast.value) index.value++
    else stop()
  }
  function prev() {
    stop()
    if (!isFirst.value) index.value--
  }
  function goto(i: number) {
    stop()
    index.value = Math.min(Math.max(i, 0), count.value - 1)
  }
  function reset() {
    stop()
    index.value = 0
  }
  function play() {
    if (reducedMotion.value) return next() // ผู้ใช้ปิดแอนิเมชัน: เดินทีละขั้นเท่านั้น
    if (isLast.value) index.value = 0
    playing.value = true
    timer = setInterval(next, intervalMs)
  }
  function toggle() {
    if (playing.value) stop()
    else play()
  }

  onBeforeUnmount(stop)

  return { index, playing, isFirst, isLast, reducedMotion, next, prev, goto, reset, play, stop, toggle }
}
