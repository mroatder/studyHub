<script setup lang="ts">
// บันไดวินิจฉัย: รันคำสั่งทีละขั้นกับโจทย์ที่ซ่อนสาเหตุไว้ แล้วทายว่าเสียตรงไหน
type St = 'ok' | 'fail'
interface Out { st: St; text: string }
const steps = [
  { key: 'link', cmd: 'ip link show eth0', why: 'ลิงก์ L1/L2 ขึ้นไหม (ไฟที่พอร์ต)' },
  { key: 'lo', cmd: 'ping 127.0.0.1', why: 'สแต็ก TCP/IP ในเครื่อง' },
  { key: 'gw', cmd: 'ping 192.168.1.1', why: 'เกตเวย์ในวงเดียวกัน (ต้องผ่าน ARP)' },
  { key: 'wan', cmd: 'ping 8.8.8.8', why: 'ออกอินเทอร์เน็ตด้วยเลข IP ล้วน' },
  { key: 'dns', cmd: 'nslookup shop.example.com', why: 'แปลงชื่อเป็น IP' },
  { key: 'srv', cmd: 'ping shop.example.com', why: 'ถึงเซิร์ฟเวอร์ด้วยชื่อ (ICMP)' },
  { key: 'app', cmd: 'curl -I http://shop.example.com', why: 'บริการจริงบนพอร์ต 80 (TCP)' },
] as const
type Key = typeof steps[number]['key']

const causes = [
  { id: 'cable', label: 'สายหลุด / ลิงก์ดับ' },
  { id: 'gw', label: 'ตั้งเกตเวย์ผิด' },
  { id: 'wan', label: 'ขาออกอินเทอร์เน็ตล่ม (WAN/ISP)' },
  { id: 'dnsdown', label: 'DNS เซิร์ฟเวอร์ไม่ตอบ' },
  { id: 'nxd', label: 'ชื่อไม่มีระเบียน DNS (NXDOMAIN)' },
  { id: 'app', label: 'บริการปลายทางไม่ฟังพอร์ต' },
  { id: 'icmp', label: 'ไม่มีปัญหา: ICMP ถูกกรองเฉยๆ' },
]
const ok = (text: string): Out => ({ st: 'ok', text })
const bad = (text: string): Out => ({ st: 'fail', text })
const LOOK = ok('3 packets transmitted, 3 received, 0% packet loss')
const UP = ok('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> state UP')
const GWOK = ok('3 packets transmitted, 3 received, time 0.7 ms')
const WANOK = ok('3 packets transmitted, 3 received, time 14 ms')
const DNSOK = ok('Name: shop.example.com  Address: 203.0.113.80')
const SRVOK = ok('64 bytes from 203.0.113.80: ttl=52 time=21 ms')
const APPOK = ok('HTTP/1.1 200 OK')

