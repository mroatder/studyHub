<script setup lang="ts">
// ห้องทดลอง hardening: เซิร์ฟเวอร์ฐานข้อมูลที่ติดตั้งใหม่ กดมาตรการทีละข้อแล้วดูพื้นผิวโจมตีลดลง + กับดักล็อกตัวเองออก (ลำดับกฎไฟร์วอลล์)
interface Item { id: string; label: string; detail: string; kind: 'svc' | 'port' | 'acct' | 'cfg' }
interface Measure { id: string; label: string; cmd: string; removes: string[]; needs?: string; breaks?: string }

// พื้นผิวโจมตีเริ่มต้น (ค่าความเสี่ยง 1–5 เป็นน้ำหนักสมมติเพื่อการสอน ไม่ใช่คะแนนมาตรฐาน)
const surface: (Item & { w: number })[] = [
  { id: 'cups', kind: 'port', w: 3, label: 'cupsd ฟังพอร์ต 631 ทุกอินเทอร์เฟซ', detail: 'บริการพิมพ์บนเครื่องที่ไม่ต้องพิมพ์ มีช่องโหว่ย้อนหลังหลายรายการ' },
  { id: 'ftp', kind: 'port', w: 4, label: 'vsftpd ฟังพอร์ต 21 (ส่งรหัสผ่านแบบข้อความเปล่า)', detail: 'ทีมใช้ SFTP อยู่แล้ว FTP จึงเป็นของเหลือ' },
  { id: 'db', kind: 'port', w: 4, label: 'MySQL ผูก 0.0.0.0:3306', detail: 'ควรให้ฟังเฉพาะ 127.0.0.1 หรือเฉพาะซับเน็ตแอป' },
  { id: 'root', kind: 'acct', w: 5, label: 'SSH ให้ root ล็อกอินด้วยรหัสผ่านได้', detail: 'ชื่อบัญชีที่ผู้โจมตีรู้อยู่แล้ว เหลือแค่เดารหัสผ่าน' },
  { id: 'pw', kind: 'cfg', w: 4, label: 'SSH รับรหัสผ่าน (PasswordAuthentication yes)', detail: 'ถูกเดารหัสผ่านวนซ้ำได้ ต่างจากกุญแจที่เดาไม่ได้ในทางปฏิบัติ' },
  { id: 'guest', kind: 'acct', w: 2, label: 'บัญชีเริ่มต้น/บัญชีทดสอบที่ไม่ใช้แล้ว (test, ubuntu)', detail: 'บัญชีที่ไม่มีใครดูแลคือประตูที่ไม่มีใครสังเกต' },
  { id: 'patch', kind: 'cfg', w: 5, label: 'แพ็กเกจค้างอัปเดต 37 รายการ (มีแพตช์ความปลอดภัย)', detail: 'ช่องโหว่ที่ประกาศแล้ว มีเครื่องมือโจมตีสำเร็จรูป' },
  { id: 'perm', kind: 'cfg', w: 3, label: 'ไฟล์ตั้งค่าอ่านได้ทุกคน (world-readable) เช่น ไฟล์รหัสผ่านแอป', detail: 'ผู้ใช้ทั่วไปหรือโปรเซสที่ถูกยึดอ่านความลับได้' },
  { id: 'fw', kind: 'cfg', w: 4, label: 'ไม่มีไฟร์วอลล์บนเครื่อง (ทุกพอร์ตที่เปิดคือเปิดจริง)', detail: 'ชั้นป้องกันสุดท้ายหายไป ถ้าบริการใดเผลอเปิดก็ถึงมือผู้โจมตีทันที' },
  { id: 'disk', kind: 'cfg', w: 3, label: 'ดิสก์ไม่เข้ารหัส (ขโมยดิสก์ = อ่านข้อมูลได้)', detail: 'ใช้ได้เฉพาะภัยที่ผู้โจมตีถึงตัวเครื่อง/ดิสก์ แต่ผลร้ายแรง' },
  { id: 'log', kind: 'cfg', w: 3, label: 'ไม่เปิดบันทึกความล้มเหลวการล็อกอินและส่งออกนอกเครื่อง', detail: 'ถูกเดารหัสอยู่ก็ไม่รู้ และถ้าผู้โจมตีลบ log ในเครื่องก็ไม่เหลือหลักฐาน' },
]

