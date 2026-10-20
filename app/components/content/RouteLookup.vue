<script setup lang="ts">
// จำลองเคอร์เนลเลือกเส้นทาง: เทียบปลายทางกับทุกแถวของตารางเส้นทาง แล้วเลือกแถวที่ prefix ยาวที่สุด (longest prefix match)
interface Route { dest: string; len: number; kind: 'local' | 'loopback' | 'onlink' | 'gateway'; via?: string; dev: string; label: string }
const myIp = '192.168.1.50'
const gw = '192.168.1.1'

const hasDefault = ref(true)
const text = ref('192.168.1.20')
const presets = [
  { v: '127.0.0.1', t: 'localhost' },
  { v: '127.45.2.99', t: '127.x อื่น' },
  { v: '192.168.1.50', t: 'IP ตัวเอง' },
  { v: '192.168.1.20', t: 'เครื่องในซับเน็ต' },
  { v: '192.168.2.20', t: 'ซับเน็ตข้างเคียง' },
  { v: '1.1.1.1', t: 'อินเทอร์เน็ต' },
]

const routes = computed<Route[]>(() => {
  const r: Route[] = [
    { dest: '127.0.0.0', len: 8, kind: 'loopback', dev: 'lo', label: 'local → lo' },
    { dest: myIp, len: 32, kind: 'local', dev: 'lo', label: 'local (IP ของเครื่องเอง)' },
    { dest: '192.168.1.0', len: 24, kind: 'onlink', dev: 'eth0', label: 'on-link → eth0' },
  ]
  if (hasDefault.value) r.push({ dest: '0.0.0.0', len: 0, kind: 'gateway', via: gw, dev: 'eth0', label: `default via ${gw}` })
  return r
})

function parse(s: string): number[] | null {
  const p = s.trim().split('.')
  if (p.length !== 4) return null
  const n = p.map(x => (/^\d{1,3}$/.test(x) ? Number(x) : NaN))
  return n.every(x => x >= 0 && x <= 255) ? n : null
}
const toInt = (o: number[]) => o.reduce((a, x) => a * 256 + x, 0)
const octets = computed(() => parse(text.value))

const rows = computed(() => {
  const o = octets.value
  if (!o) return []
  const v = toInt(o)
  return routes.value.map((r) => {
    const base = toInt(r.dest.split('.').map(Number))
    const size = 2 ** (32 - r.len)
    return { r, hit: v >= base && v < base + size }
  })
})
const winner = computed(() => {
  let best: Route | null = null
  for (const x of rows.value) if (x.hit && (!best || x.r.len > best.len)) best = x.r
  return best
})

const verdict = computed(() => {
  const w = winner.value
  if (!w) return { title: 'Network is unreachable', text: 'ไม่มีแถวใดตรงเลย (ไม่มี default route) เคอร์เนลปฏิเสธทันที โดยไม่ส่งอะไรออกสาย ผู้ใช้เห็นข้อผิดพลาดแบบ "Network is unreachable" ไม่ใช่ timeout' }
  if (w.kind === 'loopback') return { title: 'ส่งเข้า loopback (lo)', text: 'แพ็กเก็ตวนกลับเข้าคิวรับของเคอร์เนลในหน่วยความจำ ไม่ผ่านการ์ดเครือข่ายและไม่ผ่านสาย ไม่ต้อง ARP' }
  if (w.kind === 'local') return { title: 'ส่งถึงตัวเองผ่าน lo', text: 'ที่อยู่นี้เป็นของเครื่องเอง เคอร์เนลส่งถึงตัวเองทางเส้นทางแบบ local (บน Linux อยู่ในตาราง local) ต่อให้ระบุผ่านการ์ด eth0 ก็ไม่ออกสาย' }
  if (w.kind === 'onlink') return { title: 'ส่งตรง (on-link)', text: 'ARP ถามหา MAC ของปลายทางโดยตรง แล้วส่งเฟรมไปที่ MAC นั้น ไม่ผ่านเกตเวย์' }
  return { title: `ส่งให้ default gateway ${gw}`, text: `ARP ถามหา MAC ของ ${gw} (ไม่ใช่ของปลายทาง) แล้วส่งเฟรมไปที่เราเตอร์ ส่วน IP ปลายทางในแพ็กเก็ตยังเป็นปลายทางจริง` }
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-xs text-mute">เครื่องนี้: IP <span class="font-mono">{{ myIp }}/24</span> · gateway <span class="font-mono">{{ gw }}</span> · พิมพ์ IP ปลายทางหรือเลือกตัวอย่าง</p>
    <label class="mt-2 grid gap-1 text-sm">
      <input v-model="text" inputmode="decimal" class="rounded-md border border-line bg-paper px-3 py-2 font-mono" aria-label="IP ปลายทาง" />
    </label>
    <div class="mt-2 flex flex-wrap gap-1.5">
      <button v-for="p in presets" :key="p.v" type="button" class="rounded-md border border-line px-2 py-1 text-xs transition hover:border-ink" :class="text === p.v ? 'border-ink bg-paper' : ''" @click="text = p.v">
        <span class="font-mono">{{ p.v }}</span> <span class="text-mute">{{ p.t }}</span>
      </button>
    </div>
    <label class="mt-3 flex items-center gap-2 text-sm">
      <input v-model="hasDefault" type="checkbox" class="size-4 accent-current" />
      <span>มี default route (default gateway)</span>
    </label>

    <p v-if="!octets" class="mt-4 text-sm text-mute">รูปแบบไม่ถูกต้อง ต้องเป็นเลข 0–255 สี่ชุดคั่นด้วยจุด</p>
    <template v-else>
      <div class="mt-4 overflow-x-auto rounded-lg border border-line bg-paper">
        <table class="w-full min-w-[30rem] text-left text-xs sm:text-sm">
          <thead class="text-mute">
            <tr><th class="px-3 py-2 font-medium">เส้นทาง</th><th class="px-3 py-2 font-medium">ตรงไหม</th><th class="px-3 py-2 font-medium">prefix</th><th class="px-3 py-2 font-medium">ทิศทาง</th></tr>
          </thead>
          <tbody>
            <tr v-for="x in rows" :key="x.r.dest + x.r.len" class="border-t border-line" :class="winner === x.r ? 'bg-soft font-semibold' : ''">
              <td class="px-3 py-2 font-mono">{{ x.r.dest }}/{{ x.r.len }}</td>
              <td class="px-3 py-2">{{ x.hit ? '✓ ตรง' : '✗ ไม่ตรง' }}</td>
              <td class="px-3 py-2 font-mono">/{{ x.r.len }}</td>
              <td class="px-3 py-2">{{ x.r.label }}<span v-if="winner === x.r"> ◀ ชนะ</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm" role="status">
        <p class="font-semibold">{{ verdict.title }}</p>
        <p class="mt-1 text-mute">{{ verdict.text }}</p>
        <p v-if="rows.filter(x => x.hit).length > 1" class="mt-2 text-xs text-mute">ตรงหลายแถว: เคอร์เนลเลือกแถวที่ prefix ยาวที่สุด (เฉพาะเจาะจงที่สุด) ไม่ใช่แถวที่อยู่บนสุดของตาราง</p>
      </div>
    </template>
  </figure>
</template>