interface Scn { id: string; user: string; out: Record<Key, Out>; explain: string }
const scenarios: Scn[] = [
  {
    id: 'cable', user: 'เปิดเว็บไม่ได้เลย ทุกเว็บ',
    out: {
      link: bad('eth0: <NO-CARRIER,BROADCAST,MULTICAST,UP> state DOWN'),
      lo: LOOK,
      gw: bad('connect: Network is unreachable'),
      wan: bad('connect: Network is unreachable'),
      dns: bad(';; connection timed out; no servers could be reached'),
      srv: bad('ping: Temporary failure in name resolution'),
      app: bad('curl: (6) Could not resolve host'),
    },
    explain: 'ขั้นแรกก็ตกแล้ว NO-CARRIER = ไม่มีสัญญาณบนสาย ขั้นหลังๆ ที่ล้มเป็นผลตามมาทั้งหมด จึงอย่าไปแก้ DNS ก่อนเช็กสาย',
  },
  {
    id: 'gw', user: 'ไฟลิงก์ติด แต่ออกเน็ตไม่ได้ เพิ่งตั้ง IP เอง',
    out: {
      link: UP,
      lo: LOOK,
      gw: bad('From 192.168.1.45 icmp_seq=1 Destination Host Unreachable'),
      wan: bad('From 192.168.1.45 icmp_seq=1 Destination Host Unreachable'),
      dns: bad(';; connection timed out; no servers could be reached'),
      srv: bad('ping: Temporary failure in name resolution'),
      app: bad('curl: (6) Could not resolve host'),
    },
    explain: 'Unreachable ที่รายงานโดย IP ของเราเอง (From 192.168.1.45) แปลว่า ARP หาเกตเวย์ไม่เจอ: IP เกตเวย์ที่ตั้งไม่มีตัวตนในวง หรือ IP/mask ของเราผิดวง ต่างจากสายหลุดตรงที่ลิงก์ยัง UP',
  },
  {
    id: 'wan', user: 'เว็บภายในใช้ได้ แต่เว็บนอกเข้าไม่ได้ทั้งหมด',
    out: {
      link: UP,
      lo: LOOK,
      gw: GWOK,
      wan: bad('3 packets transmitted, 0 received, 100% packet loss'),
      dns: bad(';; connection timed out; no servers could be reached'),
      srv: bad('ping: Temporary failure in name resolution'),
      app: bad('curl: (6) Could not resolve host'),
    },
    explain: 'ผ่านเกตเวย์แล้วแต่ 8.8.8.8 ไม่ตอบ (timeout ไม่ใช่ unreachable) ปัญหาอยู่เลยเกตเวย์ไป: ลิงก์ ISP ล่ม เส้นทางออก หรือ NAT เสีย ขั้นต่อไปคือ traceroute ดูว่าหายหลังฮอปไหน',
  },
  {
    id: 'dnsdown', user: 'บางคนเข้า IP ตรงๆ ได้ แต่เข้าด้วยชื่อไม่ได้',
    out: {
      link: UP,
      lo: LOOK,
      gw: GWOK,
      wan: WANOK,
      dns: bad(';; connection timed out; no servers could be reached'),
      srv: bad('ping: Temporary failure in name resolution'),
      app: bad('curl: (6) Could not resolve host'),
    },
    explain: 'เครือข่ายถึง 8.8.8.8 ได้ แต่ nslookup หมดเวลา = ไม่มีใครตอบคำถามที่พอร์ต 53 ของ DNS ที่ตั้งไว้ (ดับ ตั้งผิด หรือถูกไฟร์วอลล์กั้น) ลองระบุ DNS อื่น `nslookup ชื่อ 8.8.8.8` เพื่อยืนยัน',
  },
  {
    id: 'nxd', user: 'เปิดชื่อนี้ไม่ได้ แต่เว็บอื่นปกติ',
    out: {
      link: UP,
      lo: LOOK,
      gw: GWOK,
      wan: WANOK,
      dns: bad("** server can't find shop.example.com: NXDOMAIN"),
      srv: bad('ping: shop.example.com: Name or service not known'),
      app: bad('curl: (6) Could not resolve host'),
    },
    explain: 'ต่างจากกรณี DNS ไม่ตอบ: ครั้งนี้ DNS ตอบกลับมาทันทีว่า NXDOMAIN = "ไม่มีชื่อนี้" เซิร์ฟเวอร์ DNS ทำงานดี ปัญหาคือระเบียนหายหรือพิมพ์ชื่อผิดหรือโดเมนหมดอายุ',
  },
  {
    id: 'app', user: 'ping ได้ แต่เว็บเปิดไม่ขึ้น',
    out: {
      link: UP,
      lo: LOOK,
      gw: GWOK,
      wan: WANOK,
      dns: DNSOK,
      srv: SRVOK,
      app: bad('curl: (7) Failed to connect to shop.example.com port 80: Connection refused'),
    },
    explain: 'ทุกชั้นล่างผ่าน และ refused มาเร็ว = เครื่องปลายทางมีชีวิตแต่ไม่มีโปรเซสฟังพอร์ต 80 (หรืออุปกรณ์กลางทางตอบ REJECT) ไปแก้ที่บริการ ไม่ใช่เครือข่าย',
  },
  {
    id: 'icmp', user: 'ping เซิร์ฟเวอร์ไม่ตอบ ผู้ใช้บอกเน็ตเสีย แต่เว็บยังเข้าได้',
    out: {
      link: UP,
      lo: LOOK,
      gw: GWOK,
      wan: WANOK,
      dns: DNSOK,
      srv: bad('3 packets transmitted, 0 received, 100% packet loss'),
      app: APPOK,
    },
    explain: 'ping ล้มแต่ TCP ใช้งานได้ = เซิร์ฟเวอร์หรือไฟร์วอลล์กรอง ICMP โดยตั้งใจ ping ไม่ตอบ ไม่ได้แปลว่าเซิร์ฟเวอร์ล่ม ให้ทดสอบที่พอร์ตของบริการแทน',
  },
]