const measures: Measure[] = [
  { id: 'm-cups', label: 'หยุดและปิดบริการ cups', cmd: 'sudo systemctl disable --now cups', removes: ['cups'] },
  { id: 'm-ftp', label: 'ถอนการติดตั้ง vsftpd', cmd: 'sudo apt purge vsftpd', removes: ['ftp'] },
  { id: 'm-db', label: 'ให้ MySQL ฟังเฉพาะ localhost (bind-address)', cmd: 'bind-address = 127.0.0.1', removes: ['db'], breaks: 'แอปที่อยู่คนละเครื่องจะต่อฐานข้อมูลไม่ได้ ต้องใช้ซับเน็ตเฉพาะหรืออุโมงค์ SSH แทน' },
  { id: 'm-key', label: 'ตั้งกุญแจ SSH ให้ผู้ดูแลก่อน (ssh-copy-id) แล้วค่อยปิดรหัสผ่าน', cmd: 'PasswordAuthentication no', removes: ['pw'], needs: 'ต้องใส่กุญแจสาธารณะของผู้ดูแลก่อน' },
  { id: 'm-root', label: 'ปิด root ล็อกอินผ่าน SSH (PermitRootLogin no)', cmd: 'PermitRootLogin no', removes: ['root'] },
  { id: 'm-guest', label: 'ล็อกหรือลบบัญชีที่ไม่ใช้', cmd: 'sudo usermod -L test', removes: ['guest'] },
  { id: 'm-patch', label: 'อัปเดตแพตช์ความปลอดภัย + เปิด unattended-upgrades', cmd: 'sudo apt upgrade && unattended-upgrades', removes: ['patch'], breaks: 'บางบริการต้องรีสตาร์ต/รีบูตเครื่อง ควรกำหนดช่วงเวลาซ่อมบำรุง' },
  { id: 'm-perm', label: 'ลดสิทธิ์ไฟล์ลับ (chmod 600 / chown)', cmd: 'sudo chmod 600 /etc/app/secret.env', removes: ['perm'] },
  { id: 'm-fw-allow', label: 'ไฟร์วอลล์ ขั้น 1: อนุญาต SSH (22/tcp) ก่อน', cmd: 'sudo ufw allow 22/tcp', removes: [] },
  { id: 'm-fw-deny', label: 'ไฟร์วอลล์ ขั้น 2: ตั้ง default deny แล้วเปิดใช้', cmd: 'sudo ufw default deny incoming && sudo ufw enable', removes: ['fw'] },
  { id: 'm-disk', label: 'เข้ารหัสดิสก์ (LUKS ตอนติดตั้ง/ย้ายข้อมูลไปวอลุ่มเข้ารหัส)', cmd: 'cryptsetup luksFormat /dev/sdb1', removes: ['disk'], breaks: 'ทำกับดิสก์ที่มีข้อมูลอยู่ต้องสำรองก่อน และกุญแจ/วลีผ่านหายคือข้อมูลหายถาวร' },
  { id: 'm-log', label: 'เปิดการบันทึกความล้มเหลว + ส่ง log ไปเครื่องกลาง', cmd: 'rsyslog: *.* @@loghost:514', removes: ['log'] },
]

const done = ref<Set<string>>(new Set())
const lockedOut = ref(false)
const msg = ref('')

const remaining = computed(() => surface.filter(s => !done.value.has(`m-${s.id}`) && !removedBy(s.id)))
function removedBy(id: string) {
  return measures.some(m => done.value.has(m.id) && m.removes.includes(id))
}
const maxScore = surface.reduce((a, s) => a + s.w, 0)
const score = computed(() => remaining.value.reduce((a, s) => a + s.w, 0))
const pct = computed(() => Math.round((score.value / maxScore) * 100))

