<script setup lang="ts">
// เคอร์เนลส่งแพ็กเก็ตขาเข้าไปยัง socket ตาม (โปรโตคอล, พอร์ตปลายทาง) และ 4-tuple (จำลอง)
type Proto = 'TCP' | 'UDP'
interface Listener { proto: Proto; port: number; app: string }
interface Conn { src: string; sport: number; dport: number; app: string }

const listeners = ref<Listener[]>([
  { proto: 'TCP', port: 22, app: 'sshd' },
  { proto: 'TCP', port: 443, app: 'nginx' },
  { proto: 'UDP', port: 53, app: 'dnsmasq' },
])
const conns = ref<Conn[]>([])
const log = ref<string[]>(['เซิร์ฟเวอร์ 10.0.0.5 พร้อมรับ: TCP 22 (sshd) · TCP 443 (nginx) · UDP 53 (dnsmasq)'])

const clients = [
  { ip: '10.0.0.77', label: 'A 10.0.0.77' },
  { ip: '10.0.0.80', label: 'B 10.0.0.80' },
  { ip: '198.51.100.9', label: 'C 198.51.100.9' },
]
const proto = ref<Proto>('TCP')
const client = ref(clients[0]!.ip)
const sport = ref(51234)
const dport = ref(443)
const kind = ref<'SYN' | 'DATA'>('SYN')
const firewall = ref(false)
const ports = [22, 53, 80, 443, 3389]
const sports = [51234, 51235, 40012]

function push(msg: string) {
  log.value.push(msg)
  if (log.value.length > 8) log.value.shift()
}

function send() {
  const head = `${proto.value} ${client.value}:${sport.value} → :${dport.value}${proto.value === 'TCP' ? ` [${kind.value}]` : ''}`
  if (firewall.value && dport.value !== 22) {
    push(`${head}  ⇒ ไฟร์วอลล์ DROP เงียบๆ ไม่มีคำตอบ ฝั่งส่งรอจน timeout`)
    return
  }
  const l = listeners.value.find(x => x.proto === proto.value && x.port === dport.value)
  if (!l) {
    push(proto.value === 'TCP'
      ? `${head}  ⇒ ไม่มีโปรแกรมฟังพอร์ตนี้ เคอร์เนลตอบ TCP RST ฝั่งส่งเห็น "Connection refused" ทันที`
      : `${head}  ⇒ ไม่มีโปรแกรมฟังพอร์ตนี้ เคอร์เนลตอบ ICMP Port Unreachable`)
    return
  }
  if (proto.value === 'UDP') {
    push(`${head}  ⇒ ส่งให้ ${l.app} ทันที (UDP ไม่มีสถานะ ไม่ต้อง handshake)`)
    return
  }
  const existing = conns.value.find(c => c.src === client.value && c.sport === sport.value && c.dport === dport.value)
  if (kind.value === 'SYN') {
    if (existing) {
      push(`${head}  ⇒ 4-tuple นี้มีการเชื่อมต่ออยู่แล้ว (SYN ซ้ำ) เคอร์เนลไม่สร้างใหม่`)
      return
    }
    conns.value.push({ src: client.value, sport: sport.value, dport: dport.value, app: l.app })
    push(`${head}  ⇒ ${l.app} รอฟังอยู่ ตอบ SYN-ACK แล้วสร้างแถวใหม่ในตารางการเชื่อมต่อ`)
  } else if (existing) {
    push(`${head}  ⇒ ตรงกับการเชื่อมต่อที่มี ส่งข้อมูลเข้า socket ของ ${existing.app} ตัวเดิม`)
  } else {
    push(`${head}  ⇒ ไม่มีการเชื่อมต่อนี้ในตาราง (ยังไม่ผ่าน handshake) เคอร์เนลตอบ RST`)
  }
}

function bindSecond() {
  const l = listeners.value.find(x => x.proto === proto.value && x.port === dport.value)
  if (l) {
    push(`โปรแกรมที่สองสั่ง bind ${proto.value} ${dport.value} ⇒ ล้มเหลว "Address already in use" (EADDRINUSE) เพราะ ${l.app} ถือพอร์ตนี้อยู่`)
  } else {
    listeners.value.push({ proto: proto.value, port: dport.value, app: 'app2' })
    push(`bind ${proto.value} ${dport.value} สำเร็จ (ยังไม่มีใครถือ) ตอนนี้ app2 ฟังพอร์ตนี้ ลองส่งแพ็กเก็ตไปที่พอร์ตนี้ดู`)
  }
}

