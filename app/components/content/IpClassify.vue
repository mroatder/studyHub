<script setup lang="ts">
// พิมพ์/เลือก IPv4 แล้วดูบิตของแต่ละ octet และว่าตกอยู่ในช่วงพิเศษใด (เทียบด้วย prefix จริง)
interface Range { cidr: string; name: string; routable: boolean; note: string }
const ranges: Range[] = [
  { cidr: '10.0.0.0/8', name: 'Private (RFC 1918)', routable: false, note: 'ใช้ภายในองค์กร ใช้ซ้ำกันได้ทั่วโลก เราเตอร์อินเทอร์เน็ตไม่ส่งต่อ' },
  { cidr: '172.16.0.0/12', name: 'Private (RFC 1918)', routable: false, note: '172.16.0.0–172.31.255.255 เท่านั้น 172.32.x.x ขึ้นไปเป็นสาธารณะ' },
  { cidr: '192.168.0.0/16', name: 'Private (RFC 1918)', routable: false, note: 'ค่าเริ่มต้นของเราเตอร์บ้านส่วนใหญ่' },
  { cidr: '100.64.0.0/10', name: 'Shared / CGNAT (RFC 6598)', routable: false, note: 'ISP ใช้ NAT ซ้อนระหว่างบ้านลูกค้ากับอินเทอร์เน็ต ไม่ใช่ private แบบ RFC 1918 แต่ก็ไม่ใช่สาธารณะที่ใช้ได้ตรงๆ' },
  { cidr: '127.0.0.0/8', name: 'Loopback', routable: false, note: 'คุยกับตัวเองในเครื่อง แพ็กเก็ตไม่ออกจากการ์ดเครือข่าย' },
  { cidr: '169.254.0.0/16', name: 'Link-local / APIPA', routable: false, note: 'เครื่องตั้งให้ตัวเองเมื่อ DHCP ไม่ตอบ ใช้ได้เฉพาะในเซกเมนต์เดียวกัน' },
  { cidr: '0.0.0.0/8', name: 'This network', routable: false, note: '0.0.0.0 แปลว่า "ยังไม่มีที่อยู่" หรือ "ทุกที่อยู่" ตามบริบท' },
  { cidr: '224.0.0.0/4', name: 'Multicast', routable: false, note: 'ส่งหากลุ่มผู้รับ ไม่ใช่ที่อยู่ของเครื่องเดียว' },
  { cidr: '240.0.0.0/4', name: 'Reserved (Class E)', routable: false, note: 'สงวนไว้ ไม่ใช้งานทั่วไป (255.255.255.255 คือ broadcast)' },
  { cidr: '192.0.2.0/24', name: 'Documentation (TEST-NET-1)', routable: false, note: 'สงวนสำหรับตัวอย่างในเอกสาร ไม่ควรมีอยู่จริงบนอินเทอร์เน็ต' },
  { cidr: '198.51.100.0/24', name: 'Documentation (TEST-NET-2)', routable: false, note: 'สงวนสำหรับตัวอย่างในเอกสาร' },
  { cidr: '203.0.113.0/24', name: 'Documentation (TEST-NET-3)', routable: false, note: 'สงวนสำหรับตัวอย่างในเอกสาร (ตัวอย่างของบทนี้ใช้ช่วงนี้)' },
]

const text = ref('192.168.1.45')
const presets = ['192.168.1.45', '10.20.30.40', '172.16.5.9', '172.32.5.9', '100.64.12.1', '169.254.77.3', '127.0.0.1', '8.8.8.8', '203.0.113.195']

function parse(s: string): number[] | null {
  const p = s.trim().split('.')
  if (p.length !== 4) return null
  const n = p.map(x => (/^\d{1,3}$/.test(x) ? Number(x) : NaN))
  return n.every(x => x >= 0 && x <= 255) ? n : null
}
const toInt = (o: number[]) => o.reduce((a, x) => a * 256 + x, 0)

const octets = computed(() => parse(text.value))
const match = computed(() => {
  const o = octets.value
  if (!o) return null
  const v = toInt(o)
  let best: { r: Range; len: number } | null = null
  for (const r of ranges) {
    const [base, l] = r.cidr.split('/') as [string, string]
    const len = Number(l)
    const b = toInt(base.split('.').map(Number))
    const size = 2 ** (32 - len)
    if (v >= b && v < b + size && (!best || len > best.len)) best = { r, len }
  }
  return best
})
const bin = (n: number) => n.toString(2).padStart(8, '0')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <label class="grid gap-1 text-sm">
      <span class="text-xs text-mute">พิมพ์ที่อยู่ IPv4 หรือเลือกตัวอย่างด้านล่าง</span>
      <input v-model="text" inputmode="decimal" class="rounded-md border border-line bg-paper px-3 py-2 font-mono" aria-label="IPv4 address" />
    </label>
    <div class="mt-2 flex flex-wrap gap-1.5">
      <button v-for="p in presets" :key="p" type="button" class="rounded-md border border-line px-2 py-1 font-mono text-xs transition hover:border-ink" @click="text = p">{{ p }}</button>
    </div>

    <p v-if="!octets" class="mt-4 text-sm text-mute">รูปแบบไม่ถูกต้อง ต้องเป็นเลข 0–255 สี่ชุดคั่นด้วยจุด</p>
    <template v-else>
      <div class="mt-4 grid grid-cols-4 gap-1.5 text-center">
        <div v-for="(o, i) in octets" :key="i" class="rounded-lg border border-line bg-paper p-2">
          <p class="text-lg font-semibold">{{ o }}</p>
          <p class="break-all font-mono text-[10px] text-mute sm:text-xs">{{ bin(o) }}</p>
        </div>
      </div>
      <div class="mt-4 rounded-lg border border-line bg-paper p-3 text-sm">
        <template v-if="match">
          <p><span class="font-semibold">{{ match.r.name }}</span> <span class="font-mono text-xs text-mute">({{ match.r.cidr }})</span></p>
          <p class="mt-1 text-mute">{{ match.r.note }}</p>
          <p class="mt-2">เส้นทางบนอินเทอร์เน็ตสาธารณะ: <b>ไม่ส่งต่อ (ถูกทิ้ง)</b></p>
        </template>
        <template v-else>
          <p><span class="font-semibold">Public (สาธารณะ)</span></p>
          <p class="mt-1 text-mute">ไม่อยู่ในช่วงสงวนใดที่สื่อนี้รู้จัก จึงเป็นที่อยู่ที่ใช้จัดเส้นทางบนอินเทอร์เน็ตได้ (ผู้ถือที่อยู่จริงดูได้จากทะเบียน whois ของ RIR)</p>
          <p class="mt-2">เส้นทางบนอินเทอร์เน็ตสาธารณะ: <b>ส่งต่อได้</b></p>
        </template>
        <p v-if="match && match.r.cidr === '172.16.0.0/12'" class="mt-2 text-xs text-mute">เหตุผลทางบิต: /12 ตรึง 12 บิตแรก = 10101100.0001 ดังนั้น octet ที่สองต้องขึ้นต้น 0001 = 16–31</p>
      </div>
    </template>
  </figure>
</template>