function apply(m: Measure) {
  msg.value = ''
  if (done.value.has(m.id)) return
  if (m.id === 'm-fw-deny' && !done.value.has('m-fw-allow')) {
    lockedOut.value = true
    msg.value = 'เปิด default deny ก่อนอนุญาต 22/tcp: เซสชันเดิมอาจยังอยู่ชั่วคราวเพราะตารางสถานะ แต่เมื่อหลุดหรือเปิดเซสชันใหม่ SSH จะถูกปฏิเสธ ต้องแก้ผ่านคอนโซลของเครื่อง (KVM/คอนโซลคลาวด์)'
    return
  }
  if (m.id === 'm-key' && lockedOut.value) return
  const next = new Set(done.value)
  next.add(m.id)
  done.value = next
  msg.value = m.breaks ? `ทำแล้ว · ข้อควรระวัง: ${m.breaks}` : 'ทำแล้ว'
}
function reset() {
  done.value = new Set()
  lockedOut.value = false
  msg.value = ''
}
function recover() {
  lockedOut.value = false
  msg.value = 'เข้าทางคอนโซลแล้วแก้ลำดับ: ตอนนี้ยังไม่มีกฎใดถูกเปิดใช้ ลองทำขั้น 1 ก่อนแล้วค่อยขั้น 2'
}
const kindLabel: Record<Item['kind'], string> = { svc: 'บริการ', port: 'พอร์ต/บริการ', acct: 'บัญชี', cfg: 'การตั้งค่า' }
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm text-mute">เซิร์ฟเวอร์ฐานข้อมูลที่เพิ่งติดตั้ง · หน้าที่เดียวคือรับ SSH จากผู้ดูแลและให้แอปใช้ MySQL · กดมาตรการทีละข้อ ลองเรียงผิดลำดับดูด้วย</p>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3" role="status" aria-live="polite">
      <div class="flex items-baseline justify-between gap-2 text-sm">
        <span class="font-semibold">ความเสี่ยงคงเหลือ (น้ำหนักสมมติ)</span>
        <span class="font-mono">{{ score }} / {{ maxScore }} · {{ pct }}%</span>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded bg-soft" aria-hidden="true">
        <div class="h-full bg-ink transition-all motion-reduce:transition-none" :style="{ width: pct + '%' }" />
      </div>
      <p v-if="lockedOut" class="mt-2 text-sm font-semibold">✗ ขาดการเชื่อมต่อ: {{ msg }}</p>
      <p v-else-if="msg" class="mt-2 text-sm text-mute">{{ msg }}</p>
      <button v-if="lockedOut" type="button" class="mt-2 rounded-md border border-ink px-3 py-1.5 text-sm" @click="recover">เข้าทางคอนโซลเครื่อง (ยกเลิกผลที่ผิดลำดับ)</button>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <h4 class="text-sm font-semibold">มาตรการ (กดเพื่อทำ)</h4>
        <ul class="mt-2 space-y-2">
          <li v-for="m in measures" :key="m.id">
            <button type="button" class="w-full rounded-md border px-3 py-2 text-left text-sm transition disabled:opacity-60" :class="done.has(m.id) ? 'border-ink bg-paper' : 'border-line hover:border-ink'" :disabled="lockedOut" @click="apply(m)">
              <span class="mr-1">{{ done.has(m.id) ? '✓' : '○' }}</span>{{ m.label }}
              <span class="mt-0.5 block break-all font-mono text-xs text-mute">{{ m.cmd }}</span>
            </button>
          </li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold">พื้นผิวโจมตีที่ยังเหลือ ({{ remaining.length }} จาก {{ surface.length }})</h4>
        <ul class="mt-2 space-y-2">
          <li v-for="s in remaining" :key="s.id" class="rounded-md border border-line bg-paper px-3 py-2 text-sm">
            <span class="mr-1 rounded border border-line px-1 text-xs text-mute">{{ kindLabel[s.kind] }}</span>
            <span class="font-mono text-xs text-mute">w={{ s.w }}</span>
            <span class="mt-0.5 block">{{ s.label }}</span>
            <span class="block text-xs text-mute">{{ s.detail }}</span>
          </li>
          <li v-if="!remaining.length" class="rounded-md border border-ink bg-paper px-3 py-2 text-sm font-semibold">ไม่เหลือรายการในรายการตรวจนี้ แต่ไม่ได้แปลว่าปลอดภัย 100%: ยังมีช่องโหว่ที่ยังไม่รู้ และแอปที่รันบนเครื่อง</li>
        </ul>
      </div>
    </div>

    <button type="button" class="mt-4 rounded-md border border-line px-3 py-1.5 text-sm hover:border-ink" @click="reset">เริ่มใหม่</button>
  </figure>
</template>
