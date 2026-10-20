<script setup lang="ts">
// SSD เขียนทับหน้าเดิมไม่ได้: ต้องเขียนหน้าใหม่ ทำหน้าเก่าเป็นขยะ แล้วค่อยลบทั้งบล็อกตอน garbage collection (จำลอง)
type St = 'free' | 'valid' | 'invalid'
interface Page { lpn: number | null; st: St }
const BLOCKS = 4
const PPB = 4 // pages per block
const MAX_LPN = 6

const blocks = ref<Page[][]>([])
const erases = ref<number[]>([])
const host = ref(0)
const flash = ref(0)
const msg = ref('')

function empty() {
  blocks.value = Array.from({ length: BLOCKS }, () => Array.from({ length: PPB }, () => ({ lpn: null, st: 'free' as St })))
  erases.value = Array(BLOCKS).fill(0)
}
const freeCount = () => blocks.value.flat().filter((p) => p.st === 'free').length
function findLpn(lpn: number): [number, number] | null {
  for (let b = 0; b < BLOCKS; b++) for (let i = 0; i < PPB; i++) if (blocks.value[b]![i]!.lpn === lpn && blocks.value[b]![i]!.st === 'valid') return [b, i]
  return null
}
function program(lpn: number, skip = -1): boolean {
  for (let b = 0; b < BLOCKS; b++) {
    if (b === skip) continue
    const i = blocks.value[b]!.findIndex((p) => p.st === 'free')
    if (i >= 0) {
      blocks.value[b]![i] = { lpn, st: 'valid' }
      flash.value++
      return true
    }
  }
  return false
}
function gc(): boolean {
  let victim = -1
  let best = 0
  for (let b = 0; b < BLOCKS; b++) {
    const pg = blocks.value[b]!
    if (pg.some((p) => p.st === 'free')) continue
    const inv = pg.filter((p) => p.st === 'invalid').length
    if (inv > best) { best = inv; victim = b }
  }
  if (victim < 0) return false
  const live = blocks.value[victim]!.filter((p) => p.st === 'valid')
  if (freeCount() < live.length) return false // ต้องมีที่ว่างนอกบล็อกเหยื่อพอสำหรับหน้าที่ต้องย้าย
  const moved = live.map((p) => p.lpn!)
  blocks.value[victim] = Array.from({ length: PPB }, () => ({ lpn: null, st: 'free' as St }))
  erases.value[victim]!++
  for (const l of moved) program(l, victim)
  msg.value = `GC: คัดลอกหน้าที่ยังใช้ ${moved.length} หน้าไปที่ใหม่ แล้วลบบล็อก ${victim} ทั้งบล็อก (flash เขียนเพิ่ม ${moved.length} ทั้งที่ผู้ใช้ไม่ได้สั่ง)`
  return true
}
function write(lpn: number) {
  if (freeCount() < PPB && !gc()) { msg.value = 'GC ทำไม่ได้ (ไม่มีบล็อกให้เก็บกวาด)'; return }
  const old = findLpn(lpn)
  if (old) blocks.value[old[0]]![old[1]]!.st = 'invalid'
  host.value++
  if (!program(lpn)) msg.value = 'ไม่มีหน้าว่างเหลือ'
  else if (!msg.value.startsWith('GC')) msg.value = old ? `เขียนทับ LPN ${lpn}: เขียนหน้าใหม่ และทำหน้าเก่าเป็น “ขยะ” (invalid) ยังลบไม่ได้` : `ไฟล์ใหม่ LPN ${lpn}: เขียนลงหน้าว่าง`
}
const live = () => blocks.value.flat().filter((p) => p.st === 'valid').map((p) => p.lpn!)
function newFile() {
  msg.value = ''
  const used = new Set(live())
  const lpn = Array.from({ length: MAX_LPN }, (_, i) => i).find((i) => !used.has(i))
  if (lpn === undefined) { msg.value = `มีไฟล์ครบ ${MAX_LPN} หน้าแล้ว ลองเขียนทับหรือ TRIM`; return }
  write(lpn)
}
function overwrite() {
  msg.value = ''
  const l = live()
  if (!l.length) return
  write(l[Math.floor(Math.random() * l.length)]!)
}
function trim() {
  msg.value = ''
  const l = live()
  if (!l.length) return
  const lpn = l[Math.floor(Math.random() * l.length)]!
  const at = findLpn(lpn)!
  blocks.value[at[0]]![at[1]]!.st = 'invalid'
  msg.value = `TRIM LPN ${lpn}: OS แจ้ง SSD ว่าไฟล์ถูกลบ หน้านี้เป็นขยะทันที ไม่ต้องถูกคัดลอกตอน GC`
}
function reset() {
  empty()
  host.value = 0
  flash.value = 0
  msg.value = ''
  for (let i = 0; i < 4; i++) write(i)
  msg.value = ''
}
reset()
const wa = computed(() => (host.value ? flash.value / host.value : 0))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2 text-sm">
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="newFile">+ เขียนไฟล์ใหม่</button>
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper" @click="overwrite">เขียนทับไฟล์เดิม (สุ่ม)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="trim">ลบไฟล์ (TRIM)</button>
      <button type="button" class="ml-auto rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>

    <div class="mt-4 grid gap-2">
      <div v-for="(blk, b) in blocks" :key="b" class="flex items-center gap-2">
        <div class="w-20 shrink-0 text-xs text-mute">บล็อก {{ b }}<br />ลบแล้ว {{ erases[b] }} ครั้ง</div>
        <div class="grid flex-1 grid-cols-4 gap-1">
          <div v-for="(pg, i) in blk" :key="i" class="rounded border py-2 text-center font-mono text-xs transition" :class="pg.st === 'valid' ? 'border-ink bg-ink text-paper' : pg.st === 'invalid' ? 'border-dashed border-ink bg-paper line-through opacity-60' : 'border-line bg-paper text-mute'">
            {{ pg.st === 'free' ? 'ว่าง' : `LPN ${pg.lpn}` }}
          </div>
        </div>
      </div>
    </div>
    <p class="mt-2 text-xs text-mute">สีเข้ม = ข้อมูลที่ใช้อยู่ · ขีดฆ่า = ขยะ (ลบไม่ได้ทีละหน้า) · ว่าง = เขียนได้ · LPN = หมายเลขหน้าตามที่ระบบปฏิบัติการเห็น</p>

    <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ผู้ใช้สั่งเขียน</p><p class="font-mono">{{ host }} หน้า</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">ชิปถูกเขียนจริง</p><p class="font-mono">{{ flash }} หน้า</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-xs text-mute">Write amplification</p><p class="font-mono">{{ wa.toFixed(2) }}×</p></div>
    </div>
    <p class="mt-3 min-h-6 text-sm leading-7" aria-live="polite">{{ msg || 'กด “เขียนทับ” หลายๆ ครั้งจนหน้าว่างใกล้หมด สังเกตว่า SSD ต้องเก็บกวาด (GC) และเขียนข้อมูลเพิ่มเอง' }}</p>
    <figcaption class="mt-1 text-sm text-mute">ย่อให้เล็ก: 4 บล็อก × 4 หน้า (ของจริงหน้าละหลาย KB, บล็อกละหลายร้อยหน้า) นโยบายเก็บกวาดแบบง่าย จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
