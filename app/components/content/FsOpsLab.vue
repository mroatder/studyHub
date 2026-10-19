<script setup lang="ts">
// ดูว่าแต่ละคำสั่งไฟล์ทำอะไรกับ "รายการในไดเรกทอรี" และ "บล็อกข้อมูลบนดิสก์" (แบบจำลองย่อ)
type Entry = { dir: string; name: string; blocks: number[] }
type Op = { id: string; label: string; cmd: string; why: string; run: () => { entries: Entry[]; dirty: number[] } }

const dirs = ['ดิสก์ 1 /logs', 'ดิสก์ 1 /archive', 'ดิสก์ 2 /backup']
const disk1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const disk2 = [11, 12, 13, 14, 15, 16]
const initial: Entry[] = [
  { dir: dirs[0]!, name: 'app.log', blocks: [1, 2, 3] },
  { dir: dirs[0]!, name: 'notes.txt', blocks: [4] },
]
const clone = () => initial.map((e) => ({ ...e, blocks: [...e.blocks] }))

const ops: Op[] = [
  {
    id: 'touch', label: 'สร้างไฟล์ว่าง', cmd: 'touch new.log',
    why: 'เพิ่มแค่ "รายการ" ในไดเรกทอรี (และข้อมูลไฟล์เช่นชื่อ เวลา) ไฟล์ว่างยังไม่ใช้บล็อกข้อมูลเลย ขนาด 0 ไบต์',
    run: () => ({ entries: [...clone(), { dir: dirs[0]!, name: 'new.log', blocks: [] }], dirty: [] }),
  },
  {
    id: 'cp', label: 'คัดลอก', cmd: 'cp app.log app-copy.log',
    why: 'อ่านข้อมูลเดิมแล้วเขียนลงบล็อกใหม่ จึงได้ไฟล์ใหม่ที่อิสระต่อกัน แก้ต้นฉบับไม่กระทบสำเนา แต่ใช้พื้นที่เพิ่มเท่าขนาดไฟล์',
    run: () => ({ entries: [...clone(), { dir: dirs[0]!, name: 'app-copy.log', blocks: [5, 6, 7] }], dirty: [] }),
  },
  {
    id: 'rename', label: 'เปลี่ยนชื่อ', cmd: 'mv app.log app-old.log',
    why: 'แก้แค่ชื่อในรายการของไดเรกทอรี บล็อกข้อมูลชุดเดิมไม่ถูกแตะ จึงเร็วเท่ากันไม่ว่าไฟล์จะ 1 KB หรือ 50 GB',
    run: () => ({ entries: clone().map((e) => (e.name === 'app.log' ? { ...e, name: 'app-old.log' } : e)), dirty: [] }),
  },
  {
    id: 'move', label: 'ย้ายในดิสก์เดียวกัน', cmd: 'mv app.log /archive/',
    why: 'ย้ายรายการจากไดเรกทอรีหนึ่งไปอีกไดเรกทอรีบนดิสก์/พาร์ทิชันเดียวกัน บล็อกข้อมูลอยู่ที่เดิม จึงเร็วมาก เป็นเหตุผลที่ย้ายกับเปลี่ยนชื่อใช้คำสั่งเดียวกัน',
    run: () => ({ entries: clone().map((e) => (e.name === 'app.log' ? { ...e, dir: dirs[1]! } : e)), dirty: [] }),
  },
  {
    id: 'cross', label: 'ย้ายข้ามดิสก์', cmd: 'mv app.log /mnt/disk2/backup/',
    why: 'คนละระบบไฟล์ใช้รายการร่วมกันไม่ได้ จึงต้องคัดลอกข้อมูลไปดิสก์ใหม่ก่อน แล้วลบของเดิม ช้ากว่าและกินพื้นที่ชั่วคราวเท่าไฟล์',
    run: () => ({ entries: [...clone().filter((e) => e.name !== 'app.log'), { dir: dirs[2]!, name: 'app.log', blocks: [11, 12, 13] }], dirty: [1, 2, 3] }),
  },
  {
    id: 'rm', label: 'ลบ', cmd: 'rm app.log',
    why: 'เอารายการออกจากไดเรกทอรี แล้วระบบมองบล็อกเป็นพื้นที่ว่างให้เขียนทับได้ ข้อมูลเดิมยังค้างอยู่จนกว่าจะถูกทับ (แต่ SSD ที่ใช้ TRIM มักล้างเร็วกว่านั้น) ไม่มีถังขยะในระดับคำสั่ง',
    run: () => ({ entries: clone().filter((e) => e.name !== 'app.log'), dirty: [1, 2, 3] }),
  },
]

