<script setup lang="ts">
// ตรวจใบรับรองทีละข้อเหมือนเบราว์เซอร์: ลายเซ็นไล่ถึง root ที่เชื่อถือ, ช่วงวันที่, ชื่อโฮสต์ (SAN), ส่งใบกลางมาครบ, ถูกเพิกถอน
const today = '2026-10-20'
interface Cert { name: string; issuer: string; from: string; to: string }
interface Scn {
  key: string; label: string; host: string; san: string[]
  chain: Cert[]; sendsIntermediate: boolean; rootTrusted: boolean; revoked?: boolean; sigBad?: boolean
  why: string
}
const root: Cert = { name: 'ISRG Root X1 (ตัวอย่าง)', issuer: 'ตัวเอง (self-signed root)', from: '2015-06-04', to: '2035-06-04' }
const mid: Cert = { name: 'Example Intermediate CA R3', issuer: root.name, from: '2024-03-13', to: '2027-03-12' }
const scenarios: Scn[] = [
  { key: 'ok', label: 'ปกติ', host: 'shop.example.com', san: ['shop.example.com', 'www.example.com'],
    chain: [{ name: 'shop.example.com', issuer: mid.name, from: '2026-09-01', to: '2026-11-30' }, mid, root], sendsIntermediate: true, rootTrusted: true,
    why: 'ผ่านทุกข้อ ล็อกขึ้น' },
  { key: 'exp', label: 'ใบรับรองหมดอายุ', host: 'shop.example.com', san: ['shop.example.com'],
    chain: [{ name: 'shop.example.com', issuer: mid.name, from: '2026-03-01', to: '2026-06-01' }, mid, root], sendsIntermediate: true, rootTrusted: true,
    why: 'เกิดบ่อยที่สุดในโลกจริง: ลืมต่ออายุ ระบบอัตโนมัติ (ACME) ล้มเงียบๆ' },
  { key: 'host', label: 'ชื่อโฮสต์ไม่ตรง', host: 'portal.example.com', san: ['admin.example.com', 'www.example.com'],
    chain: [{ name: 'admin.example.com', issuer: mid.name, from: '2026-09-01', to: '2026-11-30' }, mid, root], sendsIntermediate: true, rootTrusted: true,
    why: 'ใบรับรองถูกต้องแต่ออกให้ชื่ออื่น (ตรงกับคำถามท้ายบทข้อ 2) ลายเซ็นผ่านก็ไม่พอ ต้องตรงชื่อที่เปิดด้วย' },
  { key: 'self', label: 'self-signed (ไม่รู้จักผู้ออก)', host: 'portal.internal', san: ['portal.internal'],
    chain: [{ name: 'portal.internal', issuer: 'portal.internal (เซ็นเอง)', from: '2026-01-01', to: '2036-01-01' }], sendsIntermediate: true, rootTrusted: false,
    why: 'ไม่มีสายลายเซ็นไปถึง root ในที่เก็บที่เชื่อถือ แก้ด้วยการติดตั้ง CA ภายในองค์กรลงเครื่อง ไม่ใช่กด "ข้าม"' },
  { key: 'miss', label: 'เซิร์ฟเวอร์ลืมส่งใบกลาง', host: 'shop.example.com', san: ['shop.example.com'],
    chain: [{ name: 'shop.example.com', issuer: mid.name, from: '2026-09-01', to: '2026-11-30' }, mid, root], sendsIntermediate: false, rootTrusted: true,
    why: 'บางเบราว์เซอร์ไปดึงใบกลางเองได้ (AIA) แต่ curl/API client หลายตัวไม่ได้ จึงเป็น "เปิดในเบราว์เซอร์ได้ แต่สคริปต์ล้ม"' },
  { key: 'rev', label: 'ถูกเพิกถอน (revoked)', host: 'shop.example.com', san: ['shop.example.com'], revoked: true,
    chain: [{ name: 'shop.example.com', issuer: mid.name, from: '2026-09-01', to: '2026-11-30' }, mid, root], sendsIntermediate: true, rootTrusted: true,
    why: 'กุญแจส่วนตัวรั่ว CA จึงเพิกถอนก่อนหมดอายุ ตรวจผ่าน CRL/OCSP (แต่หลายระบบตรวจแบบ soft-fail จึงเป็นจุดอ่อนที่รู้กัน)' },
  { key: 'forged', label: 'ลายเซ็นปลอม/ถูกแก้', host: 'shop.example.com', san: ['shop.example.com'], sigBad: true,
    chain: [{ name: 'shop.example.com', issuer: mid.name, from: '2026-09-01', to: '2026-11-30' }, mid, root], sendsIntermediate: true, rootTrusted: true,
    why: 'ผู้โจมตีแก้ฟิลด์ (เช่น เปลี่ยนชื่อโดเมน) ลายเซ็นของ CA จึงไม่ตรงกับเนื้อหา — นี่คือหน้าที่ของลายเซ็นดิจิทัลที่บท 23 เรียนมา' },
]
const si = ref(0)
const sc = computed(() => scenarios[si.value]!)
const step = ref(0)

