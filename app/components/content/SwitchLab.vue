<script setup lang="ts">
// จำลองสวิตช์ L2: เรียนรู้ MAC ต้นทาง → ส่งตรง/ท่วม (flood) ตาม VLAN + ลองท่วมตาราง MAC (CAM overflow)
interface Host { id: string; name: string; mac: string; port: number; vlan: 10 | 20 }
interface Entry { vlan: number; mac: string; port: number; fake?: boolean }
const CAP = 6

const hosts = ref<Host[]>([
  { id: 'A', name: 'A', mac: '00:AA:01', port: 1, vlan: 10 },
  { id: 'B', name: 'B', mac: '00:BB:02', port: 2, vlan: 10 },
  { id: 'C', name: 'C', mac: '00:CC:03', port: 3, vlan: 10 },
  { id: 'D', name: 'D', mac: '00:DD:04', port: 4, vlan: 20 },
])
const vlansOn = ref(true)
const table = ref<Entry[]>([])
const src = ref('A')
const dst = ref('B')
const got = ref<string[]>([])
const sender = ref('')
const mode = ref('')
const log = ref<string[]>([])
const sent = ref(0)

const vOf = (h: Host) => (vlansOn.value ? h.vlan : 1)
const byId = (id: string) => hosts.value.find(h => h.id === id)!

function send() {
  const s = byId(src.value)
  const v = vOf(s)
  const out: string[] = []
  const notes: string[] = []
  sent.value++

  // 1) เรียนรู้ MAC ต้นทาง
  const ex = table.value.find(e => e.vlan === v && e.mac === s.mac)
  if (ex) {
    if (ex.port !== s.port) { ex.port = s.port; notes.push(`อัปเดต ${s.mac} ย้ายมาที่พอร์ต ${s.port}`) }
    else notes.push(`รู้จัก ${s.mac} อยู่แล้ว (รีเซ็ตตัวนับ aging)`)
  } else if (table.value.length < CAP) {
    table.value.push({ vlan: v, mac: s.mac, port: s.port })
    notes.push(`เรียนรู้: VLAN ${v} · ${s.mac} อยู่ที่พอร์ต ${s.port}`)
  } else {
    notes.push('ตารางเต็ม จึงเรียนรู้ MAC ต้นทางไม่ได้')
  }

  // 2) ตัดสินใจส่งออก
  const sameVlan = hosts.value.filter(h => vOf(h) === v && h.id !== s.id)
  let m = ''
  if (dst.value === 'BC') {
    m = 'broadcast'
    sameVlan.forEach(h => out.push(h.id))
    notes.push('ปลายทาง FF:FF:FF:FF:FF:FF → ส่งออกทุกพอร์ตใน VLAN เดียวกันเสมอ')
  } else {
    const d = byId(dst.value)
    const e = table.value.find(x => x.vlan === v && x.mac === d.mac)
    if (e && e.port === s.port) {
      m = 'filter'
      notes.push('ปลายทางอยู่พอร์ตเดียวกับต้นทาง → ทิ้งเฟรม (filter)')
    } else if (e) {
      m = 'forward'
      const t = hosts.value.find(h => h.port === e.port)
      if (t) out.push(t.id)
      notes.push(`พบในตาราง → ส่งออกพอร์ต ${e.port} พอร์ตเดียว`)
    } else {
      m = 'flood'
      sameVlan.forEach(h => out.push(h.id))
      notes.push(`ไม่พบ ${d.mac} ใน VLAN ${v} → ท่วม (flood) ออกทุกพอร์ตใน VLAN เดียวกัน ยกเว้นพอร์ตต้นทาง`)
      if (vOf(d) !== v) notes.push(`${d.name} อยู่คนละ VLAN จึงไม่ได้รับเฟรมเลย ต้องผ่านเราเตอร์`)
    }
  }
  sender.value = s.id
  got.value = out
  mode.value = m
  log.value = notes
}

function flood() {
  const fakes: Entry[] = []
  for (let i = 0; table.value.length + fakes.length < CAP; i++) {
    fakes.push({ vlan: vlansOn.value ? 10 : 1, mac: `66:${(i + 16).toString(16).toUpperCase()}:EE`, port: 4, fake: true })
  }
  table.value.push(...fakes)
  log.value = [`ผู้โจมตีที่พอร์ต 4 ส่งเฟรมปลอม MAC ต้นทางต่างกันจนตารางเต็ม (${CAP}/${CAP})`, 'จากนี้ MAC ใหม่จะเรียนรู้ไม่ได้ ทุกเฟรม unicast ที่ไม่พบในตารางจะถูกท่วมออกทุกพอร์ต']
  got.value = []
  sender.value = ''
  mode.value = ''
}
function reset() {
  table.value = []
  got.value = []
  sender.value = ''
  mode.value = ''
  log.value = []
  sent.value = 0
}
function toggleVlan(h: Host) { h.vlan = h.vlan === 10 ? 20 : 10; reset() }