const sel = ref('rename')
const op = computed(() => ops.find((o) => o.id === sel.value)!)
const after = computed(() => op.value.run())

const key = (e: Entry) => `${e.dir}|${e.name}|${e.blocks.join(',')}`
const beforeKeys = computed(() => new Set(initial.map(key)))
const isNew = (e: Entry) => !beforeKeys.value.has(key(e))

function blockState(n: number, entries: Entry[], dirty: number[]) {
  const owner = entries.find((e) => e.blocks.includes(n))
  if (owner) return { s: 'used', tip: owner.name }
  if (dirty.includes(n)) return { s: 'dirty', tip: 'ว่างแล้ว แต่ข้อมูลเดิมยังไม่ถูกทับ' }
  return { s: 'free', tip: 'ว่าง' }
}
const views = computed(() => [
  { label: 'ก่อน', entries: initial, dirty: [] as number[] },
  { label: 'หลัง', entries: after.value.entries, dirty: after.value.dirty },
])
const cls = (s: string) => (s === 'used' ? 'border-ink bg-ink text-paper' : s === 'dirty' ? 'border-dashed border-ink' : 'border-line text-mute')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2" role="group" aria-label="เลือกคำสั่ง">
      <button v-for="o in ops" :key="o.id" type="button" class="rounded-md border px-3 py-1.5 text-sm transition" :class="sel === o.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="sel === o.id" @click="sel = o.id">{{ o.label }}</button>
    </div>
    <p class="mt-3 font-mono text-sm">$ {{ op.cmd }}</p>

    <div class="mt-3 grid gap-4 md:grid-cols-2">
      <div v-for="v in views" :key="v.label" class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="text-xs font-semibold text-mute">{{ v.label }}</p>
        <div class="mt-2 space-y-2">
          <div v-for="d in dirs" :key="d">
            <p class="text-xs text-mute">{{ d }}</p>
            <p v-for="e in v.entries.filter((x) => x.dir === d)" :key="key(e)" class="ml-2 font-mono text-xs" :class="v.label === 'หลัง' && isNew(e) ? 'font-semibold underline' : ''">
              {{ e.name }} → {{ e.blocks.length ? 'บล็อก ' + e.blocks.join(', ') : 'ไม่มีบล็อก (ว่างเปล่า)' }}
            </p>
          </div>
        </div>
        <p class="mt-3 text-xs text-mute">บล็อกบนดิสก์ 1</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <span v-for="n in disk1" :key="n" class="flex h-7 w-7 items-center justify-center rounded border font-mono text-[11px]" :class="cls(blockState(n, v.entries, v.dirty).s)" :title="blockState(n, v.entries, v.dirty).tip">{{ n }}</span>
        </div>
        <p class="mt-2 text-xs text-mute">บล็อกบนดิสก์ 2</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <span v-for="n in disk2" :key="n" class="flex h-7 w-7 items-center justify-center rounded border font-mono text-[11px]" :class="cls(blockState(n, v.entries, v.dirty).s)" :title="blockState(n, v.entries, v.dirty).tip">{{ n }}</span>
        </div>
      </div>
    </div>

    <p class="mt-3 text-sm leading-7" aria-live="polite">{{ op.why }}</p>
    <p class="mt-2 text-xs text-mute">ทึบ = ใช้งานอยู่ · เส้นประ = ว่างแล้วแต่ข้อมูลเดิมยังค้าง · เส้นอ่อน = ว่าง · ขีดเส้นใต้ = รายการที่เปลี่ยน</p>
    <figcaption class="mt-1 text-sm text-mute">เป็นแบบจำลองย่อเพื่อเข้าใจแนวคิด ระบบไฟล์จริง (NTFS, ext4) ซับซ้อนกว่านี้ เช่น มี inode, journal และขนาดบล็อกต่างกัน</figcaption>
  </figure>
</template>
