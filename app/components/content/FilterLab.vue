<script setup lang="ts">
// จำลองการจับแพ็กเก็ต: capture filter (BPF) ตัดทิ้งถาวรก่อนบันทึก, display filter แค่ซ่อนจากมุมมอง
interface Pkt { no: number; t: string; src: string; dst: string; proto: string; l4?: 'tcp' | 'udp'; sp?: number; dp?: number; syn?: boolean; code?: number; info: string }
const pkts: Pkt[] = [
  { no: 1, t: '0.000', src: '192.168.1.15', dst: '8.8.8.8', proto: 'DNS', l4: 'udp', sp: 53341, dp: 53, info: 'Standard query A example.com' },
  { no: 2, t: '0.021', src: '8.8.8.8', dst: '192.168.1.15', proto: 'DNS', l4: 'udp', sp: 53, dp: 53341, info: 'Standard query response A 93.184.216.34' },
  { no: 3, t: '0.022', src: '192.168.1.15', dst: '93.184.216.34', proto: 'TCP', l4: 'tcp', sp: 51234, dp: 80, syn: true, info: '51234 → 80 [SYN]' },
  { no: 4, t: '0.060', src: '93.184.216.34', dst: '192.168.1.15', proto: 'TCP', l4: 'tcp', sp: 80, dp: 51234, syn: true, info: '80 → 51234 [SYN, ACK]' },
  { no: 5, t: '0.060', src: '192.168.1.15', dst: '93.184.216.34', proto: 'TCP', l4: 'tcp', sp: 51234, dp: 80, info: '51234 → 80 [ACK]' },
  { no: 6, t: '0.061', src: '192.168.1.15', dst: '93.184.216.34', proto: 'HTTP', l4: 'tcp', sp: 51234, dp: 80, info: 'GET /index.html HTTP/1.1' },
  { no: 7, t: '0.102', src: '93.184.216.34', dst: '192.168.1.15', proto: 'HTTP', l4: 'tcp', sp: 80, dp: 51234, code: 200, info: 'HTTP/1.1 200 OK' },
  { no: 8, t: '0.250', src: '192.168.1.5', dst: '192.168.1.15', proto: 'SSH', l4: 'tcp', sp: 40022, dp: 22, info: 'Client: Encrypted packet' },
  { no: 9, t: '0.251', src: '192.168.1.15', dst: '192.168.1.5', proto: 'SSH', l4: 'tcp', sp: 22, dp: 40022, info: 'Server: Encrypted packet' },
  { no: 10, t: '0.400', src: 'aa:bb:cc:00:00:15', dst: 'Broadcast', proto: 'ARP', info: 'Who has 192.168.1.1? Tell 192.168.1.15' },
  { no: 11, t: '0.401', src: 'aa:bb:cc:00:00:01', dst: 'aa:bb:cc:00:00:15', proto: 'ARP', info: '192.168.1.1 is at aa:bb:cc:00:00:01' },
  { no: 12, t: '0.520', src: '192.168.1.15', dst: '93.184.216.34', proto: 'HTTP', l4: 'tcp', sp: 51234, dp: 80, info: 'GET /missing.png HTTP/1.1' },
  { no: 13, t: '0.561', src: '93.184.216.34', dst: '192.168.1.15', proto: 'HTTP', l4: 'tcp', sp: 80, dp: 51234, code: 404, info: 'HTTP/1.1 404 Not Found' },
  { no: 14, t: '0.700', src: '192.168.1.15', dst: '142.250.4.100', proto: 'TLSv1.3', l4: 'tcp', sp: 49812, dp: 443, info: 'Application Data' },
]
const isIp = (p: Pkt) => /^\d/.test(p.src)
const X = '192.168.1.5'

const newSemantics = ref(true)
const captures: { label: string; test: (p: Pkt) => boolean; note: string }[] = [
  { label: '(ไม่กรอง)', test: () => true, note: 'บันทึกทุกเฟรมที่ผ่านการ์ด' },
  { label: 'port 53', test: p => p.sp === 53 || p.dp === 53, note: 'BPF: เก็บเฉพาะเฟรมที่พอร์ตต้นทางหรือปลายทางเป็น 53 (DNS)' },
  { label: 'host 192.168.1.5', test: p => p.src === X || p.dst === X, note: 'BPF: เก็บเฉพาะเฟรม IP ที่ต้นทางหรือปลายทางเป็นเครื่องนี้' },
  { label: 'tcp port 80', test: p => p.l4 === 'tcp' && (p.sp === 80 || p.dp === 80), note: 'BPF: เก็บเฉพาะ TCP พอร์ต 80 (HTTP)' },
]
const displays = computed(() => [
  { label: '(ไม่กรอง)', test: (_: Pkt) => true, note: 'แสดงทุกแพ็กเก็ตที่บันทึกไว้' },
  { label: 'dns', test: (p: Pkt) => p.proto === 'DNS', note: 'โปรโตคอล DNS (ตัวถอดรหัสของ Wireshark จำแนกจากเนื้อหา ไม่ใช่แค่หมายเลขพอร์ต)' },
  { label: 'tcp.flags.syn == 1', test: (p: Pkt) => !!p.syn, note: 'เฟรม TCP ที่ตั้งธง SYN ใช้หาจุดเริ่มต้นการเชื่อมต่อ (รวม SYN-ACK)' },
  { label: 'http.response.code == 404', test: (p: Pkt) => p.code === 404, note: 'คำตอบ HTTP ว่าไม่พบไฟล์' },
  { label: 'tcp.port == 443 || udp.port == 53', test: (p: Pkt) => (p.l4 === 'tcp' && (p.sp === 443 || p.dp === 443)) || (p.l4 === 'udp' && (p.sp === 53 || p.dp === 53)), note: 'HTTPS หรือ DNS' },
  { label: 'ip.addr == 192.168.1.5', test: (p: Pkt) => isIp(p) && (p.src === X || p.dst === X), note: 'มีเครื่องนี้เป็นต้นทางหรือปลายทาง' },
  {
    label: 'ip.addr != 192.168.1.5',
    test: (p: Pkt) => isIp(p) && (newSemantics.value ? p.src !== X && p.dst !== X : p.src !== X || p.dst !== X),
    note: newSemantics.value
      ? 'Wireshark ≥ 3.6: != คือนิเสธของ == จึงตัดแพ็กเก็ตของเครื่องนี้ออกจริง (เฟรม ARP ไม่มีหัว IP จึงไม่ตรงทั้งสองกรณี)'
      : 'Wireshark เก่า (< 3.6): ตรงเมื่อ "มีฟิลด์ใดฟิลด์หนึ่ง" ไม่เท่ากับ จึงแพ็กเก็ตของเครื่องนี้ยังโผล่ เพราะอีกฝั่งไม่ใช่มัน',
  },
  { label: '!(ip.addr == 192.168.1.5)', test: (p: Pkt) => !(isIp(p) && (p.src === X || p.dst === X)), note: 'นิเสธทั้งนิพจน์: ตัดเครื่องนี้ออกได้ถูกในทุกรุ่น (เฟรม ARP ที่ไม่มี IP ก็ถือว่า "ไม่ใช่เครื่องนี้" จึงแสดง)' },
])