const modeText = computed(() => ({
  forward: 'ส่งตรง (known unicast): ออกพอร์ตเดียว',
  flood: 'ท่วม (unknown unicast flooding)',
  broadcast: 'broadcast: ทุกพอร์ตใน VLAN',
  filter: 'ทิ้ง (filter): ปลายทางอยู่พอร์ตเดียวกัน',
} as Record<string, string>)[mode.value] ?? '')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-xs text-mute">สวิตช์ 4 พอร์ต ตารางจุได้ {{ CAP }} รายการ (ค่าจริงหลายพันรายการ) · กดป้าย VLAN บนเครื่องเพื่อสลับ 10/20</p>

    <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div
        v-for="h in hosts" :key="h.id"
        class="rounded-lg border p-2 text-center text-sm transition"
        :class="got.includes(h.id) ? 'border-ink bg-ink text-paper' : sender === h.id ? 'border-ink bg-paper font-semibold' : 'border-line bg-paper'"
      >
        <p class="font-semibold">เครื่อง {{ h.name }}</p>
        <p class="font-mono text-xs opacity-80">{{ h.mac }}</p>
        <p class="text-xs opacity-80">พอร์ต {{ h.port }}</p>
        <button
          type="button" class="mt-1 rounded border px-2 py-0.5 text-xs transition"
          :class="got.includes(h.id) ? 'border-paper' : 'border-line hover:border-ink'"
          :aria-label="`สลับ VLAN ของเครื่อง ${h.name}`" @click="toggleVlan(h)"
        >{{ vlansOn ? `VLAN ${h.vlan}` : 'VLAN 1' }}</button>
        <p v-if="sender === h.id" class="mt-1 text-xs">ผู้ส่ง</p>
        <p v-else-if="got.includes(h.id)" class="mt-1 text-xs">ได้รับเฟรม</p>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-end gap-3 text-sm">
      <label class="grid gap-1">
        <span class="text-xs text-mute">ผู้ส่ง</span>
        <select v-model="src" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option v-for="h in hosts" :key="h.id" :value="h.id">{{ h.name }}</option>
        </select>
      </label>
      <label class="grid gap-1">
        <span class="text-xs text-mute">ปลายทาง</span>
        <select v-model="dst" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option v-for="h in hosts" :key="h.id" :value="h.id" :disabled="h.id === src">{{ h.name }} ({{ h.mac }})</option>
          <option value="BC">broadcast</option>
        </select>
      </label>
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper transition hover:opacity-90" @click="send">ส่งเฟรม</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="flood">ท่วมตาราง (MAC flooding)</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="reset">ล้างตาราง</button>
    </div>
    <label class="mt-3 flex items-center gap-2 text-sm">
      <input v-model="vlansOn" type="checkbox" class="size-4 accent-current" @change="reset" />
      <span>เปิดใช้ VLAN (ปิด = ทุกพอร์ตอยู่วง broadcast เดียวกัน)</span>
    </label>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <div class="overflow-x-auto rounded-lg border border-line bg-paper">
        <p class="px-3 pt-2 text-xs text-mute">ตาราง MAC (CAM) {{ table.length }}/{{ CAP }}</p>
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="text-mute"><tr><th class="px-3 py-1 font-medium">VLAN</th><th class="px-3 py-1 font-medium">MAC</th><th class="px-3 py-1 font-medium">พอร์ต</th></tr></thead>
          <tbody>
            <tr v-for="e in table" :key="e.vlan + e.mac" class="border-t border-line">
              <td class="px-3 py-1 font-mono">{{ e.vlan }}</td>
              <td class="px-3 py-1 font-mono">{{ e.mac }}<span v-if="e.fake" class="ml-1 text-mute">(ปลอม)</span></td>
              <td class="px-3 py-1 font-mono">{{ e.port }}</td>
            </tr>
            <tr v-if="!table.length"><td colspan="3" class="px-3 py-2 text-mute">ว่าง (สวิตช์เพิ่งเปิด ยังไม่รู้จักใคร)</td></tr>
          </tbody>
        </table>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-sm" role="status">
        <p v-if="!log.length" class="text-mute">กด "ส่งเฟรม" แล้วดูว่าสวิตช์เรียนรู้และตัดสินใจอย่างไร ลองส่ง A→B สองครั้งเทียบกัน</p>
        <template v-else>
          <p v-if="modeText" class="font-semibold">{{ modeText }}</p>
          <ul class="mt-1 list-disc space-y-1 pl-5 text-mute">
            <li v-for="(l, i) in log" :key="i">{{ l }}</li>
          </ul>
        </template>
      </div>
    </div>
  </figure>
</template>