function reset() {
  listeners.value = [
    { proto: 'TCP', port: 22, app: 'sshd' },
    { proto: 'TCP', port: 443, app: 'nginx' },
    { proto: 'UDP', port: 53, app: 'dnsmasq' },
  ]
  conns.value = []
  firewall.value = false
  log.value = ['รีเซ็ตแล้ว']
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <label class="grid gap-1">
        <span class="text-xs text-mute">โปรโตคอล</span>
        <select v-model="proto" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option>TCP</option>
          <option>UDP</option>
        </select>
      </label>
      <label class="grid gap-1">
        <span class="text-xs text-mute">ไคลเอนต์ที่ส่ง</span>
        <select v-model="client" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option v-for="c in clients" :key="c.ip" :value="c.ip">{{ c.label }}</option>
        </select>
      </label>
      <label class="grid gap-1">
        <span class="text-xs text-mute">พอร์ตต้นทาง (ชั่วคราว)</span>
        <select v-model="sport" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option v-for="p in sports" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
      <label class="grid gap-1">
        <span class="text-xs text-mute">พอร์ตปลายทาง</span>
        <select v-model.number="dport" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option v-for="p in ports" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <label v-if="proto === 'TCP'" class="flex items-center gap-2">
        <span class="text-xs text-mute">แพ็กเก็ต</span>
        <select v-model="kind" class="rounded-md border border-line bg-paper px-2 py-1.5">
          <option value="SYN">SYN (ขอเชื่อมต่อ)</option>
          <option value="DATA">ข้อมูล (ต้องมีการเชื่อมต่อก่อน)</option>
        </select>
      </label>
      <label class="flex items-center gap-2"><input v-model="firewall" type="checkbox" class="accent-current" /> ไฟร์วอลล์ DROP ทุกพอร์ตยกเว้น 22</label>
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1.5 text-paper" @click="send">ส่งแพ็กเก็ต</button>
      <button type="button" class="rounded-md border border-line px-3 py-1.5 transition hover:border-ink" @click="bindSecond">ให้โปรแกรมที่สอง bind พอร์ตนี้</button>
      <button type="button" class="ml-auto rounded-md border border-line px-3 py-1.5 text-mute transition hover:border-ink" @click="reset">รีเซ็ต</button>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="mb-2 text-xs text-mute">socket ที่ฟังอยู่ (LISTEN / bound)</p>
        <ul class="grid gap-1 font-mono text-xs sm:text-sm">
          <li v-for="l in listeners" :key="l.proto + l.port" class="flex justify-between gap-2 border-b border-line pb-1 last:border-0">
            <span>{{ l.proto }} :{{ l.port }}</span><span class="text-mute">{{ l.app }}</span>
          </li>
        </ul>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="mb-2 text-xs text-mute">ตารางการเชื่อมต่อ TCP (4-tuple ต่อแถว)</p>
        <p v-if="!conns.length" class="text-mute">ว่าง ลองส่ง SYN ไปที่พอร์ต 443 จากไคลเอนต์ A และ B</p>
        <ul class="grid gap-1 font-mono text-xs sm:text-sm">
          <li v-for="(c, i) in conns" :key="i" class="break-words border-b border-line pb-1 last:border-0">
            {{ c.src }}:{{ c.sport }} ↔ :{{ c.dport }} <span class="text-mute">→ {{ c.app }}</span>
          </li>
        </ul>
      </div>
    </div>

    <ul class="mt-3 grid gap-1 rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-6 sm:text-sm" aria-live="polite">
      <li v-for="(l, i) in log" :key="i" class="break-words">{{ l }}</li>
    </ul>

    <p class="mt-3 text-sm leading-7">
      <strong>ลองทำ:</strong> (1) ส่ง SYN จาก A และ B ไปพอร์ต 443 ดูว่าได้ 2 แถวทั้งที่พอร์ตเดียว (2) ส่ง SYN จาก A พอร์ตต้นทาง 51234 กับ 51235 ไปพอร์ต 443 ดูว่าได้ 2 แถวจากเครื่องเดียว (3) ส่งไปพอร์ต 3389 ที่ไม่มีใครฟัง แล้วเปิดไฟร์วอลล์ส่งซ้ำ เทียบ refused กับ timeout
    </p>
    <figcaption class="mt-3 text-sm text-mute">จำลองในหน้าเว็บ ไม่ได้ส่งแพ็กเก็ตจริง พฤติกรรมไฟร์วอลล์ปรับตั้งได้ (DROP เทียบ REJECT)</figcaption>
  </figure>
</template>
