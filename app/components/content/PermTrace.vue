<script setup lang="ts">
// จำลองการตรวจสิทธิ์ของ kernel: ต้องผ่านทุกโฟลเดอร์ในพาธ (ต้องมี x) แล้วจึงตรวจสิทธิ์ที่ตัวไฟล์ โดยเลือกกลุ่มแรกที่ตรงแล้วหยุด
type User = { name: string; groups: string[]; root?: boolean }
const users: User[] = [
  { name: 'alice', groups: ['staff'] },
  { name: 'sam', groups: ['staff'] },
  { name: 'bob', groups: [] },
  { name: 'root', groups: [], root: true },
]
const dirOwner = 'root'
const dirGroup = 'staff'
const fileOwner = 'alice'
const fileGroup = 'staff'

const dirModes = ['711', '750', '755', '700', '770']
const fileModes = ['640', '660', '600', '644', '060', '004']
const userName = ref('sam')
const dirMode = ref('750')
const fileMode = ref('640')
const want = ref<'r' | 'w'>('r')

const user = computed(() => users.find((u) => u.name === userName.value)!)
const bit = (mode: string, scope: 0 | 1 | 2, b: 'r' | 'w' | 'x') => {
  const d = Number(mode[scope])
  return !!(d & { r: 4, w: 2, x: 1 }[b])
}
const sym = (mode: string, scope: 0 | 1 | 2) => `${bit(mode, scope, 'r') ? 'r' : '-'}${bit(mode, scope, 'w') ? 'w' : '-'}${bit(mode, scope, 'x') ? 'x' : '-'}`
const scopeNames = ['เจ้าของ (user)', 'กลุ่ม (group)', 'คนอื่น (others)']

function scopeFor(owner: string, group: string): 0 | 1 | 2 {
  if (user.value.name === owner) return 0
  if (user.value.groups.includes(group)) return 1
  return 2
}

const steps = computed(() => {
  const out: { path: string; need: string; line: string; pass: boolean }[] = []
  if (user.value.root) {
    return { out: [{ path: '(ทุกพาธ)', need: '-', line: 'root ข้ามการตรวจสิทธิ์พื้นฐานทั้งหมด (ยกเว้นบางกรณีที่ระบบกันไว้ เช่น การบังคับใช้ SELinux)', pass: true }], ok: true }
  }
  const ds = scopeFor(dirOwner, dirGroup)
  const dPass = bit(dirMode.value, ds, 'x')
  out.push({
    path: '/shared',
    need: 'x (เพื่อเข้าโฟลเดอร์)',
    line: `คุณเป็น "${scopeNames[ds]}" ของโฟลเดอร์ → ใช้สิทธิ์ ${sym(dirMode.value, ds)} → ${dPass ? 'มี x ผ่าน' : 'ไม่มี x ไม่ผ่าน'}`,
    pass: dPass,
  })
  if (!dPass) return { out, ok: false }
  const fs = scopeFor(fileOwner, fileGroup)
  const fPass = bit(fileMode.value, fs, want.value)
  out.push({
    path: '/shared/budget.csv',
    need: `${want.value} (${want.value === 'r' ? 'อ่าน' : 'เขียน'})`,
    line: `คุณเป็น "${scopeNames[fs]}" ของไฟล์ → ใช้สิทธิ์ ${sym(fileMode.value, fs)} (หยุดที่กลุ่มแรกที่ตรง) → ${fPass ? 'ผ่าน' : 'ไม่ผ่าน'}`,
    pass: fPass,
  })
  return { out, ok: fPass }
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm leading-7">
      ไฟล์ <code class="font-mono">/shared/budget.csv</code> เจ้าของ <b>alice</b> กลุ่ม <b>staff</b> · โฟลเดอร์ <code class="font-mono">/shared</code> เจ้าของ <b>root</b> กลุ่ม <b>staff</b>
      · alice และ sam อยู่กลุ่ม staff, bob ไม่อยู่
    </p>
    <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
      <label class="block"><span class="text-xs text-mute">ผู้ใช้</span>
        <select v-model="userName" class="mt-1 min-h-10 w-full rounded-md border border-line bg-paper px-2 py-1.5"><option v-for="u in users" :key="u.name" :value="u.name">{{ u.name }}</option></select>
      </label>
      <label class="block"><span class="text-xs text-mute">สิทธิ์ของ /shared</span>
        <select v-model="dirMode" class="mt-1 min-h-10 w-full rounded-md border border-line bg-paper px-2 py-1.5 font-mono"><option v-for="m in dirModes" :key="m" :value="m">{{ m }} (d{{ sym(m, 0) }}{{ sym(m, 1) }}{{ sym(m, 2) }})</option></select>
      </label>
      <label class="block"><span class="text-xs text-mute">สิทธิ์ของ budget.csv</span>
        <select v-model="fileMode" class="mt-1 min-h-10 w-full rounded-md border border-line bg-paper px-2 py-1.5 font-mono"><option v-for="m in fileModes" :key="m" :value="m">{{ m }} (-{{ sym(m, 0) }}{{ sym(m, 1) }}{{ sym(m, 2) }})</option></select>
      </label>
      <label class="block"><span class="text-xs text-mute">ต้องการ</span>
        <select v-model="want" class="mt-1 min-h-10 w-full rounded-md border border-line bg-paper px-2 py-1.5"><option value="r">อ่านไฟล์ (cat)</option><option value="w">เขียนไฟล์ (echo &gt;&gt;)</option></select>
      </label>
    </div>

    <ol class="mt-4 space-y-2 text-sm" aria-live="polite">
      <li v-for="(s, i) in steps.out" :key="i" class="rounded-lg border bg-paper p-3" :class="s.pass ? 'border-line' : 'border-ink'">
        <p class="font-mono text-xs text-mute">{{ i + 1 }}. {{ s.path }} · ต้องมี {{ s.need }}</p>
        <p class="mt-1 leading-7">{{ s.line }}</p>
      </li>
    </ol>
    <p class="mt-3 rounded-lg px-3 py-2 text-sm font-semibold" :class="steps.ok ? 'bg-ink text-paper' : 'border border-ink'">
      {{ steps.ok ? 'ผลลัพธ์: ทำได้' : 'ผลลัพธ์: Permission denied' }}
    </p>
    <p class="mt-3 text-sm leading-7 text-mute">ลองดู 3 อย่าง: (1) เลือก alice กับไฟล์ 060 ทั้งที่กลุ่มมีสิทธิ์ แต่ alice เป็นเจ้าของ จึงถูกตรวจที่เจ้าของก่อนและถูกปฏิเสธ (2) เลือก sam กับโฟลเดอร์ 700 แล้วดูว่าไฟล์ข้างในไม่ช่วยอะไร (3) เลือก root</p>
    <figcaption class="mt-1 text-sm text-mute">แบบจำลองย่อของสิทธิ์พื้นฐาน (ไม่รวม ACL, SELinux และ capability)</figcaption>
  </figure>
</template>
