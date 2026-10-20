<script setup lang="ts">
// เทียบการวางเว็บเซิร์ฟเวอร์ใน LAN (flat) กับใน DMZ: ประเมินกฎไฟร์วอลล์แบบ first-match ต่อทุกการเชื่อมต่อ + จำลองกรณีเว็บเซิร์ฟเวอร์ถูกยึด
type Zone = 'net' | 'dmz' | 'lan'
interface Host { id: string; label: string }
interface Flow { id: number; src: string; dst: string; port: number; svc: string; reply?: boolean; pivot?: boolean }
interface Rule { n: number; from: Zone; to: Zone; ports: number[] | 'any'; action: 'allow' | 'deny'; text: string }

const hosts: Host[] = [
  { id: 'net', label: 'อินเทอร์เน็ต' },
  { id: 'web', label: 'เว็บเซิร์ฟเวอร์' },
  { id: 'db', label: 'ฐานข้อมูลภายใน' },
  { id: 'pc', label: 'พีซีพนักงาน' },
]
const flows: Flow[] = [
  { id: 1, src: 'net', dst: 'web', port: 443, svc: 'HTTPS' },
  { id: 2, src: 'net', dst: 'web', port: 22, svc: 'SSH' },
  { id: 3, src: 'net', dst: 'db', port: 5432, svc: 'PostgreSQL' },
  { id: 4, src: 'pc', dst: 'web', port: 22, svc: 'SSH (ผู้ดูแล)' },
  { id: 5, src: 'pc', dst: 'net', port: 443, svc: 'HTTPS' },
  { id: 6, src: 'db', dst: 'web', port: 443, svc: 'ตอบกลับคำขอเดิม', reply: true },
  { id: 7, src: 'web', dst: 'db', port: 5432, svc: 'PostgreSQL', pivot: true },
  { id: 8, src: 'web', dst: 'pc', port: 445, svc: 'SMB', pivot: true },
]
const rules: Rule[] = [
  { n: 1, from: 'net', to: 'dmz', ports: [80, 443], action: 'allow', text: 'Internet → DMZ เฉพาะ 80/443' },
  { n: 2, from: 'lan', to: 'dmz', ports: [22, 443], action: 'allow', text: 'LAN → DMZ เพื่อดูแล (22, 443)' },
  { n: 3, from: 'lan', to: 'net', ports: [80, 443, 53], action: 'allow', text: 'LAN → Internet (เว็บ, DNS)' },
  { n: 4, from: 'dmz', to: 'lan', ports: 'any', action: 'deny', text: 'DMZ → LAN ปฏิเสธทั้งหมด' },
  { n: 5, from: 'dmz', to: 'net', ports: [443], action: 'allow', text: 'DMZ → Internet 443 (อัปเดต)' },
]

const dmz = ref(true)
const compromised = ref(false)

const zoneOf = (h: string): Zone => (h === 'net' ? 'net' : h === 'web' ? (dmz.value ? 'dmz' : 'lan') : 'lan')
const name = (h: string) => hosts.find(x => x.id === h)!.label

function verdict(f: Flow): { ok: boolean; why: string } {
  const s = zoneOf(f.src)
  const d = zoneOf(f.dst)
  if (f.reply) return { ok: true, why: 'ตารางสถานะ (state) จำการเชื่อมต่อที่เริ่มจากอีกฝั่งไว้ จึงให้ตอบกลับผ่าน' }
  if (!dmz.value) {
    if (s === 'lan' && d === 'lan') return { ok: true, why: 'อยู่ซับเน็ตเดียวกัน ไม่ผ่านไฟร์วอลล์ จึงไม่มีกฎใดตรวจ' }
    if (s === 'net' && f.dst === 'web') return f.port === 443 || f.port === 80
      ? { ok: true, why: 'port forward 80/443 ไปเว็บเซิร์ฟเวอร์ที่ขอบ' }
      : { ok: false, why: 'ไม่ตรง port forward ใด → default deny' }
    if (s === 'lan' && d === 'net') return { ok: true, why: 'LAN ออกอินเทอร์เน็ตได้' }
    return { ok: false, why: 'ไม่ตรงกฎใด → default deny' }
  }
  for (const r of rules) {
    if (r.from === s && r.to === d && (r.ports === 'any' || r.ports.includes(f.port))) {
      return { ok: r.action === 'allow', why: `กฎ ${r.n}: ${r.text}` }
    }
  }
  return { ok: false, why: 'ไม่ตรงกฎใด → default deny' }
}

