<script setup lang="ts">
// จำลอง NAT แบบ PAT (NAPT): เราเตอร์เขียนที่อยู่/พอร์ตต้นทางใหม่ เก็บตารางแปลง แล้วใช้ตารางนี้ส่งคำตอบกลับ
interface Row { pip: string; pport: number; rip: string; rport: number; pub: number }
const PUBLIC_IP = '203.0.113.7'
const hosts = [
  { ip: '192.168.1.10', label: 'PC-A 192.168.1.10' },
  { ip: '192.168.1.20', label: 'PC-B 192.168.1.20' },
]
const servers = [
  { ip: '198.51.100.10', port: 443, label: '198.51.100.10:443' },
  { ip: '192.0.2.80', port: 80, label: '192.0.2.80:80' },
]
const table = ref<Row[]>([])
const log = ref<string[]>([`เราเตอร์ NAT: ฝั่งใน 192.168.1.1 · ฝั่งนอก (WAN) ${PUBLIC_IP} · ตารางแปลงว่างอยู่`])
const host = ref(hosts[0]!.ip)
const sport = ref(50000)
const srv = ref(servers[0]!.ip)
const replyIdx = ref(0)
const outsider = ref('198.51.100.10')
const inPort = ref(50000)
const forward = ref(false)
let nextPub = 40000

function push(m: string) {
  log.value.push(m)
  if (log.value.length > 8) log.value.shift()
}

function outbound() {
  const s = servers.find(x => x.ip === srv.value)!
  const head = `${host.value}:${sport.value} → ${s.label}`
  const exist = table.value.find(r => r.pip === host.value && r.pport === sport.value && r.rip === s.ip && r.rport === s.port)
  if (exist) {
    push(`${head}  ⇒ มีแถวนี้อยู่แล้ว เขียนต้นทางเป็น ${PUBLIC_IP}:${exist.pub} ตามเดิม`)
    return
  }
  let pub = sport.value
  const clash = table.value.some(r => r.pub === pub && !(r.rip === s.ip && r.rport === s.port && r.pip === host.value))
  if (clash) {
    pub = nextPub++
    push(`${head}  ⇒ พอร์ตสาธารณะ ${sport.value} ถูกใช้แล้วโดยเครื่องอื่น เราเตอร์ remap เป็น ${pub} แล้วจดแถวใหม่ (นี่คือ "P" ของ PAT)`)
  } else {
    push(`${head}  ⇒ ไม่ชนกัน เก็บพอร์ต ${pub} ไว้ จดแถวใหม่ แล้วเขียนต้นทางเป็น ${PUBLIC_IP}:${pub}`)
  }
  table.value.push({ pip: host.value, pport: sport.value, rip: s.ip, rport: s.port, pub })
}

function reply() {
  const r = table.value[replyIdx.value]
  if (!r) { push('ยังไม่มีแถวในตาราง ลองส่งแพ็กเก็ตออกก่อน'); return }
  push(`${r.rip}:${r.rport} → ${PUBLIC_IP}:${r.pub}  ⇒ ค้นตาราง: ตรงแถว ${r.pip}:${r.pport} เขียนปลายทางกลับเป็น ${r.pip}:${r.pport} แล้วส่งเข้า LAN`)
}

function unsolicited() {
  if (forward.value && inPort.value === 8080) {
    push(`${outsider.value} → ${PUBLIC_IP}:8080  ⇒ กฎ port forward (8080 → 192.168.1.20:80) ตรงกัน ส่งต่อให้ PC-B แม้ไม่มีใครเริ่มก่อน`)
    return
  }
  const rows = table.value.filter(r => r.pub === inPort.value)
  if (!rows.length) {
    push(`${outsider.value} → ${PUBLIC_IP}:${inPort.value}  ⇒ ไม่มีแถวในตาราง และไม่มีกฎ forward เราเตอร์ไม่รู้ว่าจะส่งให้เครื่องไหน จึงทิ้ง`)
    return
  }
  const ok = rows.find(r => r.rip === outsider.value)
  if (ok) push(`${outsider.value} → ${PUBLIC_IP}:${inPort.value}  ⇒ ตรงแถวที่ ${ok.pip} เปิดไว้กับผู้ส่งรายนี้ ส่งเข้า LAN`)
  else push(`${outsider.value} → ${PUBLIC_IP}:${inPort.value}  ⇒ พอร์ตนี้มีแถวอยู่ แต่เป็นของการสนทนากับ ${rows[0]!.rip} ผู้ส่งรายนี้ไม่ใช่ จึงถูกทิ้ง (stateful filtering)`)
}

