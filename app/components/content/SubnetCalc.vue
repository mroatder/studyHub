<script setup lang="ts">
// เครื่องคิดเลขซับเน็ต: IP + prefix → mask / network / broadcast / ช่วงใช้งาน และตรวจว่าปลายทางอยู่ซับเน็ตเดียวกันหรือไม่ (AND ระดับบิต)
const ip = ref('192.168.10.77')
const prefix = ref(26)
const dest = ref('192.168.10.100')
const presets = [
  { ip: '192.168.10.77', p: 26, d: '192.168.10.100' },
  { ip: '10.0.0.64', p: 26, d: '10.0.0.65' },
  { ip: '192.168.1.50', p: 24, d: '192.168.1.200' },
  { ip: '172.16.5.9', p: 20, d: '172.16.17.1' },
]

function parse(s: string): number | null {
  const p = s.trim().split('.')
  if (p.length !== 4) return null
  const n = p.map(x => (/^\d{1,3}$/.test(x) ? Number(x) : NaN))
  if (!n.every(x => x >= 0 && x <= 255)) return null
  return ((n[0]! * 256 + n[1]!) * 256 + n[2]!) * 256 + n[3]!
}
const str = (v: number) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.')
const bin = (v: number) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].map(o => o.toString(2).padStart(8, '0')).join('.')

const r = computed(() => {
  const a = parse(ip.value)
  const p = Math.min(32, Math.max(0, Math.round(Number(prefix.value))))
  if (a === null) return null
  const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0
  const net = (a & mask) >>> 0
  const bc = (net | (~mask >>> 0)) >>> 0
  const total = 2 ** (32 - p)
  const usable = p >= 31 ? (p === 31 ? 2 : 1) : total - 2
  const first = p >= 31 ? net : net + 1
  const last = p >= 31 ? bc : bc - 1
  const d = parse(dest.value)
  const dNet = d === null ? null : (d & mask) >>> 0
  return { a, p, mask, net, bc, total, usable, first, last, d, local: dNet === net, kind: p === 32 ? 'host' : p === 31 ? 'p2p' : 'normal' }
})
// แสดงบิตเป็นกลุ่มสี: ส่วน network เทียบ host
const bits = computed(() => (r.value ? bin(r.value.a).replace(/\./g, '').split('') : []))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-3 text-sm sm:grid-cols-3">
      <label class="grid gap-1"><span class="text-xs text-mute">IP ของเครื่อง</span>
        <input v-model="ip" class="rounded-md border border-line bg-paper px-3 py-2 font-mono" aria-label="IP ของเครื่อง" />
      </label>
      <label class="grid gap-1"><span class="text-xs text-mute">Prefix /{{ prefix }}</span>
        <input v-model.number="prefix" type="range" min="8" max="32" class="mt-2 accent-current" aria-label="prefix length" />
      </label>
      <label class="grid gap-1"><span class="text-xs text-mute">IP ปลายทางที่จะส่งไปหา</span>
        <input v-model="dest" class="rounded-md border border-line bg-paper px-3 py-2 font-mono" aria-label="IP ปลายทาง" />
      </label>
    </div>
    <div class="mt-2 flex flex-wrap gap-1.5">
      <button v-for="(p, i) in presets" :key="i" type="button" class="rounded-md border border-line px-2 py-1 font-mono text-xs transition hover:border-ink" @click="ip = p.ip; prefix = p.p; dest = p.d">{{ p.ip }}/{{ p.p }}</button>
    </div>

    <p v-if="!r" class="mt-4 text-sm text-mute">รูปแบบ IP ไม่ถูกต้อง</p>
    <template v-else>
      <div class="mt-4 rounded-lg border border-line bg-paper p-3">
        <p class="mb-1 text-xs text-mute">บิตของ IP (ตัวหนา = ส่วน network {{ r.p }} บิต · ตัวจาง = ส่วน host {{ 32 - r.p }} บิต)</p>
        <p class="break-all font-mono text-xs leading-6 sm:text-sm">
          <template v-for="(b, i) in bits" :key="i"><span :class="i < r.p ? 'font-bold' : 'text-mute'">{{ b }}</span><span v-if="(i + 1) % 8 === 0 && i < 31" class="text-mute">.</span></template>
        </p>
      </div>

      <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">Subnet mask</dt><dd class="font-mono">{{ str(r.mask) }}</dd><dd class="break-all font-mono text-[10px] text-mute sm:text-xs">{{ bin(r.mask) }}</dd></div>
        <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">Network address (IP AND mask)</dt><dd class="font-mono">{{ str(r.net) }}/{{ r.p }}</dd></div>
        <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">Broadcast (host bits ทั้งหมด = 1)</dt><dd class="font-mono">{{ str(r.bc) }}</dd></div>
        <div class="rounded-lg border border-line bg-paper p-3"><dt class="text-xs text-mute">ช่วงที่ใส่ให้เครื่องได้ · จำนวน</dt><dd class="font-mono">{{ str(r.first) }} – {{ str(r.last) }}</dd><dd class="text-xs text-mute">รวม {{ r.total.toLocaleString() }} ที่อยู่ · ใช้งานได้ {{ r.usable.toLocaleString() }}{{ r.kind === 'p2p' ? ' (/31 แบบจุดต่อจุด RFC 3021)' : r.kind === 'host' ? ' (/32 = เครื่องเดียว)' : ' (= 2^' + (32 - r.p) + ' − 2)' }}</dd></div>
      </dl>

      <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm" aria-live="polite">
        <p v-if="r.d === null" class="text-mute">ใส่ IP ปลายทางให้ถูกรูปแบบเพื่อดูการตัดสินใจ</p>
        <template v-else>
          <p class="text-xs text-mute">เครื่องตัดสินใจก่อนส่ง: (ปลายทาง AND mask) เท่ากับ network ของตัวเองหรือไม่</p>
          <p class="mt-1 break-all font-mono text-xs">{{ str(r.d) }} AND {{ str(r.mask) }} = {{ str((r.d & r.mask) >>> 0) }} <span class="text-mute">เทียบกับ</span> {{ str(r.net) }}</p>
          <p class="mt-2"><b>{{ r.local ? 'เท่ากัน → อยู่ซับเน็ตเดียวกัน' : 'ไม่เท่ากัน → อยู่คนละซับเน็ต' }}</b>: {{ r.local ? 'ถาม ARP หา MAC ของปลายทาง แล้วส่งตรงผ่านสวิตช์ ไม่ผ่านเราเตอร์' : 'ส่งให้ default gateway (เราเตอร์) ผ่าน MAC ของเกตเวย์ แล้วให้เราเตอร์จัดเส้นทางต่อ' }}</p>
        </template>
      </div>
    </template>
  </figure>
</template>