const si = ref(0)
const ran = ref(0)
const picked = ref<string | null>(null)
const scn = computed(() => scenarios[si.value]!)
function reset(i: number) { si.value = i; ran.value = 0; picked.value = null }
function shuffle() { reset(Math.floor(Math.random() * scenarios.length)) }
const done = computed(() => picked.value !== null)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm"><span class="text-xs text-mute">ผู้ใช้แจ้งว่า</span> <b>{{ scn.user }}</b></p>
      <button type="button" class="rounded-md border border-line px-2.5 py-1 text-xs transition hover:border-ink" @click="shuffle">🎲 สุ่มโจทย์ใหม่</button>
    </div>

    <ol class="mt-4 grid gap-2">
      <li v-for="(s, i) in steps" :key="s.key" class="rounded-lg border border-line bg-paper p-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-mute">{{ i + 1 }}.</span>
          <code class="font-mono text-xs sm:text-sm">{{ s.cmd }}</code>
          <span class="text-xs text-mute">· {{ s.why }}</span>
          <button v-if="i === ran" type="button" class="ml-auto rounded-md bg-ink px-2.5 py-1 text-xs text-paper" @click="ran = i + 1">▶ รัน</button>
          <span v-else-if="i < ran" class="ml-auto text-xs font-semibold">{{ scn.out[s.key].st === 'ok' ? '✓ ผ่าน' : '✕ ไม่ผ่าน' }}</span>
        </div>
        <pre v-if="i < ran" class="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs" :class="scn.out[s.key].st === 'ok' ? 'text-mute' : 'font-semibold'">{{ scn.out[s.key].text }}</pre>
      </li>
    </ol>
    <button v-if="ran < steps.length" type="button" class="mt-2 text-xs text-mute underline" @click="ran = steps.length">รันทุกขั้นพร้อมกัน</button>

    <div v-if="ran >= 1" class="mt-4">
      <p class="text-xs font-semibold">สาเหตุที่เป็นไปได้ที่สุดคืออะไร</p>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <button v-for="c in causes" :key="c.id" type="button" :disabled="done" class="rounded-md border px-2 py-1 text-xs transition"
          :class="picked === c.id ? (c.id === scn.id ? 'border-ink bg-ink text-paper' : 'border-ink line-through') : (done && c.id === scn.id ? 'border-ink' : 'border-line hover:border-ink')"
          @click="picked = c.id">{{ c.label }}</button>
      </div>
      <div v-if="done" class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm" aria-live="polite">
        <p class="font-semibold">{{ picked === scn.id ? '✓ ถูกต้อง' : '✕ ยังไม่ใช่ คำตอบคือ: ' + causes.find(c => c.id === scn.id)!.label }}</p>
        <p class="mt-1 text-mute">{{ scn.explain }}</p>
        <button type="button" class="mt-2 text-xs underline" @click="reset((si + 1) % scenarios.length)">โจทย์ถัดไป →</button>
      </div>
    </div>
    <figcaption class="mt-3 text-xs text-mute">ผลลัพธ์เป็นข้อมูลตัวอย่างจำลอง ข้อความจริงต่างกันเล็กน้อยตามระบบปฏิบัติการและรุ่น</figcaption>
  </figure>
</template>