function expire() {
  const r = table.value.shift()
  push(r ? `แถว ${r.pip}:${r.pport} ↔ ${PUBLIC_IP}:${r.pub} หมดเวลา (idle timeout) ถูกลบ คำตอบที่มาช้าจะถูกทิ้ง` : 'ไม่มีแถวให้ลบ')
  replyIdx.value = 0
}
function reset() {
  table.value = []
  nextPub = 40000
  forward.value = false
  replyIdx.value = 0
  log.value = ['รีเซ็ตแล้ว']
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="mb-2 text-xs text-mute">ขั้นที่ 1 · ส่งแพ็กเก็ตออกจาก LAN (เลือกพอร์ตต้นทางเดียวกันจากสองเครื่องเพื่อดูการ remap)</p>
    <div class="grid gap-3 text-sm sm:grid-cols-3">
      <label class="grid gap-1"><span class="text-xs text-mute">เครื่องใน LAN</span>
        <select v-model="host" class="rounded-md border border-line bg-paper px-2 py-1.5"><option v-for="h in hosts" :key="h.ip" :value="h.ip">{{ h.label }}</option></select>
      </label>
      <label class="grid gap-1"><span class="text-xs text-mute">พอร์ตต้นทาง</span>
        <select v-model.number="sport" class="rounded-md border border-line bg-paper px-2 py-1.5"><option>50000</option><option>50001</option></select>
      </label>
      <label class="grid gap-1"><span class="text-xs text-mute">เซิร์ฟเวอร์ปลายทาง</span>
        <select v-model="srv" class="rounded-md border border-line bg-paper px-2 py-1.5"><option v-for="s in servers" :key="s.ip" :value="s.ip">{{ s.label }}</option></select>
      </label>
    </div>
    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper" @click="outbound">ส่งออก</button>
      <span class="text-mute">ขั้นที่ 2</span>
      <select v-model.number="replyIdx" class="rounded-md border border-line bg-paper px-2 py-1.5" aria-label="เลือกแถวที่จะให้เซิร์ฟเวอร์ตอบ">
        <option v-for="(r, i) in table" :key="i" :value="i">ตอบแถว {{ i + 1 }} (พอร์ต {{ r.pub }})</option>
        <option v-if="!table.length" :value="0">ยังไม่มีแถว</option>
      </select>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="reply">เซิร์ฟเวอร์ตอบกลับ</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="expire">ให้แถวเก่าสุดหมดเวลา</button>
      <button type="button" class="ml-auto rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>

    <p class="mb-2 mt-5 text-xs text-mute">ขั้นที่ 3 · ฝั่งอินเทอร์เน็ตส่งเข้ามาเอง (ไม่มีใครใน LAN เริ่มก่อน)</p>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <select v-model="outsider" class="rounded-md border border-line bg-paper px-2 py-1.5" aria-label="ผู้ส่งภายนอก">
        <option value="198.51.100.10">ผู้ส่ง 198.51.100.10 (เซิร์ฟเวอร์ที่เคยคุย)</option>
        <option value="198.51.100.99">ผู้ส่ง 198.51.100.99 (คนแปลกหน้า)</option>
      </select>
      <select v-model.number="inPort" class="rounded-md border border-line bg-paper px-2 py-1.5" aria-label="พอร์ตสาธารณะปลายทาง">
        <option>50000</option><option>40000</option><option>8080</option>
      </select>
      <label class="flex items-center gap-2"><input v-model="forward" type="checkbox" class="accent-current" /> เปิด port forward 8080 → 192.168.1.20:80</label>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="unsolicited">ส่งเข้ามา</button>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="mb-2 text-xs text-mute">ตารางแปลง NAT (ใน ↔ นอก)</p>
        <p v-if="!table.length" class="text-mute">ว่าง ลองกด "ส่งออก"</p>
        <ul class="grid gap-1 font-mono text-xs">
          <li v-for="(r, i) in table" :key="i" class="break-words border-b border-line pb-1 last:border-0">
            {{ i + 1 }}. {{ r.pip }}:{{ r.pport }} ↔ <b>{{ PUBLIC_IP }}:{{ r.pub }}</b> <span class="text-mute">· คู่สนทนา {{ r.rip }}:{{ r.rport }}</span>
          </li>
        </ul>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-sm" aria-live="polite">
        <p class="mb-2 text-xs text-mute">บันทึกการทำงาน</p>
        <ul class="grid gap-1.5 text-xs leading-relaxed">
          <li v-for="(l, i) in log" :key="i" :class="i === log.length - 1 ? 'font-semibold' : 'text-mute'">{{ l }}</li>
        </ul>
      </div>
    </div>
    <p class="mt-3 text-xs text-mute">ที่อยู่ในสื่อนี้เป็นช่วงสำหรับเอกสารตัวอย่าง (RFC 5737) ตารางจริงบน Linux (conntrack) เก็บข้อมูลละเอียดกว่านี้ เช่น สถานะ TCP และตัวจับเวลา</p>
  </figure>
</template>