const rows = computed(() => flows.map(f => ({ f, v: verdict(f) })))
const visible = computed(() => (compromised.value ? rows.value.filter(x => x.f.src === 'web') : rows.value))
const breach = computed(() => rows.value.filter(x => x.f.pivot && x.v.ok).length)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2 text-sm" role="group" aria-label="เลือกแบบเครือข่าย">
      <button type="button" class="rounded-md border px-3 py-1.5 transition" :class="!dmz ? 'border-ink bg-paper font-semibold' : 'border-line hover:border-ink'" @click="dmz = false">เว็บเซิร์ฟเวอร์อยู่ใน LAN (flat)</button>
      <button type="button" class="rounded-md border px-3 py-1.5 transition" :class="dmz ? 'border-ink bg-paper font-semibold' : 'border-line hover:border-ink'" @click="dmz = true">เว็บเซิร์ฟเวอร์อยู่ใน DMZ</button>
    </div>
    <label class="mt-3 flex items-center gap-2 text-sm">
      <input v-model="compromised" type="checkbox" class="size-4 accent-current" />
      <span>สมมติว่าผู้โจมตียึดเว็บเซิร์ฟเวอร์ได้แล้ว (ดูเฉพาะการเชื่อมต่อที่เริ่มจากเครื่องนั้น)</span>
    </label>

    <div class="mt-3 overflow-x-auto rounded-lg border border-line bg-paper">
      <table class="w-full min-w-[34rem] text-left text-xs sm:text-sm">
        <thead class="text-mute">
          <tr><th class="px-3 py-2 font-medium">ต้นทาง → ปลายทาง</th><th class="px-3 py-2 font-medium">บริการ</th><th class="px-3 py-2 font-medium">ผล</th><th class="px-3 py-2 font-medium">เหตุผล</th></tr>
        </thead>
        <tbody>
          <tr v-for="x in visible" :key="x.f.id" class="border-t border-line" :class="x.f.pivot && x.v.ok ? 'bg-soft font-semibold' : ''">
            <td class="px-3 py-2">{{ name(x.f.src) }} <span class="text-mute">({{ zoneOf(x.f.src).toUpperCase() }})</span> → {{ name(x.f.dst) }} <span class="text-mute">({{ zoneOf(x.f.dst).toUpperCase() }})</span></td>
            <td class="px-3 py-2 font-mono">{{ x.f.port }} <span class="font-sans text-mute">{{ x.f.svc }}</span></td>
            <td class="px-3 py-2">{{ x.v.ok ? '✓ ผ่าน' : '✗ ถูกปฏิเสธ' }}</td>
            <td class="px-3 py-2 text-mute">{{ x.v.why }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm" role="status">
      <template v-if="compromised">
        <p class="font-semibold">{{ breach ? `ผู้โจมตีเดินเข้าเครือข่ายภายในได้ ${breach} ทาง` : 'ผู้โจมตีติดอยู่ใน DMZ' }}</p>
        <p class="mt-1 text-mute">
          {{ breach
            ? 'เว็บเซิร์ฟเวอร์อยู่ซับเน็ตเดียวกับฐานข้อมูลและพีซี ไม่มีไฟร์วอลล์คั่น จึงต่อไปยังเครื่องภายในได้ตรงๆ (lateral movement)'
            : 'กฎ 4 ปฏิเสธทุกการเชื่อมต่อใหม่จาก DMZ เข้า LAN การยึดเว็บเซิร์ฟเวอร์จึงไม่ลามต่อ แต่ผู้โจมตียังใช้เครื่องนี้ส่งออกอินเทอร์เน็ตตามกฎ 5 ได้ ควรจำกัดและเฝ้าดู' }}
        </p>
      </template>
      <template v-else>
        <p class="font-semibold">{{ dmz ? 'โหมด DMZ: กฎประเมินจากบนลงล่าง ตรงกฎแรกก็จบ ไม่ตรงเลย = ปฏิเสธ' : 'โหมด flat: ไฟร์วอลล์อยู่ที่ขอบ แต่ภายใน LAN ไม่มีอะไรคั่น' }}</p>
        <ol v-if="dmz" class="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-mute">
          <li v-for="r in rules" :key="r.n">{{ r.text }} → {{ r.action === 'allow' ? 'อนุญาต' : 'ปฏิเสธ' }}</li>
          <li>อื่นๆ ทั้งหมด → ปฏิเสธ (default deny)</li>
        </ol>
      </template>
    </div>
  </figure>
</template>
