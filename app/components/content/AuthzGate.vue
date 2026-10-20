<script setup lang="ts">
// จำลองลำดับตรวจของเซิร์ฟเวอร์: มี credential ไหม → พิสูจน์ได้ไหม (AuthN) → role → สิทธิ์ (AuthZ) → เจ้าของข้อมูล
interface Who { key: string; label: string; token?: 'none' | 'bad' | 'ok'; user?: string; uid?: number; roles?: string[] }
const people: Who[] = [
  { key: 'none', label: 'ไม่แนบ token', token: 'none' },
  { key: 'bad', label: 'token หมดอายุ/ปลอม', token: 'bad' },
  { key: 'sam', label: 'intern_sam (support)', token: 'ok', user: 'intern_sam', uid: 7, roles: ['support'] },
  { key: 'lee', label: 'ops_lee (backup-operator)', token: 'ok', user: 'ops_lee', uid: 8, roles: ['backup-operator'] },
  { key: 'kim', label: 'admin_kim (admin)', token: 'ok', user: 'admin_kim', uid: 1, roles: ['admin'] },
]
const roleGrants: Record<string, string[]> = {
  'support': ['status:read', 'invoice:read-own', 'user:reset-password'],
  'backup-operator': ['status:read', 'backup:read', 'backup:restore'],
  'admin': ['*'],
}
interface Res { key: string; label: string; need?: string; owner?: number }
const resources: Res[] = [
  { key: 'pub', label: 'GET /public/status (เปิดสาธารณะ)' },
  { key: 'bk', label: 'GET /v1/backups', need: 'backup:read' },
  { key: 'rs', label: 'POST /v1/backups/restore', need: 'backup:restore' },
  { key: 'inv', label: 'GET /v1/users/8/invoice (ของ ops_lee, uid 8)', need: 'invoice:read-own', owner: 8 },
]

const wi = ref(2)
const ri = ref(1)
const ownerCheck = ref(true)
const who = computed(() => people[wi.value]!)
const res = computed(() => resources[ri.value]!)

