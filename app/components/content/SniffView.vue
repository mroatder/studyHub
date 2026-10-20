<script setup lang="ts">
// ผู้ดักฟังในเครือข่ายเห็นอะไร: โปรโตคอลไม่เข้ารหัสเทียบกับแบบเข้ารหัส (ข้อมูลสมมติ)
const pairs = [
  { id: 'web', plain: 'HTTP', safe: 'HTTPS', port: ['80', '443'],
    plainLines: ['POST /login HTTP/1.1', 'Host: shop.example', 'Cookie: session=9f3a1c77', '', 'username=somchai&password=Hunter2!'],
    safeLines: ['16 03 03 00 7a 01 00 00 76 03 03 …', '17 03 03 02 1b c4 9e 5d a0 3b e7 91 …', '17 03 03 00 35 7f 20 b8 14 c3 0d aa …'],
    seen: 'ผู้ดักฟังเห็นรหัสผ่าน คุกกี้ และเนื้อหาครบ แก้ไขระหว่างทางได้', safeSeen: 'เห็นเพียง IP ปลายทาง ขนาด เวลา และชื่อเว็บ (SNI) เนื้อหาและรหัสผ่านอ่านไม่ได้ แก้ไขแล้วผู้รับตรวจพบ' },
  { id: 'shell', plain: 'Telnet', safe: 'SSH', port: ['23', '22'],
    plainLines: ['login: admin', 'Password: Winter2026!', 'router# show running-config', 'enable secret 5 $1$x9Qe$…'],
    safeLines: ['SSH-2.0-OpenSSH_9.6 (ข้อความ banner เท่านั้นที่เป็นข้อความ)', '00 00 00 2c 0a 14 5b 77 e1 0f d2 …', '00 00 00 4c 4d 91 ac 3e 08 77 f1 …'],
    seen: 'ทุกตัวอักษรที่พิมพ์ รวมถึงรหัสผ่านและคำสั่ง เดินทางเป็นข้อความธรรมดา', safeSeen: 'เห็นแค่ว่ามีการเชื่อมต่อ SSH และปริมาณข้อมูล รหัสผ่านและคำสั่งถูกเข้ารหัส' },
  { id: 'file', plain: 'FTP', safe: 'SFTP', port: ['21', '22'],
    plainLines: ['USER hr_upload', 'PASS Spring#2026', 'STOR salary_2026.xlsx', '(ไฟล์ส่งผ่านช่องข้อมูลแยกแบบไม่เข้ารหัส)'],
    safeLines: ['SSH-2.0-OpenSSH_9.6', '00 00 04 1c 9a 3d 70 e4 b1 52 …', '00 00 40 24 5c 11 f8 0a 6e 93 …'],
    seen: 'รหัสผ่านอยู่ในช่องควบคุม ชื่อและเนื้อหาไฟล์อยู่ในช่องข้อมูล อ่านได้ทั้งหมด', safeSeen: 'ทั้งการล็อกอินและไฟล์อยู่ในอุโมงค์ SSH เดียวกัน ถูกเข้ารหัสหมด' },
] as const

const tab = ref<(typeof pairs)[number]['id']>('web')
const secure = ref(false)
const p = computed(() => pairs.find((x) => x.id === tab.value)!)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2 text-sm">
      <button v-for="x in pairs" :key="x.id" type="button" class="rounded-md border px-3 py-1.5 transition" :class="tab === x.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="tab === x.id" @click="tab = x.id">{{ x.plain }} / {{ x.safe }}</button>
    </div>
    <div class="mt-3 flex items-center gap-3 text-sm">
      <button type="button" role="switch" :aria-checked="secure" class="relative h-7 w-14 rounded-full border border-ink transition" :class="secure ? 'bg-ink' : 'bg-paper'" @click="secure = !secure">
        <span class="absolute top-0.5 h-5 w-5 rounded-full transition-all motion-reduce:transition-none" :class="secure ? 'left-8 bg-paper' : 'left-1 bg-ink'" />
        <span class="sr-only">สลับเป็นแบบเข้ารหัส</span>
      </button>
      <span>ใช้ <strong>{{ secure ? p.safe : p.plain }}</strong> (พอร์ต {{ secure ? p.port[1] : p.port[0] }})</span>
    </div>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3">
      <p class="text-xs uppercase tracking-wide text-mute">มุมมองของคนที่ดักจับแพ็กเก็ตบนเครือข่าย (เช่น Wireshark)</p>
      <pre class="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-6 sm:text-sm"><template v-for="(l, i) in (secure ? p.safeLines : p.plainLines)" :key="secure + l + i">{{ l }}
</template></pre>
    </div>
    <p class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite"><strong>{{ secure ? 'ปลอดภัยกว่า:' : 'อันตราย:' }}</strong> {{ secure ? p.safeSeen : p.seen }}</p>
    <figcaption class="mt-3 text-sm text-mute">ข้อมูลทั้งหมดเป็นตัวอย่างสมมติเพื่อการเรียนรู้ ไม่ใช่การดักจับจริง</figcaption>
  </figure>
</template>