const ci = ref(0)
const di = ref(0)
const cap = computed(() => captures[ci.value]!)
const dis = computed(() => displays.value[di.value]!)
const rows = computed(() => pkts.map((p) => {
  const stored = cap.value.test(p)
  return { p, stored, shown: stored && dis.value.test(p) }
}))
const stored = computed(() => rows.value.filter(r => r.stored).length)
const shown = computed(() => rows.value.filter(r => r.shown).length)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <p class="text-xs font-semibold">① Capture filter (BPF) · ทำงานก่อนบันทึก</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="(c, i) in captures" :key="c.label" type="button" class="rounded-md border px-2 py-1 font-mono text-xs transition" :class="ci === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="ci = i">{{ c.label }}</button>
        </div>
        <p class="mt-2 text-xs text-mute">{{ cap.note }}</p>
      </div>
      <div>
        <p class="text-xs font-semibold">② Display filter · ทำงานหลังบันทึก</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="(d, i) in displays" :key="d.label" type="button" class="rounded-md border px-2 py-1 text-left font-mono text-xs transition" :class="di === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="di = i">{{ d.label }}</button>
        </div>
        <p class="mt-2 text-xs text-mute">{{ dis.note }}</p>
        <label v-if="dis.label.startsWith('ip.addr !=')" class="mt-2 flex items-center gap-2 text-xs">
          <input v-model="newSemantics" type="checkbox" /> จำลอง Wireshark รุ่น ≥ 3.6 (ถ้าเอาออก = พฤติกรรมรุ่นเก่า)
        </label>
      </div>
    </div>

    <div class="mt-4 overflow-x-auto rounded-lg border border-line bg-paper">
      <table class="w-full min-w-[560px] border-collapse text-left text-xs">
        <thead class="text-mute">
          <tr class="border-b border-line"><th class="px-2 py-1.5">No.</th><th class="px-2">Time</th><th class="px-2">Source</th><th class="px-2">Destination</th><th class="px-2">Proto</th><th class="px-2">Info</th><th class="px-2">สถานะ</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.p.no" class="border-b border-line/60 last:border-0" :class="r.shown ? '' : 'text-mute'">
            <td class="px-2 py-1 font-mono">{{ r.p.no }}</td>
            <td class="px-2 font-mono">{{ r.p.t }}</td>
            <td class="px-2 font-mono" :class="r.stored ? '' : 'line-through'">{{ r.p.src }}</td>
            <td class="px-2 font-mono" :class="r.stored ? '' : 'line-through'">{{ r.p.dst }}</td>
            <td class="px-2 font-mono">{{ r.p.proto }}</td>
            <td class="px-2" :class="r.stored ? '' : 'line-through'">{{ r.p.info }}</td>
            <td class="whitespace-nowrap px-2 font-semibold">{{ r.shown ? '● แสดง' : r.stored ? '○ ซ่อน (ยังอยู่ในไฟล์)' : '✕ ถูกทิ้งถาวร' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-sm" aria-live="polite">
      เฟรมทั้งหมดบนสาย <b>{{ pkts.length }}</b> → บันทึกไว้ <b>{{ stored }}</b> → แสดง <b>{{ shown }}</b>
      <span v-if="stored < pkts.length" class="text-mute"> · เปลี่ยน display filter กี่ครั้งก็เอาเฟรมที่ ✕ กลับมาไม่ได้</span>
    </p>
    <figcaption class="mt-1 text-xs text-mute">ข้อมูลตัวอย่างสมมติ 14 เฟรม (ไม่ได้จับจากเครือข่ายจริง) · ตัวกรองเป็นชุดสำเร็จรูป ไม่ใช่ตัวแจงไวยากรณ์เต็ม</figcaption>
  </figure>
</template>