interface Row { name: string; state: 'pass' | 'fail' | 'skip'; text: string }
const result = computed(() => {
  const rows: Row[] = []
  const w = who.value
  const r = res.value
  const done = (code: number, msg: string) => ({ rows, code, msg })

  if (!r.need) {
    rows.push({ name: '1. ทรัพยากรนี้ต้องล็อกอินไหม', state: 'pass', text: 'ไม่ต้อง: นโยบายเปิดให้ทุกคน (รวมผู้ไม่ระบุตัวตน) จึงข้ามขั้นพิสูจน์ตัวตนและสิทธิ์ ' })
    return done(200, 'OK — อนุญาตโดยไม่ต้องรู้ว่าเป็นใคร (ตอบคำถามท้ายบทข้อ 2)')
  }
  rows.push({ name: '1. ทรัพยากรนี้ต้องล็อกอินไหม', state: 'pass', text: 'ต้อง: ต้องมี credential ก่อนจึงจะตรวจสิทธิ์ได้' })

  if (w.token === 'none') {
    rows.push({ name: '2. มี credential แนบมาไหม', state: 'fail', text: 'ไม่มีหัว Authorization' })
    rows.push({ name: '3. สิทธิ์ (AuthZ)', state: 'skip', text: 'ไม่ถูกตรวจ เพราะยังไม่รู้ว่าเป็นใคร' })
    return done(401, 'Unauthorized (จริงๆ คือ unauthenticated) — พร้อมหัว WWW-Authenticate บอกวิธีพิสูจน์ตัวตน')
  }
  rows.push({ name: '2. มี credential แนบมาไหม', state: 'pass', text: 'มี Authorization: Bearer …' })

  if (w.token === 'bad') {
    rows.push({ name: '3. พิสูจน์ตัวตน (AuthN): ลายเซ็น/วันหมดอายุ', state: 'fail', text: 'ลายเซ็นไม่ตรงหรือเลยเวลา exp จึงเชื่อไม่ได้ว่าเป็นใคร' })
    rows.push({ name: '4. สิทธิ์ (AuthZ)', state: 'skip', text: 'ไม่ถูกตรวจ' })
    return done(401, 'Unauthorized — token ใช้ไม่ได้ ต้องขอใหม่ (ไม่ใช่เรื่องสิทธิ์)')
  }
  rows.push({ name: '3. พิสูจน์ตัวตน (AuthN): ลายเซ็น/วันหมดอายุ', state: 'pass', text: `ถูกต้อง → ตัวตนคือ ${w.user} (uid ${w.uid})` })

  const roles = w.roles!
  const grants = roles.flatMap(x => roleGrants[x] ?? [])
  rows.push({ name: '4. หา role → รายการสิทธิ์', state: 'pass', text: `${roles.join(', ')} → ${grants.join(', ')}` })

  const ok = grants.includes('*') || grants.includes(r.need)
  if (!ok) {
    rows.push({ name: `5. มีสิทธิ์ ${r.need} ไหม`, state: 'fail', text: 'ไม่มีในรายการสิทธิ์ของ role ใดเลย' })
    return done(403, `Forbidden — รู้ว่าเป็น ${w.user} แต่ไม่มีสิทธิ์ ${r.need}`)
  }
  rows.push({ name: `5. มีสิทธิ์ ${r.need} ไหม`, state: 'pass', text: grants.includes('*') ? 'admin มี * (ทุกสิทธิ์)' : 'มีในรายการ' })

  if (r.owner !== undefined && !grants.includes('*')) {
    if (!ownerCheck.value) {
      rows.push({ name: '6. ตรวจว่าเป็นเจ้าของข้อมูลนี้ไหม', state: 'skip', text: 'โค้ดไม่ได้ตรวจ (ช่องโหว่) — แค่ "มีสิทธิ์ประเภทนี้" ก็ผ่าน' })
      return done(200, w.uid === r.owner ? 'OK — เป็นเจ้าของจริง' : `OK — แต่ ${w.user} ไม่ใช่เจ้าของ! ข้อมูลของ uid ${r.owner} รั่ว (IDOR / BOLA)`)
    }
    const mine = w.uid === r.owner
    rows.push({ name: '6. ตรวจว่าเป็นเจ้าของข้อมูลนี้ไหม', state: mine ? 'pass' : 'fail', text: mine ? `uid ${w.uid} = เจ้าของ` : `uid ${w.uid} ≠ เจ้าของ (uid ${r.owner})` })
    if (!mine) return done(403, 'Forbidden — มีสิทธิ์อ่านใบแจ้งหนี้ "ของตัวเอง" แต่ใบนี้ไม่ใช่ของตัวเอง (หลายระบบเลือกตอบ 404 เพื่อไม่บอกว่ามีอยู่)')
  }
  return done(200, 'OK — ผ่านทั้งการพิสูจน์ตัวตนและสิทธิ์')
})
const tone = computed(() => result.value.code === 200 ? 'border-ink' : 'border-mute')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <p class="text-xs font-semibold">① ผู้เรียก (credential ที่แนบมา)</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="(p, i) in people" :key="p.key" type="button" class="rounded-md border px-2 py-1 text-xs transition" :class="wi === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="wi = i">{{ p.label }}</button>
        </div>
      </div>
      <div>
        <p class="text-xs font-semibold">② คำขอ</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="(r, i) in resources" :key="r.key" type="button" class="rounded-md border px-2 py-1 text-left font-mono text-xs transition" :class="ri === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="ri = i">{{ r.label }}</button>
        </div>
        <label v-if="res.owner !== undefined" class="mt-2 flex items-center gap-2 text-xs">
          <input v-model="ownerCheck" type="checkbox" /> เซิร์ฟเวอร์ตรวจ "เป็นเจ้าของข้อมูลนี้ไหม" (เอาออก = ช่องโหว่ IDOR)
        </label>
      </div>
    </div>

    <ol class="mt-4 space-y-1.5" aria-live="polite">
      <li v-for="row in result.rows" :key="row.name" class="flex gap-3 rounded-lg border border-line bg-paper px-3 py-2 text-xs" :class="row.state === 'skip' ? 'text-mute' : ''">
        <span class="w-14 shrink-0 font-semibold">{{ row.state === 'pass' ? '✓ ผ่าน' : row.state === 'fail' ? '✕ ไม่ผ่าน' : '— ข้าม' }}</span>
        <span><b>{{ row.name }}</b><br />{{ row.text }}</span>
      </li>
    </ol>

    <div class="mt-3 rounded-lg border-2 bg-paper p-3" :class="tone" aria-live="polite">
      <p class="font-mono text-sm font-bold">HTTP {{ result.code }}</p>
      <p class="mt-1 text-xs">{{ result.msg }}</p>
    </div>
    <figcaption class="mt-2 text-xs text-mute">จำลองแบบง่ายของ API สมมติ (ผู้ใช้/role/สิทธิ์เป็นข้อมูลตัวอย่าง) ระบบจริงมักมีชั้นเพิ่ม เช่น การเพิกถอน token, ABAC, audit log</figcaption>
  </figure>
</template>