interface Check { name: string; ok: boolean; text: string }
const checks = computed<Check[]>(() => {
  const s = sc.value
  const leaf = s.chain[0]!
  const list: Check[] = []
  list.push({ name: '1. ชื่อโฮสต์ตรงกับใบรับรอง (SAN)', ok: s.san.includes(s.host), text: s.san.includes(s.host) ? `${s.host} อยู่ในรายชื่อ ${s.san.join(', ')}` : `เปิด ${s.host} แต่ใบรับรองออกให้ ${s.san.join(', ')}` })
  const inDate = leaf.from <= today && today <= leaf.to
  list.push({ name: `2. อยู่ในช่วงวันที่ (วันนี้ ${today})`, ok: inDate, text: `${leaf.from} ถึง ${leaf.to} → ${inDate ? 'ยังใช้ได้' : (today > leaf.to ? 'หมดอายุแล้ว' : 'ยังไม่ถึงเวลาเริ่ม')}` })
  list.push({ name: '3. ลายเซ็นของ CA ตรงกับเนื้อหาใบรับรอง', ok: !s.sigBad, text: s.sigBad ? 'คำนวณแฮชใหม่แล้วไม่ตรงกับที่ถอดจากลายเซ็น' : 'ถอดลายเซ็นด้วยกุญแจสาธารณะของผู้ออกแล้วตรงกับแฮช' })
  list.push({ name: '4. เซิร์ฟเวอร์ส่งใบกลางมาครบ (หรือดึงเองได้)', ok: s.sendsIntermediate, text: s.sendsIntermediate ? 'สายใบรับรองต่อกันครบ' : 'ขาดใบกลาง จึงต่อสายจากใบปลายทางไป root ไม่ได้ (ถ้าไม่ดึง AIA เอง)' })
  list.push({ name: '5. สายลายเซ็นไปจบที่ root ในที่เก็บที่เชื่อถือ', ok: s.rootTrusted, text: s.rootTrusted ? `จบที่ ${s.chain[s.chain.length - 1]!.name} ซึ่งอยู่ในที่เก็บของระบบ` : 'ผู้ออกคือตัวมันเองและไม่อยู่ในที่เก็บ' })
  list.push({ name: '6. ไม่ถูกเพิกถอน (CRL/OCSP)', ok: !s.revoked, text: s.revoked ? 'CA ประกาศเพิกถอนหมายเลขซีเรียลนี้' : 'ไม่อยู่ในรายการเพิกถอน' })
  return list
})
const shown = computed(() => checks.value.slice(0, step.value))
const firstFail = computed(() => checks.value.find(c => !c.ok))
const finished = computed(() => step.value >= checks.value.length)
watch(si, () => { step.value = 0 })
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-xs font-semibold">① เลือกสถานการณ์ (เบราว์เซอร์เปิด https://{{ sc.host }})</p>
    <div class="mt-2 flex flex-wrap gap-1.5">
      <button v-for="(s, i) in scenarios" :key="s.key" type="button" class="rounded-md border px-2 py-1 text-xs transition" :class="si === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="si = i">{{ s.label }}</button>
    </div>

    <p class="mt-4 text-xs font-semibold">② สายใบรับรองที่เซิร์ฟเวอร์ส่งมา (ล่าง = ใบปลายทาง, บน = root)</p>
    <ol class="mt-2 flex flex-col-reverse gap-1.5">
      <li v-for="(c, i) in sc.chain" :key="c.name + i" class="rounded-lg border border-line bg-paper px-3 py-2 text-xs" :class="i === sc.chain.length - 1 ? 'border-2 border-ink' : ''">
        <b>{{ i === 0 ? 'ใบปลายทาง' : i === sc.chain.length - 1 && sc.rootTrusted ? 'Root (อยู่ในที่เก็บเครื่อง)' : 'ใบกลาง' }}:</b> {{ c.name }}
        <span class="block text-mute">ผู้ออก: {{ c.issuer }} · {{ c.from }} → {{ c.to }}<template v-if="i === 1 && !sc.sendsIntermediate"> · <b>เซิร์ฟเวอร์ไม่ได้ส่งใบนี้มา</b></template></span>
      </li>
    </ol>

    <div class="mt-4 flex flex-wrap gap-1.5">
      <button type="button" class="rounded-md border border-ink bg-ink px-3 py-1 text-xs text-paper disabled:opacity-40" :disabled="finished" @click="step++">ตรวจข้อถัดไป</button>
      <button type="button" class="rounded-md border border-line px-3 py-1 text-xs hover:border-ink" @click="step = checks.length">ตรวจทั้งหมด</button>
      <button type="button" class="rounded-md border border-line px-3 py-1 text-xs hover:border-ink" @click="step = 0">เริ่มใหม่</button>
    </div>

    <ol class="mt-3 space-y-1.5" aria-live="polite">
      <li v-for="c in shown" :key="c.name" class="flex gap-3 rounded-lg border border-line bg-paper px-3 py-2 text-xs">
        <span class="w-14 shrink-0 font-semibold">{{ c.ok ? '✓ ผ่าน' : '✕ ไม่ผ่าน' }}</span>
        <span><b>{{ c.name }}</b><br />{{ c.text }}</span>
      </li>
    </ol>

    <div v-if="finished" class="mt-3 rounded-lg border-2 bg-paper p-3 text-xs" :class="firstFail ? 'border-mute' : 'border-ink'" aria-live="polite">
      <p class="font-bold">{{ firstFail ? '🔒✕ เบราว์เซอร์เตือน/ตัดการเชื่อมต่อ' : '🔒 เชื่อมต่อได้ แสดงกุญแจ' }}</p>
      <p class="mt-1">{{ sc.why }}</p>
    </div>
    <figcaption class="mt-2 text-xs text-mute">จำลองแบบง่าย: ลำดับข้อและรายละเอียดต่างกันตามเบราว์เซอร์/ไลบรารี ชื่อ CA และวันที่เป็นข้อมูลสมมติ (ยกเว้นแนวคิด) · ใบรับรองจริงยังมีฟิลด์ keyUsage, basicConstraints ที่ตรวจด้วย</figcaption>
  </figure>
</template>
